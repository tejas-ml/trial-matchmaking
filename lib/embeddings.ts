import type { PatientPhenotype, Trial } from "./types";

export const ALIASES: Record<string, string[]> = {
  nsclc: ["nsclc", "non-small cell", "lung cancer", "lung adenocarcinoma", "bronchus"],
  "atopic dermatitis": ["atopic dermatitis", "eczema", "dermatitis"],
  "iga nephropathy": ["iga nephropathy", "igan", "berger", "proteinuria", "kidney"],
  "sickle cell": ["sickle cell", "hbss", "scd", "hemoglobinopathy"],
  obesity: ["obesity", "overweight", "bmi"],
  "type 2 diabetes": ["type 2 diabetes", "t2d", "t2dm"],
  "heart failure": ["heart failure", "hfref", "chf", "reduced ejection"],
  melanoma: ["melanoma", "braf"],
  "breast cancer": ["breast cancer", "her2", "mammary"],
  "multiple myeloma": ["multiple myeloma", "plasma cell"],
  "systemic sclerosis": ["systemic sclerosis", "scleroderma", "dcssc"],
  "chronic gvhd": ["gvhd", "graft versus host", "graft-versus-host"],
  crohn: ["crohn", "inflammatory bowel"],
  nash: ["nash", "mash", "steatohepatitis"],
  "attr-cm": ["attr", "amyloid", "transthyretin"],
  psoriasis: ["psoriasis"],
  cll: ["cll", "chronic lymphocytic"],
  "colorectal cancer": ["colorectal", "crc", "colon cancer"],
};

const SYN: Record<string, string[]> = Object.fromEntries(
  Object.entries(ALIASES).map(([k, v]) => [k.split(" ")[0], v]),
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+\-%]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function expand(tokens: string[]): string[] {
  const out = [...tokens];
  for (const t of tokens) {
    for (const [k, syns] of Object.entries(SYN)) {
      if (t.includes(k.split(" ")[0]) || k.split(" ").every((p) => tokens.includes(p))) {
        out.push(...syns);
      }
    }
  }
  return out;
}

export function phenotypeDocument(p: PatientPhenotype): string {
  return [
    p.diagnoses.join(" "),
    p.icd10.map((i) => `${i.code} ${i.label}`).join(" "),
    p.symptoms.join(" "),
    p.medications.join(" "),
    p.stage ?? "",
    p.histology ?? "",
    Object.entries(p.biomarkers).map(([k, v]) => `${k} ${v}`).join(" "),
    Object.entries(p.labs).map(([k, v]) => `${k} ${v}`).join(" "),
    p.age != null ? `age ${p.age}` : "",
    p.ecog != null ? `ecog ${p.ecog}` : "",
    p.bmi != null ? `bmi ${p.bmi}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function trialDocument(t: Trial): string {
  return [
    t.title,
    t.conditions.join(" "),
    t.interventions.join(" "),
    t.summary,
    t.therapeuticArea,
    t.inclusion.map((c) => c.text).join(" "),
    t.eligibilityRaw,
  ].join(" ");
}

export function embed(text: string): Map<string, number> {
  const tokens = expand(tokenize(text));
  const tf = new Map<string, number>();
  for (const tok of tokens) tf.set(tok, (tf.get(tok) ?? 0) + 1);
  const n = Math.sqrt([...tf.values()].reduce((s, v) => s + v * v, 0)) || 1;
  for (const [k, v] of tf) tf.set(k, v / n);
  return tf;
}

export function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let s = 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const [k, v] of small) s += v * (large.get(k) ?? 0);
  return s;
}
