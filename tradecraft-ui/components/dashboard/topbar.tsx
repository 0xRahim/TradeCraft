"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icon } from "./icons";
import { useShell } from "./shell-context";
import { IconButton } from "./ui";

export function Topbar({ crumb }: { crumb: ReactNode }) {
  const { toggle } = useShell();
  const { user } = useAuth();
  const initial = (user?.fullName?.trim()?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();
  return (
    <div className="mb-3 flex h-10 items-center gap-3">
      <IconButton label="Toggle sidebar" onClick={toggle}>
        <Icon name="panel" />
      </IconButton>
      <span className="text-sm text-muted-foreground">{crumb}</span>
      <div className="relative ml-auto hidden w-70 max-w-[45%] md:block">
        <span className="absolute top-2.5 left-2.5 text-subtle-foreground">
          <Icon name="search" />
        </span>
        <input
          placeholder="Search..."
          aria-label="Search"
          className="h-9 w-full rounded-lg border border-input bg-card pr-12 pl-8 font-sans text-sm text-foreground outline-none placeholder:text-subtle-foreground focus:border-ring focus:ring-1 focus:ring-ring"
        />
        <kbd className="absolute top-[7px] right-2.5 font-mono text-xs tracking-widest text-subtle-foreground">
          ⌘ K
        </kbd>
      </div>
      <span
        title={user?.email ?? "Account"}
        className="grid size-8 flex-none place-items-center rounded-full bg-accent font-mono text-xs font-medium text-muted-foreground max-md:ml-auto"
      >
        {initial}
      </span>
    </div>
  );
}
