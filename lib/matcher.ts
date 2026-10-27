import { ALIASES, cosine, embed, phenotypeDocument, trialDocument } from "./embeddings";
import type {
  Criterion,
  CriterionVerdict,
  PatientPhenotype,
  Trial,
  TrialMatch,
} from "./types";

function asList(v: Criterion["value"]): Array<string | number> {
  if (Array.isArray(v)) return v.filter((x): x is string | number => typeof x !== "boolean");
  if (v == null || typeof v === "boolean") return [];
  return [v];
}

function diagnosisHit(p: PatientPhenotype, trial: Trial): number {
  const hay = `${trial.title} ${trial.conditions.join(" ")} ${trial.summary}`.toLowerCase();
  if (!p.diagnoses.length) return 0;
  let hits = 0;
  for (const d of p.diagnoses) {
    const aliases = ALIASES[d] ?? [d];
    if (aliases.some((a) => hay.includes(a))) hits += 1;
  }
  return hits / p.diagnoses.length;
}

function haystack(p: PatientPhenotype): string {
  return [
    p.diagnoses.join(" "),
    p.symptoms.join(" "),
    p.medications.join(" "),
    p.histology ?? "",
    p.stage ?? "",
    Object.values(p.biomarkers).join(" "),
    p.icd10.map((i) => i.label).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function getField(p: PatientPhenotype, field?: string): unknown {
  if (!field) return undefined;
  if (field in p) return (p as unknown as Record<string, unknown>)[field];
  if (field in p.labs) return p.labs[field];
  if (field in p.biomarkers) return p.biomarkers[field];
  if (field in p.flags) return p.flags[field];
  if (field === "diagnoses") return p.diagnoses;
  if (field === "medications") return p.medications;
  return undefined;
}

function containsAny(text: string, values: Array<string | number>): boolean {
  return values.some((v) => text.includes(String(v).toLowerCase()));
}

function evalCriterion(
  c: Criterion,
  p: PatientPhenotype,
  isExclusion: boolean,
): CriterionVerdict {
  const fieldVal = getField(p, c.field);
  const hay = haystack(p);

  const unknown = (): CriterionVerdict => ({
    id: c.id,
    text: c.text,
    status: "unknown",
    evidence: "Not stated in note",
  });
  const matched = (evidence: string): CriterionVerdict => ({
    id: c.id,
    text: c.text,
    status: "matched",
    evidence,
  });
  const failed = (evidence: string): CriterionVerdict => ({
    id: c.id,
    text: c.text,
    status: "failed",
    evidence,
  });

  switch (c.kind) {
    case "age": {
      if (p.age == null) return unknown();
      const op = c.op ?? "gte";
      const vals = asList(c.value).map(Number);
      let ok = true;
      if (op === "gte") ok = p.age >= vals[0];
      if (op === "lte") ok = p.age <= vals[0];
      if (op === "between") ok = p.age >= vals[0] && p.age <= vals[1];
      return ok ? matched(`Age ${p.age}`) : failed(`Age ${p.age} outside window`);
    }
    case "ecog": {
      if (p.ecog == null) return unknown();
      const limit = Number(c.value);
      const ok = c.op === "gte" ? p.ecog >= limit : p.ecog <= limit;
      return ok ? matched(`ECOG ${p.ecog}`) : failed(`ECOG ${p.ecog}`);
    }
    case "bmi": {
      if (p.bmi == null) return unknown();
      const vals = asList(c.value).map(Number);
      const op = c.op ?? "gte";
      let ok = true;
      if (op === "gte") ok = p.bmi >= vals[0];
      if (op === "lte") ok = p.bmi <= vals[0];
      if (op === "between") ok = p.bmi >= vals[0] && p.bmi <= vals[1];
      return ok ? matched(`BMI ${p.bmi}`) : failed(`BMI ${p.bmi}`);
    }
    case "lab": {
      const n = typeof fieldVal === "number" ? fieldVal : undefined;
      if (n == null) return unknown();
      const vals = asList(c.value).map(Number);
      const op = c.op ?? "gte";
      let ok = true;
      if (op === "gte") ok = n >= vals[0];
      if (op === "lte") ok = n <= vals[0];
      if (op === "eq") ok = n === vals[0];
      if (op === "between") ok = n >= vals[0] && n <= vals[1];
      return ok ? matched(`${c.field}=${n}`) : failed(`${c.field}=${n} fails ${c.op} ${vals.join("-")}`);
    }
    case "stage": {
      if (!p.stage) return unknown();
      const ok = asList(c.value).map(String).includes(p.stage);
      return ok ? matched(`Stage ${p.stage}`) : failed(`Stage ${p.stage}`);
    }
    case "diagnosis": {
      const values = asList(c.value).map(String);
      const ok = containsAny(hay, values);
      if (isExclusion) {
        return ok ? failed(`Diagnosis overlap: ${values.find((v) => hay.includes(String(v).toLowerCase()))}`) : matched("No excluded diagnosis");
      }
      return ok ? matched(p.diagnoses.join(", ") || "Lexical hit") : failed("No matching diagnosis in note");
    }
    case "medication": {
      const values = asList(c.value).map((v) => String(v).toLowerCase());
      const medHay = p.medications.join(" ").toLowerCase() + " " + hay;
      const ok = values.some((v) => medHay.includes(v));
      if (isExclusion) {
        return ok ? failed(`Excluded drug mentioned`) : matched("No excluded therapy");
      }
      return ok ? matched(p.medications.join(", ") || "Therapy mentioned") : unknown();
    }
    case "biomarker": {
      const raw = fieldVal == null ? "" : String(fieldVal);
      if (!raw) {
        if (containsAny(hay, asList(c.value))) return matched("Mentioned in note");
        return unknown();
      }
      const ok = asList(c.value).some((v) => raw.toLowerCase().includes(String(v).toLowerCase()));
      if (isExclusion) {
        return ok ? failed(`${c.field}=${raw}`) : matched(`${c.field}=${raw}`);
      }
      return ok ? matched(`${c.field}=${raw}`) : failed(`${c.field}=${raw}`);
    }
    case "flag": {
      const present = Boolean(fieldVal);
      if (isExclusion) {
        if (fieldVal == null || fieldVal === false) return matched("Flag not present");
        return present ? failed(`${c.field} present`) : matched("Flag not present");
      }
      if (fieldVal == null) return unknown();
      return present === Boolean(c.value) ? matched(`${c.field}`) : failed(`${c.field}`);
    }
    default: {
      const ok = containsAny(hay, asList(c.value).length ? asList(c.value) : c.text.split(" ").slice(0, 3));
      if (ok) return matched("Lexical support in note");
      return unknown();
    }
  }
}

function jaccard(a: string[], b: string[]): number {
  const ta = new Set(a.join(" ").toLowerCase().split(/\s+/).filter((x) => x.length > 3));
  const tb = new Set(b.join(" ").toLowerCase().split(/\s+/).filter((x) => x.length > 3));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const x of ta) if (tb.has(x)) inter++;
  return inter / new Set([...ta, ...tb]).size;
}

function snippets(trial: Trial, p: PatientPhenotype): string[] {
  const lines = trial.eligibilityRaw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const keys = [...p.diagnoses, ...Object.keys(p.biomarkers), p.stage ?? ""].filter(Boolean);
  const hits = lines.filter((l) => keys.some((k) => l.toLowerCase().includes(k.toLowerCase().slice(0, 8))));
  return (hits.length ? hits : lines).slice(0, 3);
}

function rationale(trial: Trial, eligible: boolean, inc: CriterionVerdict[], exc: CriterionVerdict[]): string {
  const hits = inc.filter((c) => c.status === "matched").map((c) => c.text);
  const fails = [...inc, ...exc].filter((c) => c.status === "failed").map((c) => c.text);
  if (!eligible && fails.length) {
    return `${trial.nctId} is not a clean match: ${fails[0]}. Remaining inclusion still scored for retrieval transparency.`;
  }
  if (hits.length) {
    return `Patient phenotype aligns with ${hits.slice(0, 2).join("; ")}. Retrieved against ${trial.sponsor} ${trial.phase} criteria.`;
  }
  return `Semantic overlap with ${trial.conditions[0] ?? trial.therapeuticArea} protocol language.`;
}

export function scoreTrial(p: PatientPhenotype, trial: Trial, queryVec: Map<string, number>): TrialMatch {
  const inclusion = trial.inclusion.map((c) => evalCriterion(c, p, false));
  const exclusion = trial.exclusion.map((c) => evalCriterion(c, p, true));
  const incKnown = inclusion.filter((c) => c.status !== "unknown");
  const incHit = inclusion.filter((c) => c.status === "matched").length;
  const incFail = inclusion.filter((c) => c.status === "failed").length;
  const excFail = exclusion.filter((c) => c.status === "failed").length;
  const inclusionRate = incKnown.length ? incHit / incKnown.length : 0.4;
  const semantic = cosine(queryVec, embed(trialDocument(trial)));
  const conditionOverlap = jaccard(p.diagnoses, trial.conditions);
  const dx = diagnosisHit(p, trial);
  const specificity = Math.min(1, (trial.inclusion.length || 1) / 4);
  let score =
    34 * inclusionRate +
    26 * dx +
    18 * specificity * inclusionRate +
    12 * semantic +
    8 * conditionOverlap +
    3 * incHit;
  if (excFail === 0 && incFail === 0 && inclusionRate >= 0.5) score += 16;
  if (incFail) score *= 0.58;
  if (excFail) score *= 0.22;
  score = Math.max(4, Math.min(96.8, score));
  const eligible = excFail === 0 && incFail === 0 && inclusionRate >= 0.5;
  return {
    trial,
    score: Number(score.toFixed(1)),
    eligible,
    inclusion,
    exclusion,
    semantic: Number(semantic.toFixed(3)),
    conditionOverlap: Number(conditionOverlap.toFixed(3)),
    ragSnippets: snippets(trial, p),
    rationale: rationale(trial, eligible, inclusion, exclusion),
  };
}

export function rankTrials(p: PatientPhenotype, trials: Trial[]): TrialMatch[] {
  const queryVec = embed(phenotypeDocument(p));
  return trials
    .map((t) => scoreTrial(p, t, queryVec))
    .sort((a, b) => b.score - a.score || Number(b.eligible) - Number(a.eligible));
}
