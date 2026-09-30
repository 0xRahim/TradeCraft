import type { Metadata } from "next";
import { JournalView } from "./view";

export const metadata: Metadata = {
  title: "Journal · TradeEye",
};

export default function JournalPage() {
  return <JournalView />;
}
