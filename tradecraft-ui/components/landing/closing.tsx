"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/dashboard/icons";
import { Reveal, SectionHeading } from "./reveal";

/* ---------- pricing ---------- */

type Tier = {
  name: string;
  monthly: number;
  blurb: string;
  cta: string;
  featured?: boolean;
  features: string[];
};

const TIERS: Tier[] = [
  {
    name: "Starter",
    monthly: 0,
    blurb: "For traders starting a review habit.",
    cta: "Start for free",
    features: ["50 trades / month", "Daily journal + grades", "Screenshot vault (100 MB)", "Core analytics"],
  },
  {
    name: "Pro",
    monthly: 12,
    blurb: "For traders reviewing every session.",
    cta: "Start 14-day trial",
    featured: true,
    features: [
      "Unlimited trades + screenshots",
      "Broker CSV import + reconcile",
      "Session heatmaps + P&L calendar",
      "Model & entry analytics",
      "Priority support",
    ],
  },
  {
    name: "Desk",
    monthly: 29,
    blurb: "For funded traders and small teams.",
    cta: "Talk to us",
    features: ["Everything in Pro", "Shared playbooks", "Drawdown guardrails", "Export + API access"],
  },
];

function Pricing() {
  const [yearly, setYearly] = useState(true);
  const price = (t: Tier) =>
    t.monthly === 0 ? "$0" : `$${yearly ? Math.round(t.monthly * 0.75) : t.monthly}`;
  return (
    <section id="pricing" className="scroll-mt-28 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-24 md:px-6">
        <SectionHeading
          eyebrow="Pricing"
          title="Cheaper than one undisciplined trade"
          sub="Start free. Upgrade when the journal pays for itself."
        />
        <Reveal delay={0.1}>
          <div className="mt-8 flex justify-center">
            <div
              role="group"
              aria-label="Billing period"
              className="flex h-8 items-center gap-1 rounded-lg border border-border bg-card p-1"
            >
              {(["Monthly", "Yearly"] as const).map((label) => {
                const active = yearly === (label === "Yearly");
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setYearly(label === "Yearly")}
                    className={`flex h-6 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors ${
                      active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                    {label === "Yearly" ? (
                      <span className="rounded-full bg-profit-container px-1.5 font-mono text-[11px] text-on-profit-container">
                        -25%
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {TIERS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <div
                className={[
                  "flex h-full flex-col rounded-[14px] border p-6",
                  t.featured ? "border-ring bg-card" : "border-border bg-card",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] leading-6 font-semibold">{t.name}</h3>
                  {t.featured ? (
                    <span className="rounded-full bg-accent px-2.5 py-0.5 font-mono text-xs font-medium">
                      Most popular
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
                <p className="mt-4 font-mono text-[32px] leading-9 font-semibold tracking-tight">
                  {price(t)}
                  <span className="font-sans text-sm font-normal text-muted-foreground">
                    {t.monthly === 0 ? " forever" : " / mo"}
                  </span>
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 grid size-4 flex-none place-items-center rounded-full bg-profit-container text-on-profit-container">
                        <Icon name="check" className="size-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={[
                    "mt-6 flex h-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                    t.featured
                      ? "bg-primary text-on-primary hover:bg-primary-hover"
                      : "border border-border text-foreground hover:bg-accent",
                  ].join(" ")}
                >
                  {t.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

const FAQS: { q: string; a: string }[] = [
  {
    q: "Who owns my trading data?",
    a: "You do. Your trades, screenshots, and journal live in your private account, scoped to your login. Export everything any time — there is no lock-in.",
  },
  {
    q: "Which brokers are supported?",
    a: "Any broker with an execution-history CSV export. TradeCraft reconciles fills to ideas by broker order ID, so partial fills and multi-order ideas just work.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. TradeCraft runs entirely in the browser — log a trade from the desk, review the calendar from the couch. Your screenshots upload straight from paste or file picker.",
  },
  {
    q: "How is this different from a spreadsheet?",
    a: "Spreadsheets store numbers; TradeCraft stores evidence. Screenshots, thesis, psychology tags, and day grades stay attached to the fills they explain, and the analytics update themselves.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. Monthly plans cancel in one click and your data stays readable on the free tier. Yearly plans are refunded pro-rata within 30 days.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-28 border-t border-border">
      <div className="mx-auto max-w-3xl px-4 py-24 md:px-6">
        <SectionHeading
          eyebrow="FAQ"
          title="Asked by traders like you"
        />
        <div className="mt-10 overflow-hidden rounded-[14px] border border-border bg-card">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className={i > 0 ? "border-t border-border" : ""}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left"
                >
                  <span className="flex-1 text-[15px] font-medium">{f.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="grid size-7 flex-none place-items-center rounded-lg text-muted-foreground"
                  >
                    <Icon name="chev" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm leading-6 text-muted-foreground">
                        {f.a}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- final CTA ---------- */

function FinalCta() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-24 md:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-16 text-center md:py-20">
            <div className="auth-grid-bg" aria-hidden="true" />
            <div className="relative">
              <p className="font-mono text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
                Free to start · No card required
              </p>
              <h2 className="mx-auto mt-3 max-w-xl text-[32px] leading-[38px] font-medium tracking-[-0.02em] text-balance">
                Your next hundred trades will teach you something. Write them down.
              </h2>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover"
                >
                  Create your journal
                  <Icon name="r" />
                </Link>
                <Link
                  href="/login"
                  className="flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingClosing() {
  return (
    <>
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}
