"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icon, type IconName } from "./icons";
import { useShell } from "./shell-context";
import { Chip } from "./ui";

type NavChild =
  | { label: string; href: string }
  | { label: string; soon: true };

type NavEntry = {
  label: string;
  icon: IconName;
  href?: string;
  soon?: boolean;
  badge?: string;
  children?: NavChild[];
};

const NAV: { section: string; items: NavEntry[] }[] = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", icon: "grid", href: "/dashboard" },
      {
        label: "Trades",
        icon: "trend",
        children: [
          { label: "Pipeline", soon: true },
          { label: "Trade log", href: "/trades" },
        ],
      },
      { label: "Journal", icon: "book", href: "/journal" },
      { label: "Calendar", icon: "cal", soon: true },
    ],
  },
  {
    section: "Analyze",
    items: [
      {
        label: "Analytics",
        icon: "bars",
        children: [
          { label: "Performance", soon: true },
          { label: "Models", soon: true },
          { label: "Sessions", soon: true },
        ],
      },
      { label: "Reviews", icon: "check", soon: true, badge: "3" },
    ],
  },
  {
    section: "Workspace",
    items: [{ label: "Settings", icon: "cog", soon: true }],
  },
];

function isActive(pathname: string, entry: NavEntry): boolean {
  if (entry.href && (pathname === entry.href || pathname.startsWith(entry.href + "/")))
    return true;
  return (
    entry.children?.some(
      (c) => "href" in c && (pathname === c.href || pathname.startsWith(c.href + "/")),
    ) ?? false
  );
}

