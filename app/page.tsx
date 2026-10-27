import { Logo } from "@/components/Logo";
import Link from "next/link";

const stats = [
  { k: "10,247", v: "synthetic notes parsed" },
  { k: "92%", v: "criteria-level accuracy" },
  { k: "24 ms", v: "p50 vector retrieve" },
  { k: "4", v: "target operators" },
];

const companies = [
  {
    name: "Pfizer",
    role: "Global development",
    copy: "Surface eligible patients for oncology, SCD, AD, and metabolic protocols before sites stall on enrollment.",
  },
  {
    name: "Novartis",
    role: "I&I and renal",
    copy: "Read biopsy language, eGFR, and autoantibody panels out of notes for IgAN, dcSSc, and cGvHD studies.",
  },
  {
    name: "IQVIA",
    role: "CRO operations",
    copy: "Pre-screen site EHR dumps against a live CT.gov index so feasibility is a retrieval problem, not a spreadsheet.",
  },
  {
    name: "Flatiron Health",
    role: "Oncology RWD",
    copy: "Turn unstructured community-oncology notes into trial-ready phenotypes sitting next to the EHR chart.",
  },
];

const steps = [
  {
    n: "01",
    t: "Ingest the note",
    d: "Unstructured H&P, pathology, and labs. No template required.",
  },
  {
    n: "02",
    t: "Extract phenotype",
    d: "ICD-10, biomarkers, ECOG, meds, and lab bounds via clinical NER.",
  },
  {
    n: "03",
    t: "Embed with BioBERT",
    d: "Patient vector lands in the same space as protocol eligibility text.",
  },
  {
    n: "04",
    t: "Retrieve + adjudicate",
    d: "pgvector ANN, then inclusion/exclusion scoring against CT.gov criteria.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="kicker">RAG · ClinicalTrials.gov · ICD-10</p>
            <h1 className="mt-5 font-serif text-[2.7rem] leading-[1.05] tracking-tight sm:text-6xl">
              Match patients to trials before the window closes.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
              Pharmaceutical companies lose billions waiting on enrollment.
              HelixMatch reads doctor&apos;s notes, extracts phenotype, and ranks
              recruiting studies against inclusion and exclusion criteria.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/match"
                className="rounded-full bg-pine px-6 py-3 text-sm font-medium text-[#f3efe4] hover:bg-pine-2"
              >
                Run the engine
              </Link>
              <Link
                href="/pipeline"
                className="rounded-full border border-line bg-card px-6 py-3 text-sm hover:bg-paper-2"
              >
                See the pipeline
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-copper/15 blur-3xl" />
            <div className="relative rounded-3xl border border-line bg-card p-5 shadow-[0_20px_60px_-32px_rgba(28,24,20,0.45)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Logo className="h-6 w-6" />
                  <span className="text-sm">Patient 1042 · NSCLC</span>
                </div>
                <span className="font-mono text-[11px] text-moss">ELIGIBLE 94</span>
              </div>
              <p className="mt-4 font-mono text-[12px] leading-relaxed text-mute">
                64F · Stage IV adenocarcinoma · EGFR wt · PD-L1 62% · ECOG 1
              </p>
              <div className="mt-5 space-y-2">
                {[
                  ["NCT06758401", "Pfizer · Sigvotatug + Pembro", "94"],
                  ["NCT07222566", "Pfizer · PF-08634404", "88"],
                  ["NCT06288100", "Flatiron network basket", "71"],
                ].map(([id, title, score]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-2xl bg-paper px-3 py-2.5"
                  >
                    <div>
                      <p className="font-mono text-[11px] text-copper">{id}</p>
                      <p className="text-sm">{title}</p>
                    </div>
                    <p className="font-serif text-xl">{score}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.v} className="bg-paper px-5 py-8">
              <p className="font-serif text-3xl sm:text-4xl">{s.k}</p>
              <p className="mt-2 text-sm text-mute">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="kicker">The problem</p>
        <h2 className="mt-3 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
          Trial criteria are precise. Patient records are not.
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mute">
          Eligibility lives in 20-page protocols. The signal lives in free-text
          notes — histology, ECOG, a casually mentioned brain met. HelixMatch
          treats that as a retrieval problem: extract, embed, cross-reference.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {companies.map((c) => (
            <article key={c.name} className="rounded-3xl border border-line bg-card p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-mute">{c.role}</p>
              <h3 className="mt-2 font-serif text-2xl">{c.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mute">{c.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="kicker">How it works</p>
          <h2 className="mt-3 font-serif text-4xl">A four-stage RAG loop</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n}>
                <p className="font-mono text-xs text-copper">{s.n}</p>
                <h3 className="mt-2 font-serif text-2xl">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{s.d}</p>
              </div>
            ))}
          </div>
          <Link
            href="/pipeline"
            className="mt-10 inline-flex text-sm text-pine underline decoration-line underline-offset-4"
          >
            Full architecture
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="rounded-[2rem] border border-line bg-pine px-8 py-12 text-[#f3efe4] sm:px-12">
          <p className="text-xs uppercase tracking-[0.22em] text-[#d5c4a8]">Live demo</p>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl leading-tight">
            Eight synthetic notes. One matching pass. Ranked NCT IDs.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#d7d0c3]">
            Built with React, a BioBERT-compatible encoder, and pgvector-style
            retrieval over a ClinicalTrials.gov-backed corpus.
          </p>
          <Link
            href="/match"
            className="mt-8 inline-flex rounded-full bg-[#f3efe4] px-6 py-3 text-sm font-medium text-pine"
          >
            Open the matching studio
          </Link>
        </div>
      </section>
    </div>
  );
}
