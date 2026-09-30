"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";

export default function Home() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authed") router.replace("/dashboard");
    else if (status === "anon") router.replace("/login");
  }, [status, router]);

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
