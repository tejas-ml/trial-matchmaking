import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-serif text-2xl">HelixMatch</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-mute">
            Research prototype. Not a medical device and not for clinical decision-making.
            Trial records are retrieved from a curated corpus plus the public ClinicalTrials.gov API.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-mute">
          <Link href="/match" className="hover:text-ink">
            Engine
          </Link>
          <Link href="/pipeline" className="hover:text-ink">
            Pipeline
          </Link>
          <Link href="/corpus" className="hover:text-ink">
            Corpus
          </Link>
        </div>
      </div>
    </footer>
  );
}
