import Link from "next/link";
import { Chip } from "@/components/dashboard/ui";
import { monthDay } from "@/lib/dashboard/format";
import {
  entryLabels,
  modelLabel,
  outcomeTone,
  recordR,
  sessionLabel,
  type TradeRecord,
} from "@/lib/dashboard/trade-record";

/** Seeded candlestick thumbnail (SVG string from the data layer). */
export function TradeThumb({ trade }: { trade: TradeRecord }) {
  return (
    <span
      className="block h-11 w-20 overflow-hidden rounded-md border border-border [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
      // SVG is generated locally from seeded data, never user input.
      dangerouslySetInnerHTML={{ __html: trade.thumb }}
      aria-hidden="true"
    />
  );
}

export function SideChip({ side }: { side: TradeRecord["side"] }) {
  return <Chip>{side === "long" ? "LONG" : "SHORT"}</Chip>;
}

export function OutcomeChip({ outcome }: { outcome: TradeRecord["outcome"] }) {
  return <Chip variant={outcomeTone(outcome)}>{outcome}</Chip>;
}

export function ValidityChip({ validity }: { validity: TradeRecord["validity"] }) {
  if (!validity) return null;
  return (
    <Chip variant={validity === "valid" ? "neutral" : "warning"}>
      {validity === "valid" ? "VALID" : "INVALID"}
    </Chip>
  );
}

export function SourceChip({ source }: { source: TradeRecord["source"] }) {
  if (source !== "user") return null;
  return <Chip variant="info">LOGGED</Chip>;
}

export function PairCell({ trade }: { trade: TradeRecord }) {
  return (
    <span className="flex items-center gap-2 font-sans text-sm font-medium whitespace-nowrap">
      {trade.pair}
      <SideChip side={trade.side} />
    </span>
  );
}

export function ModelCell({ trade }: { trade: TradeRecord }) {
  const entries = entryLabels(trade.entries).slice(0, 2).join(" · ");
  return (
    <span className="block min-w-0">
      <span className="block truncate font-sans text-sm">{modelLabel(trade.model) || "—"}</span>
      {entries ? (
        <span className="block truncate text-xs text-subtle-foreground">{entries}</span>
      ) : null}
    </span>
  );
}

export function SessionCell({ trade }: { trade: TradeRecord }) {
  return (
    <span className="font-mono text-xs whitespace-nowrap text-muted-foreground uppercase">
      {sessionLabel(trade.session) || "—"}
    </span>
  );
}

export function RCELL({ trade }: { trade: TradeRecord }) {
  const r = recordR(trade);
  const tone = r > 0 ? "text-profit" : r < 0 ? "text-loss" : "";
  return (
    <span className={`whitespace-nowrap ${tone}`}>
      {r !== 0 || trade.outcome === "BE" ? `${r > 0 ? "+" : ""}${r.toFixed(1)}R` : "—"}
    </span>
  );
}

export function TradeDate({ trade }: { trade: TradeRecord }) {
  return (
    <>
      {trade.tradeDate ? monthDay(trade.tradeDate) : "—"}{" "}
      <span className="text-subtle-foreground">{trade.entryTime}</span>
    </>
  );
}

export function FullViewLink({ id }: { id: string }) {
  return (
    <Link
      href={`/trades/${id}`}
      className="text-xs text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
    >
      Open full view
    </Link>
  );
}
