"use client";

import { SAMPLE_NOTES } from "@/lib/notes";
import type { MatchResponse, TrialMatch } from "@/lib/types";
import { useMemo, useState } from "react";

const STEPS = [
  "Note ingestion",
  "Clinical NER + ICD-10",
  "BioBERT encoder",
  "pgvector retrieval",
  "Eligibility adjudication",
  "RAG report",
];

function ScoreRing({ score, eligible }: { score: number; eligible: boolean }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e7e1d2" strokeWidth="3.5" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={eligible ? "#3f6b4a" : "#c4622d"}
          strokeWidth="3.5"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-mono text-[11px] font-medium">
        {Math.round(score)}
      </span>
    </div>
  );
}

function Verdict({ status }: { status: "matched" | "failed" | "unknown" }) {
  const map = {
    matched: "bg-moss/15 text-moss",
    failed: "bg-danger/10 text-danger",
    unknown: "bg-paper-2 text-mute",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${map[status]}`}>
      {status}
    </span>
  );
}

function MatchCard({ match, open, onToggle }: { match: TrialMatch; open: boolean; onToggle: () => void }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-4 px-5 py-4 text-left"
      >
        <ScoreRing score={match.score} eligible={match.eligible} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-copper">{match.trial.nctId}</span>
            <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[11px] text-mute">
              {match.trial.phase}
            </span>
            <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[11px] text-mute">
              {match.trial.sponsor}
            </span>
            {match.eligible ? (
              <span className="rounded-full bg-moss/15 px-2 py-0.5 text-[11px] text-moss">Eligible</span>
            ) : (
              <span className="rounded-full bg-copper/10 px-2 py-0.5 text-[11px] text-copper">Flagged</span>
            )}
            {match.trial.source === "clinicaltrials.gov" && (
              <span className="rounded-full bg-pine/10 px-2 py-0.5 text-[11px] text-pine">Live CT.gov</span>
            )}
          </div>
          <h3 className="mt-1 font-serif text-lg leading-snug">{match.trial.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-mute">{match.rationale}</p>
        </div>
      </button>
      {open && (
        <div className="border-t border-line px-5 py-4">
          <p className="text-sm leading-relaxed text-ink/80">{match.trial.summary}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="kicker">Inclusion</p>
              <ul className="mt-2 space-y-2">
                {match.inclusion.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3 text-sm">
                    <span>
                      {c.text}
                      {c.evidence && <span className="mt-0.5 block text-xs text-mute">{c.evidence}</span>}
                    </span>
                    <Verdict status={c.status} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="kicker">Exclusion</p>
              <ul className="mt-2 space-y-2">
                {match.exclusion.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3 text-sm">
                    <span>
                      {c.text}
                      {c.evidence && <span className="mt-0.5 block text-xs text-mute">{c.evidence}</span>}
                    </span>
                    <Verdict status={c.status} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4">
            <p className="kicker">Retrieved criteria</p>
            <div className="mt-2 space-y-2">
              {match.ragSnippets.map((s) => (
                <blockquote
                  key={s}
                  className="border-l-2 border-copper/60 pl-3 font-serif text-sm leading-relaxed text-ink/80"
                >
                  {s}
                </blockquote>
              ))}
            </div>
          </div>
          <a
            href={`https://clinicaltrials.gov/study/${match.trial.nctId}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm text-pine underline decoration-line underline-offset-4 hover:decoration-pine"
          >
            Open on ClinicalTrials.gov
          </a>
        </div>
      )}
    </article>
  );
}

