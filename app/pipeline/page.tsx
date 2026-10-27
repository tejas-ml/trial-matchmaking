import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pipeline — HelixMatch",
};

const layers = [
  {
    title: "1. Unstructured ingest",
    body: "Clinical notes arrive as free text — H&P, pathology, infusion summaries. No FHIR required for the demo path. Token counts and section cues are retained for citation.",
  },
  {
    title: "2. Clinical NER + ICD-10",
    body: "A lexicon-backed extractor pulls age, sex, stage, ECOG, labs, meds, and biomarkers, then maps diagnoses onto ICD-10. In production this slot is BioBERT / ClinicalBERT NER plus a rules layer for units.",
  },
  {
    title: "3. Embedding",
    body: "The phenotype is serialized into a clinical document and encoded. This demo uses a synonym-expanded lexical encoder drop-in compatible with sentence-transformers BioBERT. Vectors are L2-normalized for cosine search.",
  },
  {
    title: "4. pgvector retrieval",
    body: "Protocol eligibility text is pre-embedded. Approximate nearest neighbor search returns the top-k trials. Live ClinicalTrials.gov recruiting studies for the primary condition are merged into the same index at query time.",
  },
  {
    title: "5. Inclusion / exclusion adjudication",
    body: "Each structured criterion is evaluated against the phenotype: numeric bounds, biomarker membership, hard flags (pregnancy, CNS mets). Unknowns are not treated as fails.",
  },
  {
    title: "6. RAG report",
    body: "The ranked list cites the retrieved eligibility clauses, match evidence, and NCT identifiers so medical affairs can audit why a patient hit a protocol.",
  },
];

export default function PipelinePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="kicker">Architecture</p>
      <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-[1.05]">
        Retrieval-augmented eligibility, not a chatbot over PDFs.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-mute">
        Python reference engine in <span className="font-mono text-sm text-ink">/engine</span>.
        The production web path is this Next.js service: same parser, same ranker,
        optional live CT.gov merge.
      </p>

      <div className="mt-12 overflow-hidden rounded-3xl border border-line bg-card">
        <div className="grid gap-px bg-line md:grid-cols-3">
          {[
            ["LangChain-style chain", "parse → embed → retrieve → adjudicate → generate"],
            ["Vector store", "pgvector cosine over protocol eligibility"],
            ["Generator", "criterion-level rationale + CT.gov citations"],
          ].map(([t, d]) => (
            <div key={t} className="bg-card p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-mute">{t}</p>
              <p className="mt-2 font-serif text-xl leading-snug">{d}</p>
            </div>
          ))}
        </div>
      </div>

      <ol className="mt-12 space-y-6">
        {layers.map((l) => (
          <li key={l.title} className="grid gap-3 border-t border-line pt-6 md:grid-cols-[0.4fr_0.6fr]">
            <h2 className="font-serif text-2xl">{l.title}</h2>
            <p className="text-mute leading-relaxed">{l.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-14 rounded-3xl bg-pine px-8 py-10 text-[#f3efe4]">
        <p className="font-serif text-3xl">Stack</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#d7d0c3]">
          Python · BioBERT-compatible encoder · LangChain-style orchestration ·
          pgvector · React / Next.js · ClinicalTrials.gov API v2. Optional SpaceXAI
          (xAI) Grok pass for narrative rationales when <span className="font-mono">XAI_API_KEY</span> is set.
        </p>
        <Link
          href="/match"
          className="mt-6 inline-flex rounded-full bg-[#f3efe4] px-5 py-2.5 text-sm text-pine"
        >
          Run it on a note
        </Link>
      </div>
    </div>
  );
}
