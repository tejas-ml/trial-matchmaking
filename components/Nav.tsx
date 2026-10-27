import Link from "next/link";
import { Logo } from "./Logo";

const links = [
  { href: "/match", label: "Engine" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/corpus", label: "Corpus" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-serif text-xl tracking-tight">HelixMatch</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hidden rounded-full px-3 py-1.5 text-mute transition hover:bg-paper-2 hover:text-ink sm:block"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/match"
            className="ml-2 rounded-full bg-pine px-4 py-2 text-[13px] font-medium text-[#f3efe4] transition hover:bg-pine-2"
          >
            Match a patient
          </Link>
        </nav>
      </div>
    </header>
  );
}
