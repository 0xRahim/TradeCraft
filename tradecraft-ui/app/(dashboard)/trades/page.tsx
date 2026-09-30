import type { Metadata } from "next";
import { TradesView } from "./view";

export const metadata: Metadata = {
  title: "Trade log · TradeEye",
};

export default function TradesPage() {
  return <TradesView />;
}
