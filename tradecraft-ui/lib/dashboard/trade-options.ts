export const PAIRS = [
  "EURUSD",
  "GBPUSD",
  "NQ",
  "ES",
  "XAUUSD",
  "BTCUSD",
] as const;
export type Pair = (typeof PAIRS)[number] | string;

export type Side = "long" | "short";
export type Outcome = "TP" | "SL" | "BE";

export const SESSIONS = [
  { value: "london", label: "London" },
  { value: "newyork", label: "New York" },
  { value: "frankfurt", label: "Frankfurt" },
  { value: "no-window", label: "No time window" },
  { value: "london-close", label: "London close" },
] as const;
export type Session = (typeof SESSIONS)[number]["value"];

export const PREV_DAY = [
  { value: "bullish", label: "Bullish" },
  { value: "indecision", label: "Indecision" },
  { value: "bearish", label: "Bearish" },
] as const;

export const H4_TREND = [
  { value: "bullish", label: "Bullish" },
  { value: "bearish", label: "Bearish" },
] as const;

export const PHASES = [
  { value: "main-push", label: "Main push" },
  { value: "complex-pullback", label: "Complex pullback" },
] as const;

export const MODELS = [
  { value: "london-reversal", label: "London reversal" },
  { value: "newyork-reversal", label: "New York reversal" },
  { value: "london-smt-continuation", label: "London SMT continuation" },
  { value: "newyork-smt-continuation", label: "New York SMT continuation" },
  { value: "london-asia50-continuation", label: "London Asia 50% continuation" },
  { value: "usd-news", label: "USD news strategy" },
  { value: "market-mechanics", label: "Market mechanics" },
] as const;
export type Model = (typeof MODELS)[number]["value"];

export const ENTRIES = [
  { value: "bos", label: "BOS" },
  { value: "i-bos", label: "I.BOS" },
  { value: "2lp", label: "2LP" },
  { value: "2lp-min-ind", label: "2LP w/ Min.Ind" },
  { value: "bt", label: "B&T" },
  { value: "minor-inducement", label: "Minor inducement" },
  { value: "smt", label: "SMT" },
  { value: "divergence", label: "Divergence" },
  { value: "m1-engulf", label: "M1 engulfing" },
  { value: "m3-engulf", label: "M3 engulfing" },
  { value: "m5-engulf", label: "M5 engulfing" },
  { value: "no-ltfc", label: "No LTFC" },
] as const;

export const EXEC_TYPES = [
  { value: "limit", label: "Limit" },
  { value: "market", label: "Market" },
  { value: "stop-limit", label: "Stop limit" },
] as const;

export const ALIGNMENTS = [
  { value: "pro", label: "Pro trend" },
  { value: "counter", label: "Counter trend" },
] as const;

export const POIS = [
  { value: "extreme", label: "Extreme" },
  { value: "decisional", label: "Decisional" },
  { value: "s2d", label: "S2D" },
  { value: "d2s", label: "D2S" },
  { value: "consumed", label: "Consumed POI" },
  { value: "structural", label: "POI has structural relevance" },
  { value: "ran-liquidity", label: "POI ran previous liquidity" },
] as const;

export const RR_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const RISK_PRESETS = [0.5, 1, 2, 3] as const;

export const PSYCH_TAGS = [
  { value: "fomo", label: "FOMO" },
  { value: "revenge", label: "Revenge trading" },
  { value: "reversal-no-mid-ind", label: "Reversal model without medium inducement" },
  { value: "overtrading", label: "Over trading" },
  { value: "out-of-plan", label: "Trade out of the plan" },
  { value: "early-entry", label: "Early entry" },
  { value: "early-be", label: "Early break even" },
  { value: "wrong-sl", label: "Wrong SL placement" },
] as const;

export type NewTradeDraft = {
  pair: string;
  side: Side | "";
  orderIds: string[];
  outcome: Outcome | "";
  session: string;
  prevDay: string;
  h4Trend: string;
  phase: string;
  model: string;
  mechanicsContext: string;
  entries: string[];
  execType: string;
  alignment: string;
  pois: string[];
  rr: string;
  rrCustom: string;
  riskPct: string;
  riskCustom: string;
  tradeDate: string;
  inducementTime: string;
  entryTime: string;
  exitTime: string;
  openPrice: string;
  slPrice: string;
  closePrice: string;
  tpPrice: string;
  lots: string;
  pips: string;
  pipsPoints: boolean;
  gross: string;
  swap: string;
  commission: string;
  net: string;
  netOverride: boolean;
  sessionAuto: boolean;
  validity: "valid" | "invalid" | "";
  psychTags: string[];
  psychNote: string;
  notes: string;
};

export const EMPTY_DRAFT: NewTradeDraft = {
  pair: "",
  side: "",
  orderIds: [],
  outcome: "",
  session: "",
  prevDay: "",
  h4Trend: "",
  phase: "",
  model: "",
  mechanicsContext: "",
  entries: [],
  execType: "",
  alignment: "",
  pois: [],
  rr: "",
  rrCustom: "",
  riskPct: "",
  riskCustom: "",
  tradeDate: "",
  inducementTime: "",
  entryTime: "",
  exitTime: "",
  openPrice: "",
  slPrice: "",
  closePrice: "",
  tpPrice: "",
  lots: "",
  pips: "",
  pipsPoints: false,
  gross: "",
  swap: "",
  commission: "",
  net: "",
  netOverride: false,
  sessionAuto: false,
  validity: "",
  psychTags: [],
  psychNote: "",
  notes: "",
};

export const NEW_TRADES_KEY = "tradecraft.new-trade.v1";
/** Pre-rename key — read once for migration, then abandoned. */
export const LEGACY_NEW_TRADES_KEY = "tradeeye.new-trade.v1";
