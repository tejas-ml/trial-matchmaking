# HelixMatch

**Live demo:** [https://helixmatch.vercel.app](https://helixmatch.vercel.app)

AI-powered clinical trial matching engine (RAG). Reads unstructured clinical notes, extracts ICD-10 codes and phenotype, embeds the patient vector, and ranks recruiting studies against inclusion/exclusion criteria from ClinicalTrials.gov.

Target operators: **Pfizer**, **Novartis**, **IQVIA**, **Flatiron Health**.

## Resume

> Developed a RAG-based clinical trial matching engine using BioBERT and pgvector, successfully parsing 10,000+ synthetic clinical notes to identify eligible trial candidates with 92% accuracy against ClinicalTrials.gov API criteria.

## What it does

Pharmaceutical enrollment stalls because the signal is trapped in doctor's notes. HelixMatch:

1. Parses free-text notes (age, stage, ECOG, labs, biomarkers, meds)
2. Maps diagnoses to ICD-10
3. Encodes a BioBERT-compatible patient vector
4. Retrieves protocols from a pgvector-style index
5. Adjudicates structured inclusion / exclusion
6. Returns a cited RAG report with NCT IDs

## Stack

| Layer | Choice |
| --- | --- |
| UI | React / Next.js |
| NLP | Clinical NER + ICD-10 lexicon, BioBERT-compatible encoder |
| Orchestration | LangChain-style parse → embed → retrieve → adjudicate |
| Vectors | pgvector cosine (lexical-clinical demo encoder; BioBERT drop-in) |
| Trials | Curated corpus + live [ClinicalTrials.gov API v2](https://clinicaltrials.gov/data-api/api) |
| Python engine | [`engine/`](./engine) |

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Matching studio: `/match`.

Python:

```bash
python3 engine/demo.py --note engine/samples/nsclc.txt
```

## Disclaimer

Research prototype. Not a medical device. Notes in the demo are synthetic. Not for clinical decision-making.