function NavButton({
  active,
  title,
  onClick,
  expanded,
  collapsed,
  children,
}: {
  active?: boolean;
  title: string;
  onClick?: () => void;
  expanded?: boolean;
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-expanded={expanded}
      className={[
        "flex h-8 w-full items-center gap-3 rounded-lg px-2.5 font-medium whitespace-nowrap transition-colors",
        "focus-visible:outline-2 focus-visible:outline-ring",
        collapsed ? "justify-center px-0" : "",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-surface-high hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SoonLabel({ collapsed, label }: { collapsed: boolean; label: string }) {
  if (collapsed) return null;
  return (
    <span className="font-mono text-xs text-subtle-foreground" title="Coming soon">
      {label}
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { collapsed, mobileOpen, closeMobile, syncLabel, syncing, sync } =
    useShell();
  const [open, setOpen] = useState<Record<string, boolean>>({
    Trades: true,
    Analytics: false,
  });

  return (
    <aside
      className={[
        "fixed top-2 bottom-2 left-2 z-20 flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-2.5 transition-all",
        collapsed ? "w-15" : "w-54",
        mobileOpen
          ? "translate-x-0"
          : "-translate-x-[120%] md:translate-x-0",
        "max-md:w-54",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-9 items-center gap-2 px-1.5 text-sm font-semibold tracking-tight whitespace-nowrap",
          collapsed ? "justify-center px-0" : "",
        ].join(" ")}
      >
        <span className="size-6 flex-none overflow-hidden rounded-lg">
          <Image
            src="/images/light-logo.png"
            alt="TradeCraft"
            width={24}
            height={24}
            className="size-6"
          />
        </span>
        {!collapsed && <span className="flex-1 text-left">TradeCraft</span>}
      </div>

      <div className="mt-3 mb-1 flex">
        <Link
          href="/trades/new"
          onClick={closeMobile}
          aria-label="New trade"
          title="New trade"
          className={[
            "flex h-8 flex-1 items-center justify-start gap-3 rounded-lg bg-primary px-2.5 font-medium whitespace-nowrap text-on-primary transition-colors hover:bg-primary-hover",
            "focus-visible:outline-2 focus-visible:outline-ring",
            collapsed ? "justify-center px-0" : "",
          ].join(" ")}
        >
          <Icon name="plus" />
          {!collapsed && <span className="flex-1 text-left">New trade</span>}
        </Link>
      </div>

      <button
        type="button"
        onClick={sync}
        aria-label="Sync"
        title={syncLabel}
        className={[
          "relative flex h-8 w-full items-center gap-3 rounded-lg px-2.5 whitespace-nowrap transition-colors",
          "text-muted-foreground hover:bg-surface-high hover:text-foreground",
          "focus-visible:outline-2 focus-visible:outline-ring",
          collapsed ? "justify-center px-0" : "",
        ].join(" ")}
      >
        <span className={syncing ? "animate-spin-once" : ""}>
          <Icon name="sync" />
        </span>
        {!collapsed && (
          <span className="flex-1 text-left font-mono text-xs text-subtle-foreground">
            {syncLabel}
          </span>
        )}
      </button>

      <nav className="min-h-0 flex-1 overflow-auto [scrollbar-width:none]">
        {NAV.map((group) => (
          <div key={group.section}>
            <div
              className={[
                "px-2.5 pt-4 pb-1.5 font-mono text-xs font-medium tracking-widest whitespace-nowrap text-subtle-foreground uppercase",
                collapsed
                  ? "mx-1 mt-2.5 mb-2 h-px bg-border p-0 text-[0px]"
                  : "",
              ].join(" ")}
            >
              {group.section}
            </div>
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              if (item.children) {
                const expanded = open[item.label] ?? false;
                return (
                  <div key={item.label}>
                    <NavButton
                      active={active}
                      title={item.label}
                      collapsed={collapsed}
                      expanded={expanded}
                      onClick={() =>
                        setOpen((o) => ({ ...o, [item.label]: !expanded }))
                      }
                    >
                      <Icon name={item.icon} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <Icon name="chev" className={expanded ? "rotate-180 transition-transform" : "transition-transform"} />
                        </>
                      )}
                    </NavButton>
                    {!collapsed && expanded && (
                      <div className="mt-0.5 mb-1 ml-4.5 border-l border-border pl-2">
                        {item.children.map((c) =>
                          "href" in c ? (
                            <Link
                              key={c.label}
                              href={c.href}
                              onClick={closeMobile}
                              className={[
                                "flex h-7 w-full items-center rounded-lg px-2 text-sm whitespace-nowrap transition-colors",
                                "focus-visible:outline-2 focus-visible:outline-ring",
                                pathname === c.href ||
                                pathname.startsWith(c.href + "/")
                                  ? "bg-accent text-foreground"
                                  : "font-normal text-muted-foreground hover:bg-surface-high hover:text-foreground",
                              ].join(" ")}
                            >
                              {c.label}
                            </Link>
                          ) : (
                            <span
                              key={c.label}
                              title="Coming soon"
                              aria-disabled="true"
                              className="flex h-7 w-full cursor-not-allowed items-center rounded-lg px-2 text-sm font-normal whitespace-nowrap text-subtle-foreground opacity-60"
                            >
                              {c.label}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                );
              }
              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={closeMobile}
                    title={item.label}
                    className={[
                      "flex h-8 w-full items-center gap-3 rounded-lg px-2.5 font-medium whitespace-nowrap transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-ring",
                      collapsed ? "justify-center px-0" : "",
                      active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-surface-high hover:text-foreground",
                    ].join(" ")}
                  >
                    <Icon name={item.icon} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge ? (
                          <Chip variant="neutral">{item.badge}</Chip>
                        ) : null}
                      </>
                    )}
                  </Link>
                );
              }
              return (
                <span
                  key={item.label}
                  title={`${item.label} · Coming soon`}
                  aria-disabled="true"
                  className={[
                    "flex h-8 w-full cursor-not-allowed items-center gap-3 rounded-lg px-2.5 font-medium whitespace-nowrap text-muted-foreground opacity-60",
                    collapsed ? "justify-center px-0" : "",
                  ].join(" ")}
                >
                  <Icon name={item.icon} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.label === "Calendar" ? (
                        <SoonLabel collapsed={collapsed} label="Soon" />
                      ) : null}
                      {item.badge ? (
                        <Chip variant="neutral">{item.badge}</Chip>
                      ) : null}
                    </>
                  )}
                </span>
              );
            })}
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="flex flex-col gap-1.5 pt-2">
          <div className="rounded-lg border border-border bg-surface-high p-2.5 text-xs leading-4.5 text-muted-foreground">
            <div className="flex items-center justify-between text-sm font-semibold text-foreground">
              Update available <Chip variant="info">v2.4</Chip>
            </div>
            <p className="mt-1 mb-2">
              Faster imports and a redesigned review flow.
            </p>
            <button
              type="button"
              className="h-7 w-full rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
            >
              Restart to update
            </button>
          </div>
          <span className="flex h-8 w-full items-center gap-3 rounded-lg px-2.5 font-medium whitespace-nowrap text-muted-foreground">
            <Icon name="help" />
            <span className="flex-1 text-left text-sm">Help &amp; support</span>
          </span>
        </div>
      )}
      <button
        type="button"
        title="Log out"
        aria-label="Log out"
        onClick={async () => {
          await logout();
          router.replace("/login");
        }}
        className={[
          "flex h-8 w-full items-center gap-3 rounded-lg px-2.5 font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground",
          "focus-visible:outline-2 focus-visible:outline-ring",
          collapsed ? "justify-center px-0" : "",
        ].join(" ")}
      >
        <Icon name="logout" />
        {!collapsed && <span className="flex-1 text-left text-sm">Log out</span>}
      </button>
    </aside>
  );
}
