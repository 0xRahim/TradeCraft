import type { ReactNode } from "react";
import { AuthLogo } from "./auth-logo";

export function SplitLayout({
  children,
  aside,
}: {
  children: ReactNode;
  aside: ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex min-h-screen flex-col px-4 py-6 md:px-12 md:py-8">
        <AuthLogo />
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </section>
      <aside className="hidden flex-col justify-center border-l border-border bg-card p-12 lg:flex">
        <div className="mx-auto w-full max-w-md">{aside}</div>
      </aside>
    </main>
  );
}
