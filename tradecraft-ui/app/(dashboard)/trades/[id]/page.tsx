import type { Metadata } from "next";
import { getDemoTrades } from "@/lib/dashboard/trades";
import { TradeDetailView } from "./view";

export function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return params.then((p) => {
    const t = getDemoTrades().find((x) => x.id === p.id);
    return { title: t ? `${t.pair} trade · TradeCraft` : "Trade · TradeCraft" };
  });
}

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // User trades live in localStorage (client-side), so resolution happens
  // in the client view — never 404 here.
  return <TradeDetailView tradeId={id} />;
}
