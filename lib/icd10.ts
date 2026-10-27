export type IcdEntry = {
  code: string;
  label: string;
  terms: string[];
};

export const ICD10: IcdEntry[] = [
  { code: "C34.90", label: "Malignant neoplasm of unspecified part of bronchus or lung", terms: ["nsclc", "non-small cell lung", "lung adenocarcinoma", "lung cancer", "squamous cell lung", "bronchogenic"] },
  { code: "C50.919", label: "Malignant neoplasm of unspecified site of unspecified female breast", terms: ["breast cancer", "her2", "invasive ductal", "mammary carcinoma"] },
  { code: "C43.9", label: "Malignant melanoma of skin, unspecified", terms: ["melanoma", "cutaneous melanoma", "braf v600"] },
  { code: "C61", label: "Malignant neoplasm of prostate", terms: ["prostate cancer", "mcrpc", "metastatic prostate", "adenocarcinoma of the prostate"] },
  { code: "C90.00", label: "Multiple myeloma not having achieved remission", terms: ["multiple myeloma", "plasma cell myeloma", "rr mm"] },
  { code: "C18.9", label: "Malignant neoplasm of colon, unspecified", terms: ["colorectal cancer", "colon cancer", "crc", "rectal adenocarcinoma"] },
  { code: "C56.9", label: "Malignant neoplasm of unspecified ovary", terms: ["ovarian cancer", "high-grade serous", "fallopian tube"] },
  { code: "C71.9", label: "Malignant neoplasm of brain, unspecified", terms: ["glioblastoma", "gbm", "high-grade glioma"] },
  { code: "C91.10", label: "Chronic lymphocytic leukemia of B-cell type not having achieved remission", terms: ["cll", "chronic lymphocytic leukemia", "sll"] },
  { code: "L20.9", label: "Atopic dermatitis, unspecified", terms: ["atopic dermatitis", "atopic eczema", "eczema"] },
  { code: "L40.0", label: "Psoriasis vulgaris", terms: ["psoriasis", "plaque psoriasis"] },
  { code: "M34.0", label: "Progressive systemic sclerosis", terms: ["systemic sclerosis", "scleroderma", "dcssc", "diffuse cutaneous"] },
  { code: "N02.8", label: "Recurrent and persistent hematuria with other morphologic changes", terms: ["iga nephropathy", "igan", "berger's disease", "immunoglobulin a nephropathy"] },
  { code: "N18.3", label: "Chronic kidney disease, stage 3", terms: ["ckd", "chronic kidney disease", "stage 3 ckd"] },
  { code: "D57.1", label: "Sickle-cell disease without crisis", terms: ["sickle cell", "hbss", "scd", "sickle-cell"] },
  { code: "E11.9", label: "Type 2 diabetes mellitus without complications", terms: ["type 2 diabetes", "t2d", "t2dm", "niddm"] },
  { code: "E66.9", label: "Obesity, unspecified", terms: ["obesity", "obese", "overweight"] },
  { code: "I50.22", label: "Chronic systolic (congestive) heart failure", terms: ["heart failure", "hfref", "chf", "reduced ejection fraction", "systolic heart failure"] },
  { code: "I25.10", label: "Atherosclerotic heart disease of native coronary artery without angina pectoris", terms: ["cad", "coronary artery disease", "atherosclerosis"] },
  { code: "E78.00", label: "Pure hypercholesterolemia, unspecified", terms: ["hypercholesterolemia", "hefh", "hofh", "familial hypercholesterolemia", "high ldl"] },
  { code: "E85.4", label: "Organ-limited amyloidosis", terms: ["attr-cm", "transthyretin amyloid", "cardiac amyloidosis", "attr amyloid"] },
  { code: "K50.90", label: "Crohn's disease, unspecified, without complications", terms: ["crohn", "crohn's", "inflammatory bowel"] },
  { code: "K51.90", label: "Ulcerative colitis, unspecified, without complications", terms: ["ulcerative colitis", "uc"] },
  { code: "J45.40", label: "Moderate persistent asthma, uncomplicated", terms: ["asthma", "eosinophilic asthma"] },
  { code: "M06.9", label: "Rheumatoid arthritis, unspecified", terms: ["rheumatoid arthritis", "seropositive ra"] },
  { code: "K75.81", label: "Nonalcoholic steatohepatitis (NASH)", terms: ["nash", "masld", "nafld", "steatohepatitis"] },
  { code: "D89.811", label: "Chronic graft-versus-host disease", terms: ["cgvhd", "graft versus host", "graft-versus-host", "chronic gvhd"] },
  { code: "G35", label: "Multiple sclerosis", terms: ["multiple sclerosis", "rms", "relapsing ms"] },
  { code: "C82.90", label: "Follicular lymphoma, unspecified, unspecified site", terms: ["follicular lymphoma"] },
];

function hasTerm(hay: string, term: string): boolean {
  if (term.length <= 4) {
    return new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(hay);
  }
  return hay.includes(term);
}

export function matchIcd10(text: string): { code: string; label: string; confidence: number }[] {
  const hay = text.toLowerCase();
  const hits: { code: string; label: string; confidence: number; n: number }[] = [];
  for (const entry of ICD10) {
    let n = 0;
    for (const term of entry.terms) {
      if (hasTerm(hay, term)) n += term.length > 12 ? 2 : 1;
    }
    if (n > 0) hits.push({ code: entry.code, label: entry.label, confidence: Math.min(0.97, 0.62 + n * 0.12), n });
  }
  return hits
    .sort((a, b) => b.n - a.n || b.confidence - a.confidence)
    .slice(0, 6)
    .map(({ code, label, confidence }) => ({ code, label, confidence: Number(confidence.toFixed(2)) }));
}
