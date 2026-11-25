# HelixMatch

**Live demo:** [https://helixmatch.vercel.app](https://helixmatch.vercel.app)

HelixMatch is a research prototype for matching a patient, described in an unstructured clinical note, to recruiting clinical trials. It parses the note into a structured phenotype, retrieves candidate protocols, and scores each protocol against inclusion and exclusion criteria, returning a cited report with NCT IDs.

## Problem

Trial enrollment is slow in part because eligibility lives in free-text notes (age, stage, ECOG, labs, biomarkers, medications) while protocols are written as inclusion and exclusion rules on ClinicalTrials.gov. HelixMatch is a retrieve-then-adjudicate pipeline that turns a note into a ranked, explained shortlist.

This is a demo, not a medical device. Notes shipped with the repo are synthetic. It is not for clinical decision-making.

## Approach

The web app (`lib/`) and the Python engine (`engine/helixmatch/`) implement the same pipeline:

1. **Parse the note.** A rule-based extractor pulls age, sex, stage, ECOG, BMI, labs, biomarkers, medications, symptoms, and diagnosis mentions (`lib/parser.ts`, `engine/helixmatch/parser.py`).
2. **Map diagnoses to ICD-10.** A lexicon matches terms such as NSCLC or IgA nephropathy to ICD-10 codes with a simple confidence score (`lib/icd10.ts`).
3. **Embed the phenotype.** The demo encoder is a synonym-expanded, L2-normalized lexical vector (token TF, cosine similarity). It is written as a drop-in slot for a BioBERT / sentence-transformers encoder; the running demo does not load BioBERT or any neural model (`lib/embeddings.ts`).
4. **Retrieve protocols.** Candidates come from a curated corpus of **22 recruiting trials** in `data/trials.json` (oncology, cardiology, immunology, and related areas; demo sponsors include Pfizer, Novartis, AstraZeneca, and others). The matcher can also pull up to eight live recruiting studies for a condition from the [ClinicalTrials.gov API v2](https://clinicaltrials.gov/data-api/api) (`lib/live.ts`). Live eligibility text is converted into heuristic structured criteria.
5. **Adjudicate criteria.** Each inclusion and exclusion rule is evaluated as matched, failed, or unknown (unknowns are not treated as failures). Supported kinds include age, ECOG, BMI, lab bounds, stage, diagnosis, medication, biomarker, and flags such as pregnancy or CNS mets (`lib/matcher.ts`).
6. **Rank and explain.** A composite score combines inclusion rate, diagnosis hit rate, criterion specificity, cosine overlap, and Jaccard overlap of conditions. Failed exclusions heavily down-weight a trial. The UI returns NCT IDs, eligibility, evidence snippets, and a short rationale. An optional [xAI](https://x.ai) key (`XAI_API_KEY` in `.env.local`) can add narrative rationales; it is not required.

**Not in the running demo:** BioBERT, LangChain, and Postgres / pgvector. Those are documented as production swap-ins in `engine/README.md` and `engine/requirements.txt`, and are not dependencies of `npm run dev` or `engine/demo.py`.

## Results

There is no evaluation harness or held-out accuracy study in this repository. The landing-page “92% criteria-level accuracy” and “10,000+ notes” figures are hardcoded UI copy, not measurements from a benchmark in the repo, so they are not reported here.

What is in the repo:

- 22 curated, recruiting trial records in `data/trials.json`
- 8 synthetic example notes in `lib/notes.ts`, plus `engine/samples/nsclc.txt` and `engine/samples/igan.txt`

The Python CLI was verified against the NSCLC sample. It extracted ICD-10 `C34.90`, diagnosis `nsclc`, age 64, female, stage IV, ECOG 1, and ranked two Pfizer NSCLC protocols (`NCT06758401`, `NCT07222566`) as eligible, ahead of an EGFR-specific osimertinib trial that was flagged.

## Stack

| Layer | What actually runs |
| --- | --- |
| UI | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Parsing / ICD-10 | Rule-based NER and lexicon (TypeScript and Python twins) |
| Retrieval | Lexical cosine over the local corpus; optional ClinicalTrials.gov API v2 |
| Matching | Structured inclusion / exclusion adjudication + composite ranker |
| Optional LLM | xAI API for narrative rationales |
| Python engine | Stdlib only (`engine/`) |

## Run locally

Node 20+ is recommended.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Matching studio: [http://localhost:3000/match](http://localhost:3000/match). Pipeline overview: `/pipeline`. Corpus: `/corpus`.

Python engine (no third-party packages):

```bash
python3 engine/demo.py --note engine/samples/nsclc.txt
python3 engine/demo.py --note engine/samples/igan.txt --top 8
```

Optional narrative rationales: copy `.env.example` to `.env.local` and set `XAI_API_KEY`.

## License

MIT. See [LICENSE](./LICENSE).
