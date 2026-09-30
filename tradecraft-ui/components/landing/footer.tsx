import Link from "next/link";
import { BrandMark } from "./pill-nav";

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/signup" },
      { label: "Reset password", href: "/forgot-password" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "#" },
      { label: "Privacy", href: "#" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-6">
        <div>
          <BrandMark />
          <p className="mt-3 max-w-64 text-sm leading-6 text-muted-foreground">
            The trading journal and analytics workstation for discretionary
            traders who review their own execution.
          </p>
          <p className="mt-4 flex items-center gap-2 font-mono text-xs text-subtle-foreground">
            <span className="size-1.5 rounded-full bg-profit" aria-hidden="true" />
            All systems operational
          </p>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <p className="font-mono text-[11px] font-medium tracking-[0.06em] text-subtle-foreground uppercase">
              {c.title}
            </p>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-5 font-mono text-xs text-subtle-foreground md:px-6">
          <span>© 2026 TradeCraft</span>
          <span className="ml-auto">Journal first · Review always</span>
        </div>
      </div>
    </footer>
  );
}
