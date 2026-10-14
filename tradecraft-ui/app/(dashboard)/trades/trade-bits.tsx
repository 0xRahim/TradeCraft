import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Chip } from "@/components/dashboard/ui";
import { monthDay } from "@/lib/dashboard/format";
import { resolveCachedShotSrc } from "@/lib/dashboard/shot-cache";
import { signRead } from "@/lib/dashboard/remote";
import {
  entryLabels,
  modelLabel,
  outcomeTone,
  recordR,
  sessionLabel,
  type ShotRef,
  type TradeRecord,
} from "@/lib/dashboard/trade-record";

/** First usable screenshot (entry, then trade) or null. */
function coverShot(trade: TradeRecord): ShotRef | null {
  return trade.entryShots[0] ?? trade.tradeShots[0] ?? null;
}

/**
 * Real screenshot cover with generated-thumb fallback. Private shots resolve
 * lazily (on scroll into view) through the persistent byte cache; the seeded
 * SVG shows until then and permanently when no screenshot exists.
 */
export function TradeCover({ trade, className }: { trade: TradeRecord; className?: string }) {
  const shot = coverShot(trade);
  const [cached, setCached] = useState<{ path: string; url: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const ioRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => () => ioRef.current?.disconnect(), []);

  const observe = useCallback((el: HTMLElement | null) => {
    ioRef.current?.disconnect();
    ioRef.current = null;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "200px" },
    );
    ioRef.current = io;
    io.observe(el);
  }, []);

  const path = !shot?.src ? (shot?.storagePath ?? null) : null;
  useEffect(() => {
    if (!visible || !path) return;
    let cancelled = false;
    void resolveCachedShotSrc(path, () =>
      signRead(path).then((r) => r.signedUrl),
    ).then((url) => {
      if (!cancelled && url) setCached({ path, url });
    });
    return () => {
      cancelled = true;
    };
  }, [visible, path]);

  const src = shot?.src ?? (path && cached?.path === path ? cached.url : null);

  if (src) {
    return (
      // Screenshots are user-provided images; empty alt (decorative cover).
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={observe}
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className={className}
      />
    );
  }
  return (
    <span
      ref={observe}
      className={className}
      // SVG is generated locally from seeded data, never user input.
      dangerouslySetInnerHTML={{ __html: trade.thumb }}
      aria-hidden="true"
    />
  );
}

/** Seeded candlestick thumbnail (SVG string from the data layer). */
export function TradeThumb({ trade }: { trade: TradeRecord }) {
  return (
    <TradeCover
      trade={trade}
      className="block h-11 w-20 overflow-hidden rounded-md border border-border object-cover [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
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
