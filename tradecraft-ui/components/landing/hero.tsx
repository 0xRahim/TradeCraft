"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useChartTokens } from "@/components/dashboard/chart-theme";
import { Icon } from "@/components/dashboard/icons";
import { Reveal } from "./reveal";

/* Mini equity series (illustrative product preview, zinc ramp per DESIGN.md). */
const EQUITY = [
  { label: "W1", value: 0 }, { label: "W2", value: 420 }, { label: "W3", value: 310 },
  { label: "W4", value: 890 }, { label: "W5", value: 1240 }, { label: "W6", value: 980 },
  { label: "W7", value: 1710 }, { label: "W8", value: 2140 }, { label: "W9", value: 1980 },
  { label: "W10", value: 2620 }, { label: "W11", value: 2905 },
];

const TILES: { label: string; value: string; tone: string; delta: string }[] = [
  { label: "Net P&L", value: "+$2,905.00", tone: "text-profit", delta: "+8.4%" },
  { label: "Win rate", value: "61.5%", tone: "", delta: "+2.3%" },
  { label: "Trades", value: "44", tone: "", delta: "+5" },
  { label: "Average R:R", value: "1:2.24", tone: "", delta: "+0.11R" },
];

const ROWS: {
  pair: string;
  side: string;
  outcome: "TP" | "SL" | "BE";
  model: string;
  net: string;
  tone: string;
}[] = [
  { pair: "GBPUSD", side: "LONG", outcome: "TP", model: "London reversal", net: "+$486.20", tone: "text-profit" },
  { pair: "EURUSD", side: "SHORT", outcome: "SL", model: "NY reversal", net: "-$103.55", tone: "text-loss" },
  { pair: "NQ", side: "LONG", outcome: "TP", model: "Silver Bullet", net: "+$780.00", tone: "text-profit" },
];

function ProductMock() {
  const t = useChartTokens();
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border border-border bg-card text-left"
    >
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="size-2.5 rounded-full bg-accent" />
        <span className="size-2.5 rounded-full bg-accent" />
        <span className="size-2.5 rounded-full bg-accent" />
        <span className="ml-2 font-mono text-xs text-subtle-foreground">
          tradecraft · dashboard
        </span>
        <span className="ml-auto rounded-full bg-profit-container px-2.5 py-0.5 font-mono text-xs font-medium text-on-profit-container">
          +$2,905.00
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        {TILES.map((k) => (
          <div key={k.label} className="rounded-lg border border-border bg-background p-3">
            <p className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
              {k.label}
            </p>
            <p className={`mt-1 font-mono text-xl leading-7 font-semibold tracking-tight ${k.tone}`}>
              {k.value}
            </p>
            <p className="mt-0.5 font-mono text-xs text-profit">{k.delta}</p>
          </div>
        ))}
      </div>
      <div className="h-44 px-2 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={EQUITY} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="landingEqFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={t.chart1} stopOpacity={0.08} />
                <stop offset="1" stopColor={t.chart1} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={t.grid} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: t.tick, fontSize: 10, fontFamily: t.mono }} dy={4} />
            <YAxis hide domain={["auto", "auto"]} />
            <Area type="monotone" dataKey="value" stroke={t.chart1} strokeWidth={2} fill="url(#landingEqFill)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="border-t border-border">
        {ROWS.map((r) => (
          <div
            key={`${r.pair}-${r.net}`}
            className="flex items-center gap-3 border-b border-border px-4 py-2.5 font-mono text-[13px] last:border-b-0"
          >
            <span className="font-medium text-foreground">{r.pair}</span>
            <span className="text-muted-foreground">{r.side}</span>
            <span
              className={[
                "rounded-full px-2 py-px text-xs font-medium",
                r.outcome === "TP"
                  ? "bg-profit-container text-on-profit-container"
                  : r.outcome === "SL"
                    ? "bg-loss-container text-on-loss-container"
                    : "bg-accent text-muted-foreground",
              ].join(" ")}
            >
              {r.outcome}
            </span>
            <span className="hidden truncate text-muted-foreground sm:block">{r.model}</span>
            <span className={`ml-auto font-medium ${r.tone}`}>{r.net}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const mockRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: mockRef,
    offset: ["start end", "end start"],
  });
  const mockY = useTransform(scrollYProgress, [0, 1], [48, -48]);

  return (
    <header className="relative overflow-hidden pt-40 pb-16 md:pt-48">
      <div className="auth-grid-bg" aria-hidden="true" />
      <div className="relative mx-auto max-w-180 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
            <span className="size-1.5 rounded-full bg-profit" aria-hidden="true" />
            Built for discretionary traders
          </p>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 text-[40px] leading-[44px] font-medium tracking-[-0.03em] text-balance sm:text-[56px] sm:leading-[60px]"
        >
          Review every trade like a professional desk would
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-4 max-w-140 text-[15px] leading-7 text-muted-foreground text-balance"
        >
          TradeCraft pairs your broker executions with screenshots, a daily
          journal, and honest analytics — so the next setup starts from
          evidence, not memory.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/signup"
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover"
          >
            Start journaling free
            <Icon name="r" />
          </Link>
          <Link
            href="#features"
            className="flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            See how it works
          </Link>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-6 font-mono text-xs text-subtle-foreground"
        >
          <span className="text-foreground">GBPUSD</span>{" "}
          <span className="text-muted-foreground">closed long at</span>{" "}
          <span className="text-profit">+2.4R</span>
          <span className="mx-2 text-subtle-foreground">·</span>
          <span className="text-foreground">NQ</span>{" "}
          <span className="text-muted-foreground">swept Asia low for</span>{" "}
          <span className="text-profit">+3.1R</span>
        </motion.p>
      </div>
      <div ref={mockRef} className="relative mx-auto mt-14 max-w-5xl px-4">
        <Reveal y={56}>
          <motion.div style={{ y: mockY }}>
            <ProductMock />
          </motion.div>
        </Reveal>
      </div>
    </header>
  );
}
