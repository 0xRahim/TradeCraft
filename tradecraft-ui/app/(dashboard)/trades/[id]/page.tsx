import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DETAIL_TRADES } from "./detail-data";
import { TradeDetailView } from "./view";

export function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return params.then((p) => {
    const t = DETAIL_TRADES.find((x) => x.id === p.id);
    return { title: t ? `${t.tk} trade · TradeEye` : "Trade · TradeEye" };
  });
}

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!DETAIL_TRADES.some((t) => t.id === id)) notFound();
  return <TradeDetailView tradeId={id} />;
}
