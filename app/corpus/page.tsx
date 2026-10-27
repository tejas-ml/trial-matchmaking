import { CORPUS } from "@/lib/corpus";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corpus — HelixMatch",
};

export default function CorpusPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="kicker">Indexed protocols</p>
      <h1 className="mt-3 font-serif text-5xl">Trial corpus</h1>
      <p className="mt-4 max-w-2xl text-mute leading-relaxed">
        {CORPUS.length} recruiting or active protocols with structured inclusion and
        exclusion criteria. Query-time merge pulls additional recruiting studies
        from ClinicalTrials.gov for the extracted condition.
      </p>
      <div className="mt-10 overflow-hidden rounded-3xl border border-line">
        <div className="hidden grid-cols-[140px_1fr_160px_100px] bg-paper-2 px-4 py-3 text-xs uppercase tracking-[0.16em] text-mute md:grid">
          <span>NCT</span>
          <span>Title</span>
          <span>Sponsor</span>
          <span>Phase</span>
        </div>
        <ul>
          {CORPUS.map((t) => (
            <li key={t.nctId} className="border-t border-line px-4 py-4 md:grid md:grid-cols-[140px_1fr_160px_100px] md:items-baseline md:gap-3">
              <a
                href={`https://clinicaltrials.gov/study/${t.nctId}`}
                className="font-mono text-[12px] text-copper hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {t.nctId}
              </a>
              <div>
                <p className="font-medium leading-snug">{t.title}</p>
                <p className="mt-1 text-sm text-mute">{t.conditions.slice(0, 3).join(" · ")}</p>
              </div>
              <p className="mt-2 text-sm text-mute md:mt-0">{t.sponsor}</p>
              <p className="mt-1 text-sm md:mt-0">{t.phase}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
