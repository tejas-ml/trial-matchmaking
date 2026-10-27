import type { Criterion, Trial } from "./types";

type CtStudy = {
  protocolSection?: {
    identificationModule?: { nctId?: string; briefTitle?: string };
    statusModule?: { overallStatus?: string };
    sponsorCollaboratorsModule?: { leadSponsor?: { name?: string } };
    descriptionModule?: { briefSummary?: string };
    conditionsModule?: { conditions?: string[] };
    designModule?: { phases?: string[] };
    armsInterventionsModule?: { interventions?: { name?: string }[] };
    eligibilityModule?: { eligibilityCriteria?: string };
    contactsLocationsModule?: { locations?: { country?: string }[] };
  };
};

function heuristicCriteria(raw: string, conditions: string[]): { inclusion: Criterion[]; exclusion: Criterion[] } {
  const lower = raw.toLowerCase();
  const inclusion: Criterion[] = [];
  const exclusion: Criterion[] = [];

  const ageMin = lower.match(/(?:aged?|age)\s*(?:≥|>=|>)?\s*(\d{1,2})\s*(?:years|y)/);
  if (ageMin) {
    inclusion.push({
      id: "age",
      text: `Age ≥ ${ageMin[1]} years`,
      kind: "age",
      field: "age",
      op: "gte",
      value: Number(ageMin[1]),
    });
  } else {
    inclusion.push({
      id: "age",
      text: "Adults (heuristic)",
      kind: "age",
      field: "age",
      op: "gte",
      value: 18,
    });
  }

  if (conditions.length) {
    inclusion.push({
      id: "dx",
      text: `Condition: ${conditions.slice(0, 3).join(", ")}`,
      kind: "diagnosis",
      field: "diagnoses",
      op: "any",
      value: conditions.slice(0, 6).map((c) => c.toLowerCase()),
    });
  }

  if (/pregnan/i.test(raw)) {
    exclusion.push({
      id: "preg",
      text: "Pregnancy (mentioned in eligibility)",
      kind: "flag",
      field: "pregnant",
      op: "eq",
      value: true,
    });
  }
  if (/brain met|cns met/i.test(raw)) {
    exclusion.push({
      id: "cns",
      text: "CNS / brain metastases language present",
      kind: "flag",
      field: "brainMets",
      op: "eq",
      value: true,
    });
  }
  return { inclusion, exclusion };
}

function toTrial(study: CtStudy): Trial | null {
  const p = study.protocolSection;
  if (!p?.identificationModule?.nctId) return null;
  const conditions = p.conditionsModule?.conditions ?? [];
  const raw = p.eligibilityModule?.eligibilityCriteria ?? "";
  const { inclusion, exclusion } = heuristicCriteria(raw, conditions);
  const countries = [...new Set((p.contactsLocationsModule?.locations ?? []).map((l) => l.country).filter(Boolean))] as string[];
  const phases = p.designModule?.phases ?? [];
  return {
    nctId: p.identificationModule.nctId,
    title: p.identificationModule.briefTitle ?? p.identificationModule.nctId,
    sponsor: p.sponsorCollaboratorsModule?.leadSponsor?.name ?? "Unknown sponsor",
    phase: phases[0]?.replace("_", " ") ?? "N/A",
    status: p.statusModule?.overallStatus ?? "UNKNOWN",
    conditions,
    interventions: (p.armsInterventionsModule?.interventions ?? []).map((i) => i.name).filter(Boolean) as string[],
    summary: (p.descriptionModule?.briefSummary ?? "").slice(0, 420),
    locations: countries.slice(0, 6),
    therapeuticArea: conditions[0] ?? "General",
    inclusion,
    exclusion,
    eligibilityRaw: raw.slice(0, 1800),
    source: "clinicaltrials.gov",
  };
}

export async function fetchLiveTrials(condition: string, signal?: AbortSignal): Promise<Trial[]> {
  if (!condition) return [];
  const params = new URLSearchParams({
    "query.cond": condition,
    "filter.overallStatus": "RECRUITING",
    pageSize: "8",
    fields:
      "NCTId,BriefTitle,Condition,EligibilityCriteria,Phase,OverallStatus,LeadSponsorName,BriefSummary,InterventionName,LocationCountry",
  });
  const res = await fetch(`https://clinicaltrials.gov/api/v2/studies?${params}`, {
    signal,
    next: { revalidate: 3600 },
    headers: { accept: "application/json" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { studies?: CtStudy[] };
  return (data.studies ?? []).map(toTrial).filter((t): t is Trial => Boolean(t));
}
