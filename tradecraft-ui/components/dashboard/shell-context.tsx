"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ShellState = {
  collapsed: boolean;
  mobileOpen: boolean;
  toggle: () => void;
  closeMobile: () => void;
  syncLabel: string;
  syncing: boolean;
  sync: () => void;
};

const ShellContext = createContext<ShellState | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(
    () =>
      typeof window !== "undefined" &&
      window.innerWidth >= 768 &&
      window.innerWidth < 1024,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [syncLabel, setSyncLabel] = useState("Synced 2 mins ago");
  const [syncing, setSyncing] = useState(false);

  const toggle = useCallback(() => {
    if (window.innerWidth < 768) setMobileOpen((v) => !v);
    else setCollapsed((v) => !v);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const sync = useCallback(() => {
    setSyncing(false);
    requestAnimationFrame(() => {
      setSyncing(true);
      setSyncLabel("Synced just now");
      setTimeout(() => setSyncing(false), 950);
    });
  }, []);

  return (
    <ShellContext.Provider
      value={{
        collapsed,
        mobileOpen,
        toggle,
        closeMobile,
        syncLabel,
        syncing,
        sync,
      }}
    >
      {children}
    </ShellContext.Provider>
  );
}

export function useShell(): ShellState {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside ShellProvider");
  return ctx;
}
