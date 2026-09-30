"use client";

import { useState } from "react";

export type ChartTokens = {
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  grid: string;
  tick: string;
  mono: string;
};

const DARK_DEFAULTS: ChartTokens = {
  chart1: "#FAFAFA",
  chart2: "#A1A1AA",
  chart3: "#71717B",
  chart4: "#3F3F46",
  grid: "#27272A",
  tick: "#71717B",
  mono: "var(--font-geist-mono)",
};

/** Reads the current theme tokens so Recharts props match light/dark mode. */
export function useChartTokens(): ChartTokens {
  const [tokens] = useState<ChartTokens>(() => {
    if (typeof window === "undefined") return DARK_DEFAULTS;
    const cs = getComputedStyle(document.documentElement);
    const get = (name: string, fallback: string) =>
      cs.getPropertyValue(name).trim() || fallback;
    return {
      chart1: get("--chart-1", DARK_DEFAULTS.chart1),
      chart2: get("--chart-2", DARK_DEFAULTS.chart2),
      chart3: get("--chart-3", DARK_DEFAULTS.chart3),
      chart4: get("--chart-4", DARK_DEFAULTS.chart4),
      grid: get("--chart-5", DARK_DEFAULTS.grid),
      tick: get("--subtle-foreground", DARK_DEFAULTS.tick),
      mono: "var(--font-geist-mono)",
    };
  });
  return tokens;
}
