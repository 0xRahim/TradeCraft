import type { Metadata } from "next";
import { NewTradeView } from "./view";

export const metadata: Metadata = {
  title: "New trade · TradeCraft",
};

export default function NewTradePage() {
  return <NewTradeView />;
}
