"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { Icon } from "@/components/dashboard/icons";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
      <Image
        src="/images/logo.png"
        alt="TradeCraft logo"
        width={size}
        height={size}
        priority
        className="rounded-md"
      />
      TradeCraft
    </span>
  );
}

export function PillNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  return (
    <div className="fixed inset-x-0 top-0 z-40">
      {/* Announcement bar */}
      <div className="flex items-center justify-center gap-2 px-4 pt-3 text-[13px]">
        <span className="size-1.5 rounded-full bg-info" aria-hidden="true" />
        <span className="rounded-full bg-info-container px-2 py-px font-mono text-xs font-medium text-on-info-container">
          New
        </span>
        <span className="truncate text-muted-foreground">
          Screenshot vault is live — pin entry models to every trade.
        </span>
      </div>
      {/* Floating pill */}
      <div className="mx-auto mt-2 max-w-3xl px-4">
        <motion.nav
          aria-label="Primary"
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={[
            "flex items-center gap-2 rounded-full border bg-card/90 py-2 pr-2 pl-4 backdrop-blur transition-colors",
            scrolled ? "border-input" : "border-border",
          ].join(" ")}
        >
          <Link href="/" aria-label="TradeCraft home">
            <BrandMark />
          </Link>
          <div className="ml-4 hidden items-center gap-6 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/login"
              className="hidden h-9 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:flex"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover"
            >
              Start journaling
            </Link>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
            >
              <Icon name={open ? "x" : "list"} />
            </button>
          </div>
        </motion.nav>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-2 rounded-2xl border border-border bg-card p-2 md:hidden"
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex h-10 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex h-10 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:hidden"
            >
              Log in
            </Link>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
