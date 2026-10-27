import { matchIcd10 } from "./icd10";
import type { PatientPhenotype } from "./types";

const MEDS = [
  "metformin", "insulin", "lisinopril", "losartan", "atorvastatin", "rosuvastatin",
  "hydroxyurea", "pembrolizumab", "nivolumab", "osimertinib", "erlotinib", "gefitinib",
  "afatinib", "trastuzumab", "pertuzumab", "prednisone", "prednisolone", "methylprednisolone",
  "dupilumab", "triamcinolone", "betamethasone", "mometasone", "topical corticosteroid",
  "furosemide", "spironolactone", "carvedilol", "entresto", "sacubitril", "apixaban",
  "lenalidomide", "pomalidomide", "bortezomib", "daratumumab", "carfilzomib",
  "methotrexate", "adalimumab", "infliximab", "ustekinumab",
];

const SYMPTOMS = [
  "dyspnea", "shortness of breath", "cough", "chest pain", "fatigue", "weight loss",
  "night sweats", "pruritus", "itch", "rash", "edema", "proteinuria", "hematuria",
  "arthralgia", "raynaud", "vaso-occlusive", "pain crisis", "diarrhea", "abdominal pain",
  "palpitations", "orthopnea",
];

function num(re: RegExp, text: string): number | null {
  const m = text.match(re);
  if (!m) return null;
  const v = parseFloat((m[1] ?? m[2] ?? "").replace(/,/g, ""));
  return Number.isFinite(v) ? v : null;
}

function quote(label: string, re: RegExp, text: string): { label: string; text: string } | null {
  const m = text.match(re);
  if (!m) return null;
  const start = Math.max(0, (m.index ?? 0) - 24);
  const end = Math.min(text.length, (m.index ?? 0) + m[0].length + 48);
  return { label, text: text.slice(start, end).replace(/\s+/g, " ").trim() };
}

function normalizeStage(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.toUpperCase().replace(/\s+/g, "");
  const map: Record<string, string> = {
    "4": "IV", IV: "IV",
    "3B": "IIIB", IIIB: "IIIB",
    "3C": "IIIC", IIIC: "IIIC",
    "3D": "IIID", IIID: "IIID",
    "3": "III", III: "III",
    "2": "II", II: "II",
    "1": "I", I: "I",
  };
  return map[s] ?? s;
}

