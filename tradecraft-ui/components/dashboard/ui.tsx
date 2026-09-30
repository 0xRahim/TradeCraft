import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

/* Card */

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "min-w-0 rounded-lg border border-border bg-card p-6",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <div className="text-sm leading-5 font-semibold">{title}</div>
        {sub ? (
          <div className="mt-0.5 text-xs leading-4 text-muted-foreground">
            {sub}
          </div>
        ) : null}
      </div>
      {right}
    </div>
  );
}

/* Micro label (DESIGN.md micro-label: mono 11px uppercase) */

export function MicroLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
      {children}
    </div>
  );
}

/* Chip */

type ChipVariant = "neutral" | "info" | "profit" | "loss" | "warning" | "outline";

const chipStyles: Record<ChipVariant, string> = {
  neutral: "border-transparent bg-accent text-foreground",
  info: "border-transparent bg-info-container text-on-info-container",
  profit:
    "border border-profit-border bg-profit-container text-on-profit-container",
  loss: "border border-loss-border bg-loss-container text-on-loss-container",
  warning: "border-transparent bg-warning-container text-on-warning-container",
  outline: "border border-border text-muted-foreground",
};

export function Chip({
  variant = "outline",
  icon,
  children,
}: {
  variant?: ChipVariant;
  icon?: IconName;
  children: ReactNode;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs font-medium whitespace-nowrap",
        chipStyles[variant],
      ].join(" ")}
    >
      {icon ? <Icon name={icon} /> : null}
      {children}
    </span>
  );
}

/* Segmented control */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: ReactNode; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex h-8 overflow-hidden rounded-lg border border-border"
    >
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={[
            "flex items-center gap-2 px-3 text-sm font-medium transition-colors",
            "focus-visible:outline-2 focus-visible:outline-ring",
            i > 0 ? "border-l border-border" : "",
            o.value === value
              ? "bg-card text-foreground"
              : "bg-surface-high text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* Icon button */

export function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors not-disabled:hover:bg-accent not-disabled:hover:text-foreground disabled:cursor-default disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-ring"
    >
      {children}
    </button>
  );
}
