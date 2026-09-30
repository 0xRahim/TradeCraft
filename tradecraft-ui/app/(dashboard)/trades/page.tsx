import type { Metadata } from "next";
import { TradesView } from "./view";

export const metadata: Metadata = {
  title: "Trade log · TradeCraft",
};

export default function TradesPage() {
  return <TradesView />;
}
