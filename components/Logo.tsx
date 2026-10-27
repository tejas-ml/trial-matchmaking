export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#243f34" />
      <path
        d="M10 7c6 4 6 14 0 18"
        fill="none"
        stroke="#f3efe4"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M22 7c-6 4-6 14 0 18"
        fill="none"
        stroke="#e2c19a"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="16" cy="11" r="1.3" fill="#f3efe4" />
      <circle cx="16" cy="16" r="1.3" fill="#c4622d" />
      <circle cx="16" cy="21" r="1.3" fill="#f3efe4" />
    </svg>
  );
}
