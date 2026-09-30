import type { ReactNode } from "react";

export function AuthTile({
  variant = "default",
  children,
}: {
  variant?: "default" | "success";
  children: ReactNode;
}) {
  return (
    <div
      className={[
        "mb-5 grid size-10 place-items-center rounded-md border border-border",
        variant === "success"
          ? "border-profit-border bg-profit-container text-on-profit-container"
          : "bg-accent text-foreground",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function AuthHeading({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-2xl leading-8 font-medium tracking-tight">{children}</h1>
  );
}

export function AuthSub({ children }: { children: ReactNode }) {
  return <p className="mt-1 mb-6 text-sm text-muted-foreground">{children}</p>;
}

export function AuthChip({
  variant = "default",
  children,
}: {
  variant?: "default" | "profit" | "loss";
  children: ReactNode;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs font-medium",
        variant === "profit"
          ? "border-profit-border bg-profit-container text-on-profit-container"
          : variant === "loss"
            ? "border-loss-border bg-loss-container text-on-loss-container"
            : "border-border text-muted-foreground",
      ].join(" ")}
    >
      {children}
    </span>
  );
}
