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
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordMeter } from "@/components/auth/password-meter";
import {
  PrimaryButton,
  primaryButtonClasses,
} from "@/components/auth/primary-button";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextPasswordError =
      password.length >= 8 ? undefined : "Use at least 8 characters.";
    const nextConfirmError =
      confirm === password ? undefined : "Passwords don't match.";
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    if (nextPasswordError || nextConfirmError) return;
    setDone(true);
  }

  if (done) {
    return (
      <CenteredLayout
        footer={<Link href="/forgot-password">Request a new link</Link>}
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
            <path d="m5 12 5 5 9-10" />
          </svg>
        </AuthTile>
        <AuthHeading>Password updated</AuthHeading>
        <AuthSub>You&apos;re all set. Log in with your new password.</AuthSub>
        <Link href="/login" className={primaryButtonClasses}>
          Continue to log in
        </Link>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout
      footer={<Link href="/forgot-password">Request a new link</Link>}
    >
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
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </AuthTile>
      <AuthHeading>Reset your password</AuthHeading>
      <AuthSub>Choose a new password for your account.</AuthSub>
      <form noValidate onSubmit={onSubmit}>
        <div className="mb-4">
          <label
            htmlFor="password"
            className="mb-2 flex items-center justify-between text-sm font-medium"
          >
            <span>New password</span>
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            invalid={Boolean(passwordError)}
            onDark
            value={password}
            onChange={setPassword}
          />
          <PasswordMeter password={password} />
          {passwordError ? (
            <p role="alert" className="mt-1.5 text-xs text-error">
              {passwordError}
            </p>
          ) : null}
        </div>
        <Field label="Confirm password" htmlFor="confirm" error={confirmError}>
          <AuthInput
            id="confirm"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            invalid={Boolean(confirmError)}
            onDark
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        <PrimaryButton type="submit" className="mt-6">
          Update password
        </PrimaryButton>
      </form>
    </CenteredLayout>
  );
}
