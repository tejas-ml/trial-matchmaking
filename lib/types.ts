export type CriterionKind =
  | "age"
  | "sex"
  | "diagnosis"
  | "stage"
  | "biomarker"
  | "lab"
  | "ecog"
  | "bmi"
  | "medication"
  | "flag"
  | "other";

export type CriterionOp =
  | "gte"
  | "lte"
  | "eq"
  | "between"
  | "contains"
  | "in"
  | "exists"
  | "not"
  | "any";

export type Criterion = {
  id: string;
  text: string;
  kind: CriterionKind;
  field?: string;
  op?: CriterionOp;
  value?: string | number | boolean | Array<string | number>;
};

export type Trial = {
  nctId: string;
  title: string;
  sponsor: string;
  phase: string;
  status: string;
  conditions: string[];
  interventions: string[];
  summary: string;
  locations: string[];
  therapeuticArea: string;
  inclusion: Criterion[];
  exclusion: Criterion[];
  eligibilityRaw: string;
  source?: "corpus" | "clinicaltrials.gov";
};

export type Icd10Hit = {
  code: string;
  label: string;
  confidence: number;
};

export type PatientPhenotype = {
  age: number | null;
  sex: "male" | "female" | "unknown";
  diagnoses: string[];
  icd10: Icd10Hit[];
  symptoms: string[];
  medications: string[];
  labs: Record<string, number>;
  biomarkers: Record<string, string>;
  stage: string | null;
  histology: string | null;
  ecog: number | null;
  bmi: number | null;
  flags: Record<string, boolean | string>;
  quotes: { label: string; text: string }[];
};

export type CriterionVerdict = {
  id: string;
  text: string;
  status: "matched" | "failed" | "unknown";
  evidence?: string;
};

export type TrialMatch = {
  trial: Trial;
  score: number;
  eligible: boolean;
  inclusion: CriterionVerdict[];
  exclusion: CriterionVerdict[];
  semantic: number;
  conditionOverlap: number;
  ragSnippets: string[];
  rationale: string;
};

export type PipelineStep = {
  id: string;
  label: string;
  detail: string;
  ms: number;
};

export type MatchResponse = {
  phenotype: PatientPhenotype;
  matches: TrialMatch[];
  pipeline: PipelineStep[];
  stats: {
    corpusSize: number;
    liveRetrieved: number;
    notesSimulated: number;
    accuracy: number;
  };
};
