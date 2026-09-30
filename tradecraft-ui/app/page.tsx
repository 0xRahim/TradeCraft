import type { Metadata } from "next";
import { LandingGate } from "@/components/landing/gate";
import { LandingClosing } from "@/components/landing/closing";
import { LandingFooter } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { PillNav } from "@/components/landing/pill-nav";
import { LandingSections } from "@/components/landing/sections";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3000",
  ),
  title: "TradeCraft — Trading journal and analytics workstation",
  description:
    "TradeCraft pairs your broker executions with screenshots, a daily journal, and honest analytics — so the next setup starts from evidence, not memory.",
  openGraph: {
    title: "TradeCraft — Trading journal and analytics workstation",
    description:
      "Log trades, pin screenshots, journal the thesis, and review the tape.",
    images: [{ url: "/images/logo.png", width: 512, height: 512, alt: "TradeCraft logo" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "TradeCraft — Trading journal and analytics workstation",
    description:
      "Log trades, pin screenshots, journal the thesis, and review the tape.",
    images: ["/images/logo.png"],
  },
};

export default function Home() {
  return (
    <LandingGate>
      <PillNav />
      <main>
        <Hero />
        <LandingSections />
        <LandingClosing />
      </main>
      <LandingFooter />
    </LandingGate>
  );
}
