"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ShellProvider, useShell } from "@/components/dashboard/shell-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useAuth } from "@/lib/auth/auth-context";

function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "anon") router.replace("/login");
  }, [status, router]);

  if (status !== "authed") {
    return (
      <div
        className="grid min-h-[60vh] place-items-center"
        role="status"
        aria-label="Loading"
      >
        <span className="size-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }
  return <>{children}</>;
}

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
          "px-5 pt-3 pb-8 transition-all md:px-6 md:pb-8",
          collapsed ? "md:ml-16" : "md:ml-[228px]",
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
      <AuthGuard>
        <ShellFrame>{children}</ShellFrame>
      </AuthGuard>
    </ShellProvider>
  );
}
