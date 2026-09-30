"use client";

import { useState } from "react";
import { AuthInput } from "./auth-input";

type PasswordInputProps = {
  id: string;
  placeholder?: string;
  autoComplete?: string;
  invalid?: boolean;
  onDark?: boolean;
  value: string;
  onChange: (value: string) => void;
};

export function PasswordInput({
  id,
  placeholder = "••••••••",
  autoComplete,
  invalid,
  onDark,
  value,
  onChange,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <AuthInput
        id={id}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        invalid={invalid}
        onDark={onDark}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1 right-1 h-7 rounded-md px-2 font-mono text-xs text-subtle-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
