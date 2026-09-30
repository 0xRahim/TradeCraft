import Link from "next/link";

export function AuthLogo() {
  return (
    <Link
      href="/login"
      className="flex items-center gap-2 text-sm font-semibold tracking-tight"
    >
      <span className="grid size-6 place-items-center rounded-lg bg-primary text-on-primary">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </span>
      TradeCraft
    </Link>
  );
}
