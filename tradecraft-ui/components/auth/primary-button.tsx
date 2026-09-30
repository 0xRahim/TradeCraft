import type { ButtonHTMLAttributes } from "react";

export const primaryButtonClasses =
  "flex h-9 w-full items-center justify-center rounded-lg bg-primary font-sans text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-default disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2";

export const ghostButtonClasses =
  "flex h-9 w-full items-center justify-center rounded-lg font-sans text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2";
type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
};

export function PrimaryButton({
  loading,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      {...props}
      className={[primaryButtonClasses, className ?? ""].join(" ")}
    >
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
