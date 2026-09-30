"use client";

import type { ReactNode } from "react";
import { ShellProvider, useShell } from "@/components/dashboard/shell-context";
import { Sidebar } from "@/components/dashboard/sidebar";

function ShellFrame({ children }: { children: ReactNode }) {
  const { collapsed, mobileOpen, closeMobile } = useShell();
  return (
    <>
      <Sidebar />
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-10 bg-overlay md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      ) : null}
      <div
        className={[
          "px-4 pt-4 pb-12 transition-all md:pr-8 md:pb-12 md:pl-6",
          collapsed ? "md:ml-19" : "md:ml-66.5",
        ].join(" ")}
      >
        <div className="mx-auto w-full max-w-400">{children}</div>
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ShellProvider>
      <ShellFrame>{children}</ShellFrame>
    </ShellProvider>
  );
}
