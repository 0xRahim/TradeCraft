import type { ReactNode } from "react";
import { AuthLogo } from "./auth-logo";

export function CenteredLayout({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8">
      <div className="auth-grid-bg" aria-hidden="true" />
      <div className="relative">
        <AuthLogo />
      </div>
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-8">
        {children}
      </div>
      {footer ? (
        <p className="relative m-0 text-center text-sm text-muted-foreground">
          {footer}
        </p>
      ) : null}
    </main>
  );
}
