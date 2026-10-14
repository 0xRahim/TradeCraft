import type { Metadata } from "next";
import { EditTradeView } from "./view";

export const metadata: Metadata = {
  title: "Edit trade · TradeCraft",
};

export default async function EditTradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditTradeView tradeId={id} />;
}
