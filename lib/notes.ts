export type SampleNote = {
  id: string;
  label: string;
  area: string;
  text: string;
};

export const SAMPLE_NOTES: SampleNote[] = [
  {
    id: "nsclc",
    label: "Stage IV NSCLC",
    area: "Oncology",
    text: `64-year-old woman, former smoker (18 pack-years), referred from community oncology.

HPI: Progressive dyspnea and dry cough over 8 weeks. CT chest showed a 4.2 cm RUL mass with mediastinal adenopathy and two hepatic lesions. Biopsy: lung adenocarcinoma. Staging PET-CT and MRI brain: Stage IV (T3N2M1b). No brain metastases.

Biomarkers: EGFR wild-type, ALK negative, ROS1 negative, BRAF negative. PD-L1 TPS 62%. ECOG PS 1.

Labs: Hb 12.1 g/dL, creatinine 0.9, eGFR 78. Not pregnant. No active infection.

Assessment: Newly diagnosed metastatic NSCLC, immunotherapy-eligible, no driver mutation.`,
  },
  {
    id: "igan",
    label: "IgA nephropathy",
    area: "Nephrology",
    text: `42-year-old man with biopsy-proven primary IgA nephropathy (Berger's disease) 18 months ago.

Persistent proteinuria despite maximally tolerated ramipril. 24-hour UPCR 1.2 g/g. eGFR 58 mL/min/1.73 m2 (CKD-EPI 2021). BMI 27.4. Weight 81 kg.

BP today 128/78 (average of three). No secondary IgAN, no IgA vasculitis, no recurrent UTIs. Not on complement inhibitors or systemic corticosteroids in the past year.

Assessment: Primary IgAN with persistent proteinuria, preserved eGFR — candidate for disease-modifying trial.`,
  },
  {
    id: "ad",
    label: "Atopic dermatitis",
    area: "Immunology",
    text: `29-year-old woman with chronic atopic dermatitis / atopic eczema since adolescence, continuously active for 8 years.

Failed medium-potency topical corticosteroids (triamcinolone 0.1% and mometasone) and topical tacrolimus. IGA 3, EASI 21, BSA 18%. Intense pruritus, sleep disruption.

No clinically significant autoimmune disease. No active infection. Up to date on immunizations. Not pregnant.

Assessment: Moderate-to-severe AD with inadequate response to TCS.`,
  },
  {
    id: "scd",
    label: "Sickle cell disease",
    area: "Hematology",
    text: `24-year-old man with sickle cell disease, genotype HbSS.

Hb 8.1 g/dL (stable). Four vaso-occlusive crises in the last 12 months, two requiring admission. On hydroxyurea 1500 mg daily, dose stable for 11 months. No RBC transfusion in the past 6 months. BMI 22.

Not pregnant (male). No current hospitalization for VOC.

Assessment: HbSS with recurrent VOCs, eligible for disease-modifying SCD protocol.`,
  },
  {
    id: "obesity",
    label: "Obesity + T2D",
    area: "Metabolic",
    text: `51-year-old woman with obesity and type 2 diabetes.

BMI 34.2 kg/m2. HbA1c 7.4% on metformin 1000 mg BID. Hypertension on lisinopril. Dyslipidemia on atorvastatin. No type 1 diabetes. Not pregnant.

Age 51. Motivated for injectable incretin-class research study.

Assessment: Obesity with T2D and two weight-related comorbidities.`,
  },
  {
    id: "her2",
    label: "HER2+ breast cancer",
    area: "Oncology",
    text: `48-year-old woman with metastatic HER2-positive breast cancer.

Invasive ductal carcinoma, ER 80%, PR 10%, HER2 IHC 3+. De novo Stage IV with bone and liver mets. Prior trastuzumab + pertuzumab + docetaxel, then T-DM1. ECOG 0. No history of interstitial lung disease or pneumonitis. Not pregnant.

Labs unremarkable. Brain MRI negative for metastases.

Assessment: HER2+ MBC after two anti-HER2 lines.`,
  },
  {
    id: "ssc",
    label: "Diffuse systemic sclerosis",
    area: "Rheumatology",
    text: `55-year-old woman with diffuse cutaneous systemic sclerosis (dcSSc), ACR/EULAR 2013.

First non-Raynaud manifestation 22 months ago. mRSS 22. ATA / anti-Scl-70 positive. FVC 72% predicted, DLCO 64%. ECOG 1. Age 55.

No limited cutaneous disease. No cyclophosphamide in the last 12 weeks.

Assessment: Active dcSSc with skin and autoantibody profile suitable for B-cell directed study.`,
  },
  {
    id: "hfref",
    label: "HFrEF",
    area: "Cardiology",
    text: `67-year-old man with HFrEF, NYHA class II.

LVEF 32% on last TTE. NT-proBNP 1840 pg/mL. On carvedilol, furosemide, spironolactone. SBP 118. No pregnancy. eGFR 54.

Assessment: Symptomatic HFrEF with residual NT-proBNP elevation.`,
  },
];
