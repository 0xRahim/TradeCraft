import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  htmlFor: string;
  action?: ReactNode;
  error?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, action, error, children }: FieldProps) {
  const errorId = error ? `${htmlFor}-error` : undefined;
  return (
    <div className="mb-4">
      <label
        htmlFor={htmlFor}
        className="mb-2 flex items-center justify-between text-sm font-medium"
      >
        <span>{label}</span>
        {action}
      </label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