export function parseNote(note: string): PatientPhenotype {
  const text = note.replace(/\r/g, "");
  const lower = text.toLowerCase();

  const age =
    num(/(\d{1,3})[-\s]*year[-\s]*old/i, text) ??
    num(/\bage[:\s]+(\d{1,3})\b/i, text);

  let sex: PatientPhenotype["sex"] = "unknown";
  if (/\b(female|woman|she\/her|lady)\b/i.test(text) || /\b(she|her)\b/.test(text.split("\n")[0] ?? "")) {
    sex = "female";
  }
  if (/\b(male|man|he\/him|gentleman)\b/i.test(text) && !/\bfemale\b/i.test(text.split("\n").slice(0, 3).join(" "))) {
    sex = "male";
  }
  if (/\b\d{1,3}[-\s]*year[-\s]*old\s+(woman|female)\b/i.test(text)) sex = "female";
  if (/\b\d{1,3}[-\s]*year[-\s]*old\s+(man|male)\b/i.test(text)) sex = "male";

  const diagnoses: string[] = [];
  const dxPatterns: [string, RegExp][] = [
    ["breast cancer", /breast cancer|invasive ductal carcinoma/i],
    ["melanoma", /melanoma/i],
    ["prostate cancer", /prostate cancer|mcrpc/i],
    ["multiple myeloma", /multiple myeloma/i],
    ["colorectal cancer", /colorectal|colon cancer|\bcrc\b/i],
    ["ovarian cancer", /ovarian cancer|high[-\s]?grade serous/i],
    ["cll", /chronic lymphocytic leukemia|\bcll\b/i],
    ["atopic dermatitis", /atopic dermatitis|atopic eczema/i],
    ["psoriasis", /psoriasis/i],
    ["systemic sclerosis", /systemic sclerosis|scleroderma|dcssc/i],
    ["iga nephropathy", /iga nephropathy|\bigan\b|berger/i],
    ["sickle cell", /sickle cell|\bhbss\b|\bscd\b/i],
    ["type 2 diabetes", /type 2 diabetes|\bt2d\b|\bt2dm\b/i],
    ["type 1 diabetes", /type 1 diabetes|\bt1d\b/i],
    ["obesity", /\bobesity\b|\bobese\b/i],
    ["heart failure", /heart failure|\bhfref\b|\bchf\b/i],
    ["crohn", /crohn/i],
    ["nash", /\bnash\b|\bmash\b|steatohepatitis/i],
    ["attr-cm", /attr|transthyretin amyloid/i],
    ["chronic gvhd", /chronic (graft[-\s]?versus[-\s]?host|gvhd)|\bcgvhd\b/i],
    ["hypertension", /hypertension|\bhtn\b/i],
    ["dyslipidemia", /dyslipidemia|hyperlipidemia|hypercholesterolemia/i],
  ];
  if (/non[-\s]?small cell lung|\bnsclc\b|lung adenocarcinoma/i.test(text)) diagnoses.push("nsclc");
  else if (/\bsmall cell lung|\bsclc\b/i.test(text)) diagnoses.push("small cell lung cancer");
  for (const [label, re] of dxPatterns) {
    if (re.test(text) && !diagnoses.includes(label)) diagnoses.push(label);
  }

  const medications = MEDS.filter((m) => lower.includes(m));
  if (/topical (corticosteroid|steroid)|tcs/i.test(text) && !medications.includes("topical corticosteroid")) {
    medications.push("topical corticosteroid");
  }

  const symptoms = SYMPTOMS.filter((s) => lower.includes(s));

  const labs: Record<string, number> = {};
  const pairs: [string, RegExp][] = [
    ["bmi", /bmi[:\s]*(\d+(?:\.\d+)?)/i],
    ["egfr", /egfr[:\s]*(\d+(?:\.\d+)?)/i],
    ["hba1c", /hba1c[:\s]*(\d+(?:\.\d+)?)/i],
    ["hb", /\bhb(?:g)?[:\s]*(\d+(?:\.\d+)?)\s*g/i],
    ["upcr", /upcr[:\s]*(\d+(?:\.\d+)?)/i],
    ["lvef", /(?:lvef|ejection fraction)[:\s]*(\d+(?:\.\d+)?)/i],
    ["ntprobnp", /nt[-\s]?probnp[:\s]*(\d[\d,]*(?:\.\d+)?)/i],
    ["sbp", /(?:sbp|systolic)[:\s]*(\d{2,3})/i],
    ["pdl1", /pd[-\s]?l1[:\s]*(\d+(?:\.\d+)?)/i],
    ["mrss", /mrss[:\s]*(\d+(?:\.\d+)?)/i],
    ["voc", /(\d+)\s*(?:vocs?|vaso[-\s]?occlusive)/i],
    ["priorLines", /(\d+)\s*(?:prior|previous)\s+lines?/i],
    ["pasi", /pasi[:\s]*(\d+(?:\.\d+)?)/i],
    ["cdai", /cdai[:\s]*(\d+(?:\.\d+)?)/i],
    ["fvc", /fvc[:\s]*(\d+(?:\.\d+)?)/i],
    ["lvwt", /(?:wall thickness|ivs|lvpw)[:\s]*(\d+(?:\.\d+)?)/i],
    ["fibrosis", /fibrosis(?:\s*stage)?[:\s]*f?(\d)/i],
  ];
  for (const [k, re] of pairs) {
    const v = num(re, text);
    if (v != null) labs[k] = v;
  }

  const bmi = labs.bmi ?? null;
  const ecog = num(/ecog(?:\s*ps)?[:\s]*([0-4])/i, text);

  const stage = normalizeStage(
    text.match(/stage\s*(iv|iii[abcd]?|ii[abc]?|i[abc]?|[1-4][abc]?)/i)?.[1] ?? null,
  );

  let histology: string | null = null;
  if (/adenocarcinoma/i.test(text)) histology = "adenocarcinoma";
  if (/squamous/i.test(text)) histology = "squamous";
  if (/high[-\s]?grade serous/i.test(text)) histology = "high-grade serous";

  const biomarkers: Record<string, string> = {};
  if (/egfr[^.\n]{0,40}(exon\s*19|ex19|del19)/i.test(text)) biomarkers.EGFR = "exon19";
  else if (/l858r/i.test(text)) biomarkers.EGFR = "L858R";
  else if (/egfr[^.\n]{0,30}(wild[-\s]?type|wt|negative)/i.test(text)) biomarkers.EGFR = "wild-type";
  else if (/egfr[^.\n]{0,30}(mutant|positive|mutation)/i.test(text)) biomarkers.EGFR = "mutant";

  if (/her2[^.\n]{0,24}(3\+|positive|amplified|ihc\s*3)/i.test(text)) biomarkers.HER2 = "positive";
  else if (/her2[^.\n]{0,24}(negative|0|1\+)/i.test(text)) biomarkers.HER2 = "negative";

  if (/braf[^.\n]{0,24}(v600k)/i.test(text)) biomarkers.BRAF = "V600K";
  else if (/braf[^.\n]{0,24}(v600e|v600)/i.test(text)) biomarkers.BRAF = "V600E";

  if (/msi[-\s]?h|microsatellite instability[-\s]?high/i.test(text)) biomarkers.MSI = "MSI-H";
  if (/dmmr|mismatch repair deficient/i.test(text)) biomarkers.MSI = "dMMR";

  if (/brca1/i.test(text)) biomarkers.BRCA = "BRCA1";
  else if (/brca2/i.test(text)) biomarkers.BRCA = "BRCA2";
  else if (/brca[^.\n]{0,20}(positive|mutant|pathogenic)/i.test(text)) biomarkers.BRCA = "positive";

  if (/anti[-\s]?scl[-\s]?70|ata\+|anti[-\s]?topoisomerase/i.test(text)) biomarkers.SScAb = "ATA";
  else if (/rnap3|rna polymerase iii/i.test(text)) biomarkers.SScAb = "RNAP3";
  else if (/\bana\b[^.\n]{0,20}1:\d+/i.test(text)) biomarkers.SScAb = "ANA";

  if (/alk[^.\n]{0,16}(positive|rearrang)/i.test(text)) biomarkers.ALK = "positive";
  if (/pd[-\s]?l1[:\s]*(\d+)/i.test(text)) {
    const p = num(/pd[-\s]?l1[:\s]*(\d+)/i, text);
    if (p != null) biomarkers.PDL1 = `${p}%`;
  }

  const flags: Record<string, boolean | string> = {};
  const negated = (re: RegExp) => {
    const m = text.match(re);
    if (!m || m.index == null) return false;
    const window = text.slice(Math.max(0, m.index - 18), m.index + m[0].length).toLowerCase();
    return !/\b(no|not|without|denies|negative for)\b/.test(window);
  };
  if (negated(/pregnan/i) && !/\bnot pregnant\b/i.test(text)) flags.pregnant = true;
  if (negated(/brain met|cns met|intracranial met/i)) flags.brainMets = true;
  if (negated(/active infection|sepsis/i)) flags.activeInfection = true;
  if (/transfus(?:ion|ed).{0,24}(90|thirty|30|last month)/i.test(text)) flags.recentTransfusion = true;
  if (/interstitial lung|pneumonitis/i.test(text)) flags.ild = true;
  if (/hospice|comfort care/i.test(text)) flags.hospice = true;
  if (/limited cutaneous/i.test(text)) flags.limitedSsc = true;
  if (/richter/i.test(text)) flags.richter = true;
  if (/light[-\s]?chain amyloid|\bal amyloid/i.test(text)) flags.alAmyloid = true;
  if (/decompensated cirrhosis/i.test(text)) flags.cirrhosis = true;
  if (/former smoker|current smoker|pack[-\s]?year/i.test(text)) flags.smoking = "yes";
  if (/never[-\s]?smoker/i.test(text)) flags.smoking = "never";

  const quotes = [
    quote("demographics", /(\d{1,3})[-\s]*year[-\s]*old.{0,40}/i, text),
    quote("diagnosis", /(nsclc|atopic dermatitis|iga nephropathy|sickle cell|breast cancer|melanoma|heart failure|multiple myeloma|crohn).{0,50}/i, text),
    quote("biomarker", /(egfr|her2|braf|msi|brca|pd[-\s]?l1).{0,40}/i, text),
    quote("labs", /(egfr|hba1c|bmi|lvef|hb|upcr|nt[-\s]?probnp)[:\s]*[\d.]+.{0,20}/i, text),
  ].filter((q): q is { label: string; text: string } => Boolean(q));

  return {
    age,
    sex,
    diagnoses,
    icd10: matchIcd10(text),
    symptoms,
    medications,
    labs,
    biomarkers,
    stage,
    histology,
    ecog,
    bmi,
    flags,
    quotes,
  };
}
