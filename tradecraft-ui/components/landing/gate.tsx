"use client";

import { MotionConfig } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Landing gate: logged-in traders go straight to the dashboard,
 * everyone else gets the marketing page. Motion respects the OS
 * reduced-motion setting throughout.
 */
export function LandingGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authed") router.replace("/dashboard");
  }, [status, router]);

  if (status === "authed") {
    return (
      <div
        className="grid min-h-screen place-items-center"
        role="status"
        aria-label="Loading"
      >
        <span className="size-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      {status === "loading" ? (
        <div
          className="grid min-h-screen place-items-center"
          role="status"
          aria-label="Loading"
        >
          <span className="size-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </div>
      ) : (
        children
      )}
    </MotionConfig>
  );
}
