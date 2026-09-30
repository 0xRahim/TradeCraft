"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { Reveal, SectionHeading } from "./reveal";

/* ---------- trust strip ---------- */

const INSTRUMENTS = [
  "EURUSD", "GBPUSD", "USDJPY", "NQ", "ES", "XAUUSD", "BTCUSD", "GBPJPY",
  "AUDUSD", "US30", "SPX", "ETHUSD",
];

function TrustStrip() {
  const row = [...INSTRUMENTS, ...INSTRUMENTS];
  return (
    <section aria-label="Supported instruments" className="overflow-hidden border-y border-border py-6">
      <div className="landing-marquee flex w-max items-center gap-3 pr-3">
        {[0, 1].map((half) => (
          <div key={half} aria-hidden={half === 1} className="flex items-center gap-3">
            {row.map((s, i) => (
              <span
                key={`${half}-${s}-${i}`}
                className="rounded-full border border-border px-3 py-1 font-mono text-xs font-medium tracking-[0.02em] text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        ))}
      </div>
      <Reveal delay={0.1}>
        <p className="mt-5 text-center font-mono text-xs text-subtle-foreground">
          FX · INDICES · METALS · CRYPTO — ANY BROKER CSV
        </p>
      </Reveal>
    </section>
  );
}

/* ---------- features ---------- */

const FEATURES: { icon: IconName; tile: string; title: string; body: string }[] = [
  {
    icon: "list",
    tile: "bg-accent text-foreground",
    title: "Trade log that reads like a tape",
    body: "Every idea, side, session, model, and outcome in one filterable log — with R-multiples and net P&L computed automatically.",
  },
  {
    icon: "file",
    tile: "bg-accent text-foreground",
    title: "Screenshot vault",
    body: "Pin entry-model and trade-management shots to each idea, or paste TradingView snapshots straight into the journal.",
  },
  {
    icon: "book",
    tile: "bg-accent text-foreground",
    title: "Daily journal",
    body: "Premarket thesis, checklists, and Markdown reviews with day grades — linked both ways from every trade you take.",
  },
  {
    icon: "bars",
    tile: "bg-accent text-foreground",
    title: "Honest analytics",
    body: "Win rate excluding breakevens, captured R, equity curve, and session heatmaps derived from your executions — never vanity metrics.",
  },
  {
    icon: "up",
    tile: "bg-profit-container text-on-profit-container",
    title: "Broker CSV import",
    body: "Drop in your execution-history export and TradeCraft reconciles fills to ideas by broker order ID. No retyping.",
  },
  {
    icon: "cal",
    tile: "bg-info-container text-on-info-container",
    title: "Session & calendar review",
    body: "A P&L calendar with green-day counts and best-day callouts, plus hour-by-hour London / Frankfurt / New York breakdowns.",
  },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-24 md:px-6">
      <SectionHeading
        eyebrow="Features"
        title="Everything between the idea and the review"
        sub="One workstation for execution, evidence, and reflection — designed for long review sessions, not demo screenshots."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.08}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
              className="h-full rounded-[14px] border border-border bg-card p-6"
            >
              <span className={`grid size-10 place-items-center rounded-[10px] ${f.tile}`}>
                <Icon name={f.icon} />
              </span>
              <h3 className="mt-4 text-[16px] leading-6 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.body}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- workflow ---------- */

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "Import executions",
    body: "Export fills from any broker, drop in the CSV, and select the orders behind each idea. Prices, size, and P&L reconcile themselves.",
  },
  {
    n: "02",
    title: "Journal the idea",
    body: "Attach entry-model screenshots, write the thesis in Markdown, tag the psychology — while the session is still fresh.",
  },
  {
    n: "03",
    title: "Review the tape",
    body: "Grade the day, replay the calendar, and let win rate, captured R, and session stats tell you what to keep and what to cut.",
  },
];

function Workflow() {
  return (
    <section id="how" className="scroll-mt-28 border-y border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-24 md:px-6">
        <SectionHeading
          eyebrow="How it works"
          title="Import. Journal. Review. Repeat."
          sub="A weekly loop that turns raw fills into a playbook you actually follow."
        />
        <div className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
          <div
            aria-hidden="true"
            className="absolute top-4 right-[16%] left-[16%] hidden h-px bg-border md:block"
          />
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12}>
              <div className="relative">
                <p className="relative inline-block bg-card pr-4 font-mono text-sm font-medium text-subtle-foreground">
                  {s.n}
                </p>
                <h3 className="mt-3 text-lg leading-7 font-medium tracking-tight">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- trader feed ---------- */

const FEED: { actor: string; verb: string; object: string; chip: string; chipTone: string; time: string }[] = [
  { actor: "EURUSD", verb: "hit take profit on", object: "London Open Long", chip: "+2.4R", chipTone: "bg-profit-container text-on-profit-container", time: "2m ago" },
  { actor: "NQ", verb: "swept Asia low for", object: "Silver Bullet Short", chip: "+3.1R", chipTone: "bg-profit-container text-on-profit-container", time: "18m ago" },
  { actor: "GBPUSD", verb: "stopped out of", object: "NY Reversal", chip: "-1.0R", chipTone: "bg-loss-container text-on-loss-container", time: "1h ago" },
  { actor: "XAUUSD", verb: "is tracking toward", object: "Daily OB Entry", chip: "Open", chipTone: "bg-info-container text-on-info-container", time: "3h ago" },
];

function TraderFeed() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 md:px-6">
      <SectionHeading
        eyebrow="Review culture"
        title="Your week, told back to you"
        sub="Every entry reads as a sentence — instrument, action, outcome — so a month of trading scans in seconds."
      />
      <div className="mt-12">
        {FEED.map((e, i) => (
          <Reveal key={`${e.actor}-${e.time}`} delay={i * 0.06}>
            <div className="flex gap-3 py-3">
              <span className="grid size-8 flex-none place-items-center rounded-full bg-accent font-mono text-xs font-medium text-muted-foreground">
                {e.actor.slice(0, 2)}
              </span>
              <span aria-hidden="true" className="w-px flex-none bg-border" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-6">
                  <b className="font-medium text-foreground">{e.actor}</b>{" "}
                  <span className="text-muted-foreground">{e.verb}</span>{" "}
                  <b className="font-normal text-foreground">{e.object}</b>
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${e.chipTone}`}>
                    {e.chip}
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                    Journal tracked
                  </span>
                </p>
              </div>
              <span className="flex-none font-mono text-xs text-subtle-foreground">{e.time}</span>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.1}>
        <p className="mt-8 text-center">
          <Link href="/signup" className="text-sm font-medium text-foreground hover:underline hover:underline-offset-4">
            Start your own feed →
          </Link>
        </p>
      </Reveal>
    </section>
  );
}

export function LandingSections() {
  return (
    <>
      <TrustStrip />
      <Features />
      <Workflow />
      <TraderFeed />
    </>
  );
}
