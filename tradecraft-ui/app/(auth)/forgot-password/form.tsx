"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AuthHeading,
  AuthSub,
  AuthTile,
} from "@/components/auth/auth-bits";
import { AuthInput } from "@/components/auth/auth-input";
import { CenteredLayout } from "@/components/auth/centered-layout";
import { Field } from "@/components/auth/field";
import {
  ghostButtonClasses,
  PrimaryButton,
  primaryButtonClasses,
} from "@/components/auth/primary-button";
import { isValidEmail } from "@/lib/auth/password";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [sentTo, setSentTo] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(undefined);
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <CenteredLayout
        footer={<Link href="/login">Back to log in</Link>}
      >
        <AuthTile variant="success">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </AuthTile>
        <AuthHeading>Check your email</AuthHeading>
        <AuthSub>
          If an account exists for{" "}
          <span className="font-mono text-foreground">{sentTo}</span>, a reset
          link is on its way. It expires in 30 minutes.
        </AuthSub>
        <Link href="/reset-password" className={primaryButtonClasses}>
          Open reset link (demo)
        </Link>
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className={[ghostButtonClasses, "mt-2"].join(" ")}
        >
          Use a different email
        </button>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout footer={<Link href="/login">Back to log in</Link>}>
      <AuthTile>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="8" cy="15" r="4" />
          <path d="m11 12 9-9m-3 3 3 3" />
        </svg>
      </AuthTile>
      <AuthHeading>Forgot your password?</AuthHeading>
      <AuthSub>Enter your email and we&apos;ll send a link to reset it.</AuthSub>
      <form noValidate onSubmit={onSubmit}>
        <Field label="Email" htmlFor="email" error={emailError}>
          <AuthInput
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            invalid={Boolean(emailError)}
            onDark
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <PrimaryButton type="submit">Send reset link</PrimaryButton>
      </form>
    </CenteredLayout>
  );
}
