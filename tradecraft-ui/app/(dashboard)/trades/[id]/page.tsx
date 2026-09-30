import type { Metadata } from "next";
import { TradeDetailView } from "./view";

export const metadata: Metadata = {
  title: "Trade · TradeCraft",
};

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
