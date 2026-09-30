import Link from "next/link";
import { Chip } from "@/components/dashboard/ui";
import { monthDay } from "@/lib/dashboard/format";
import type { Trade } from "@/lib/dashboard/trades";

/** Seeded candlestick thumbnail (SVG string from the data layer). */
export function TradeThumb({ trade }: { trade: Trade }) {
  return (
    <span
      className="block h-11 w-20 overflow-hidden rounded-md border border-border [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
      // SVG is generated locally from seeded data, never user input.
      dangerouslySetInnerHTML={{ __html: trade.thumb }}
      aria-hidden="true"
    />
  );
}

export function SideChip({ side }: { side: Trade["side"] }) {
  return <Chip>{side === "L" ? "LONG" : "SHORT"}</Chip>;
}

export function ResultChip({ pnl }: { pnl: number }) {
  return (
    <Chip variant={pnl > 0 ? "profit" : "loss"}>
      {pnl > 0 ? "WIN" : "LOSS"}
    </Chip>
  );
}

export function TickerCell({ trade }: { trade: Trade }) {
  return (
    <span className="flex items-center gap-2 font-sans text-sm font-medium">
      {trade.tk}
      <SideChip side={trade.side} />
    </span>
  );
}

export function TradeDate({ trade }: { trade: Trade }) {
  return (
    <>
      {monthDay(trade.date)}{" "}
      <span className="text-subtle-foreground">{trade.time}</span>
    </>
  );
}

export function FullViewLink({ id }: { id: number }) {
  return (
    <Link
      href={`/trades/${id}`}
      className="text-xs text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
    >
      Open full view
    </Link>
  );
}
