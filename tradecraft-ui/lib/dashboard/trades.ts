import { createRng, pick } from "./seed";
import { movePips } from "./trade-derivations";
import {
  ALIGNMENTS,
  ENTRIES,
  EXEC_TYPES,
  H4_TREND,
  MODELS,
  PAIRS,
  PHASES,
  POIS,
  PREV_DAY,
  PSYCH_TAGS,
} from "./trade-options";
import {
  PAIR_PX,
  makeThumb,
  type TradeRecord,
} from "./trade-record";
import type { ExecutionRow } from "./execution-csv";

const NOTES = [
  "Waited for the sweep, entered on the inducement retest.",
  "HTF bias aligned. Stop under the swing, target at the previous high.",
  "Took the full position at the entry model confirmation.",
  "Entry was late; the move was mostly done.",
  "Clean execution, followed the checklist.",
  "Rule break: sized up after a loss.",
];

const MODEL_VALUES = MODELS.map((m) => m.value);
const ENTRY_VALUES = ENTRIES.map((e) => e.value);
const POI_VALUES = POIS.map((p) => p.value);
const SESSION_BAG = [
  "london", "london", "london",
  "newyork", "newyork", "newyork",
  "frankfurt", "no-window", "london-close",
];

function addMinutes(s: string, m: number): string {
  let [h, n] = s.split(":").map(Number);
  n += m;
  h = (h + Math.floor(n / 60) + 24) % 24;
  n = ((n % 60) + 60) % 60;
  return String(h).padStart(2, "0") + ":" + String(n).padStart(2, "0");
}

function buildDemoTrades(): TradeRecord[] {
  const rnd = createRng(11);
  const out: TradeRecord[] = [];
  const dd = new Date(2026, 7, 3);
  const end = new Date(2026, 8, 29);
  while (dd <= end) {
    const w = dd.getDay();
    if (w !== 0 && w !== 6) {
      const n = rnd() < 0.25 ? 0 : rnd() < 0.5 ? 1 : rnd() < 0.8 ? 2 : 3;
      for (let i = 0; i < n; i++) {
        const pair = pick(rnd, [...PAIRS]);
        const { base } = PAIR_PX[pair];
        const long = rnd() < 0.55;
        const roll = rnd();
        const outcome: TradeRecord["outcome"] =
          roll < 0.58 ? "TP" : roll < 0.88 ? "SL" : "BE";
        const rr = String(pick(rnd, [1, 2, 3, 4]));
        const rrNum = Number(rr);
        const dist = base * (0.0006 + rnd() * 0.0008);
        const jitter = (rnd() - 0.5) * dist;
        const open = base + jitter;
        const sl = long ? open - dist : open + dist;
        const tp = long ? open + dist * rrNum : open - dist * rrNum;
        const close = outcome === "TP" ? tp : outcome === "SL" ? (long ? sl - dist * 0.2 : sl + dist * 0.2) : open;
        const riskMoney = 100 + 50 * Math.floor(rnd() * 4);
        const rCap = outcome === "TP" ? rrNum : outcome === "SL" ? -1 : 0;
        const gross = Math.round(rCap * riskMoney);
        const h = rnd() < 0.4 ? 7 + Math.floor(rnd() * 4) : 13 + Math.floor(rnd() * 4);
        const mi = Math.floor(rnd() * 60);
        const entryTime = `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
        const tradeDate = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`;
        const lots = pair === "BTCUSD" ? 0.05 + Math.floor(rnd() * 5) * 0.05 : pair === "NQ" || pair === "ES" ? 1 + Math.floor(rnd() * 3) : 0.5 + Math.floor(rnd() * 4) * 0.5;
        const moved = movePips(pair, open, close);
        const id = `d-${out.length}`;
        const oid = String(48210000 + out.length * 7);
        const oid2 = `${oid}-1`;
        const multi = rnd() < 0.3;
        const orderIds = multi ? [oid, oid2] : [oid];
        const executions: ExecutionRow[] = [
          {
            id: oid,
            symbol: pair,
            openTime: entryTime,
            volume: multi ? +(lots / 2).toFixed(2) : lots,
            side: long ? "BUY" : "SELL",
            closeTime: addMinutes(entryTime, 25 + Math.floor(rnd() * 20)),
            openPrice: open,
            closePrice: close,
            stopLoss: sl,
            takeProfit: tp,
            swap: 0,
            commission: 0,
            profit: multi ? Math.round(gross / 2) : gross,
            reason: outcome,
          },
        ];
        if (multi) {
          executions.push({
            ...executions[0],
            id: oid2,
            profit: gross - executions[0].profit,
          });
        }
        const entries = [pick(rnd, ENTRY_VALUES)];
        if (rnd() < 0.3) {
          const second = pick(rnd, ENTRY_VALUES);
          if (!entries.includes(second)) entries.push(second);
        }
        const pois = [pick(rnd, POI_VALUES)];
        if (rnd() < 0.35) {
          const second = pick(rnd, POI_VALUES);
          if (!pois.includes(second)) pois.push(second);
        }
        const psychTags = rnd() < 0.3 ? [pick(rnd, PSYCH_TAGS.map((p) => p.value))] : [];
        const t: TradeRecord = {
          id,
          source: "demo",
          pair,
          side: long ? "long" : "short",
          outcome,
          session: pick(rnd, SESSION_BAG),
          prevDay: pick(rnd, PREV_DAY.map((p) => p.value)),
          h4Trend: pick(rnd, H4_TREND.map((p) => p.value)),
          phase: pick(rnd, PHASES.map((p) => p.value)),
          model: pick(rnd, MODEL_VALUES),
          mechanicsContext: "",
          entries,
          execType: pick(rnd, EXEC_TYPES.map((p) => p.value)),
          alignment: pick(rnd, ALIGNMENTS.map((p) => p.value)),
          pois,
          rr,
          rrCustom: "",
          riskPct: String(pick(rnd, [0.5, 1, 2])),
          riskCustom: "",
          tradeDate,
          inducementTime: addMinutes(entryTime, -10),
          entryTime,
          exitTime: addMinutes(entryTime, 25 + Math.floor(rnd() * 20)),
          openPrice: open,
          slPrice: sl,
          closePrice: close,
          tpPrice: tp,
          lots,
          pips: Number(moved.value) || 0,
          pipsPoints: moved.points,
          gross,
          swap: 0,
          commission: 0,
          net: gross,
          validity: rnd() < 0.12 ? "invalid" : "valid",
          psychTags,
          psychNote: "",
          notes: pick(rnd, NOTES),
          orderIds,
          executions,
          entryShots: [],
          tradeShots: [],
          thumb: "",
          createdAt: `${tradeDate}T${entryTime}:00`,
        };
        t.thumb = makeThumb({ long, plan: rrNum, r: rCap }, rnd);
        out.push(t);
      }
    }
    dd.setDate(dd.getDate() + 1);
  }
  return out;
}

let cache: TradeRecord[] | null = null;

/** Demo trades in the new entry format (deterministic seed). */
export function getDemoTrades(): TradeRecord[] {
  if (!cache) cache = buildDemoTrades();
  return cache;
}