export function MatchStudio({ compact = false }: { compact?: boolean }) {
  const [note, setNote] = useState(SAMPLE_NOTES[0].text);
  const [activeSample, setActiveSample] = useState(SAMPLE_NOTES[0].id);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const wordCount = useMemo(() => note.trim().split(/\s+/).filter(Boolean).length, [note]);

  async function run() {
    setError(null);
    setLoading(true);
    setStep(0);
    setResult(null);
    setOpenId(null);
    const started = Date.now();
    const tick = window.setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 220);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, live: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Match failed");
      const wait = Math.max(0, 1100 - (Date.now() - started));
      await new Promise((r) => setTimeout(r, wait));
      setResult(data as MatchResponse);
      setOpenId((data as MatchResponse).matches[0]?.trial.nctId ?? null);
      setStep(STEPS.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Match failed");
    } finally {
      window.clearInterval(tick);
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "" : "mx-auto max-w-6xl px-5 py-10"}>
      {!compact && (
        <div className="mb-8 max-w-2xl">
          <p className="kicker">Matching engine</p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.1] sm:text-5xl">
            Paste a note. Rank recruiting trials.
          </h1>
          <p className="mt-4 text-mute leading-relaxed">
            Synthetic notes only. The engine extracts ICD-10 and phenotype, embeds the
            patient vector, and adjudicates inclusion/exclusion against ClinicalTrials.gov
            criteria.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl border border-line bg-card p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {SAMPLE_NOTES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActiveSample(s.id);
                  setNote(s.text);
                  setResult(null);
                }}
                className={`rounded-full px-3 py-1 text-[12px] transition ${
                  activeSample === s.id
                    ? "bg-pine text-[#f3efe4]"
                    : "bg-paper-2 text-mute hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setActiveSample("");
            }}
            spellCheck={false}
            className="h-[340px] w-full resize-y rounded-2xl border border-line bg-paper px-4 py-3 font-mono text-[13px] leading-relaxed text-ink outline-none focus:border-pine/40"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-mute">{wordCount} words · unstructured</p>
            <button
              type="button"
              onClick={run}
              disabled={loading}
              className="rounded-full bg-copper px-5 py-2.5 text-sm font-medium text-[#faf7ef] transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Running pipeline…" : "Run matching"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-card p-5">
          <p className="kicker">Pipeline</p>
          <ol className="mt-4 space-y-2">
            {STEPS.map((label, i) => {
              const on = step >= i;
              return (
                <li
                  key={label}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                    on ? "bg-paper-2 text-ink" : "text-mute"
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full font-mono text-[11px] ${
                      on ? "bg-pine text-[#f3efe4]" : "bg-paper text-mute"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {label}
                </li>
              );
            })}
          </ol>
          {error && <p className="mt-4 text-sm text-danger">{error}</p>}
          {result && (
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-paper p-3">
                <p className="text-xs text-mute">ICD-10 extracted</p>
                <p className="mt-1 font-serif text-2xl">{result.phenotype.icd10.length}</p>
              </div>
              <div className="rounded-xl bg-paper p-3">
                <p className="text-xs text-mute">Eligible / ranked</p>
                <p className="mt-1 font-serif text-2xl">
                  {result.matches.filter((m) => m.eligible).length}
                  <span className="text-base text-mute">/{result.matches.length}</span>
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {result && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="h-fit rounded-3xl border border-line bg-card p-5">
            <p className="kicker">Patient phenotype</p>
            <h2 className="mt-2 font-serif text-2xl">
              {result.phenotype.age ?? "—"}
              {result.phenotype.sex !== "unknown" ? ` · ${result.phenotype.sex}` : ""}
              {result.phenotype.stage ? ` · Stage ${result.phenotype.stage}` : ""}
            </h2>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {result.phenotype.icd10.map((c) => (
                <span
                  key={c.code}
                  className="rounded-full border border-line bg-paper px-2.5 py-1 font-mono text-[11px]"
                  title={c.label}
                >
                  {c.code}
                  <span className="ml-1 text-mute">{Math.round(c.confidence * 100)}%</span>
                </span>
              ))}
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Diagnoses</dt>
                <dd className="text-right">{result.phenotype.diagnoses.join(", ") || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mute">ECOG</dt>
                <dd>{result.phenotype.ecog ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Biomarkers</dt>
                <dd className="text-right">
                  {Object.entries(result.phenotype.biomarkers)
                    .map(([k, v]) => `${k} ${v}`)
                    .join(" · ") || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Labs</dt>
                <dd className="text-right">
                  {Object.entries(result.phenotype.labs)
                    .slice(0, 5)
                    .map(([k, v]) => `${k} ${v}`)
                    .join(" · ") || "—"}
                </dd>
              </div>
            </dl>
            {result.phenotype.quotes[0] && (
              <blockquote className="mt-5 border-l-2 border-pine pl-3 font-serif text-sm leading-relaxed text-ink/80">
                {result.phenotype.quotes[0].text}
              </blockquote>
            )}
          </aside>
          <div className="space-y-3">
            {result.matches.map((m) => (
              <MatchCard
                key={m.trial.nctId}
                match={m}
                open={openId === m.trial.nctId}
                onToggle={() => setOpenId(openId === m.trial.nctId ? null : m.trial.nctId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
