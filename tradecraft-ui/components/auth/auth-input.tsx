import type { InputHTMLAttributes } from "react";

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  onDark?: boolean;
};

export function AuthInput({ invalid, onDark, className, ...props }: AuthInputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      {...props}
      className={[
        "h-9 w-full rounded-lg border border-input px-3 font-sans text-sm text-foreground",
        onDark ? "bg-background" : "bg-card",
        "placeholder:text-subtle-foreground",
        "outline-none transition-colors",
        "focus:border-ring focus:ring-1 focus:ring-ring",
        invalid ? "border-error/60" : "",
        className ?? "",
      ].join(" ")}
    />
  );
}
