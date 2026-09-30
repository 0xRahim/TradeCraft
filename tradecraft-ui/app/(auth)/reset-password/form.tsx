"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
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
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth/auth-context";

type Recovery =
  | { kind: "code"; code: string }
  | { kind: "tokens"; access_token: string; refresh_token: string };

/** Extract the recovery session from the Supabase email redirect. */
function readRecoveryFromUrl(searchCode: string | null): Recovery | null {
  if (searchCode) return { kind: "code", code: searchCode };
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (accessToken && refreshToken) {
    return { kind: "tokens", access_token: accessToken, refresh_token: refreshToken };
  }
  if (accessToken) {
    return { kind: "tokens", access_token: accessToken, refresh_token: "" };
  }
  const error = params.get("error_description") ?? params.get("error");
  if (error) throw new Error(decodeURIComponent(error.replace(/\+/g, " ")));
  return null;
}

export function ResetPasswordForm() {
  return (
    <Suspense>
      <ResetPasswordFormInner />
    </Suspense>
  );
}

function ResetPasswordFormInner() {
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  // Parsed once from the email-redirect URL (?code=… or #access_token=…).
  const [{ recovery, linkError }] = useState<{
    recovery: Recovery | null;
    linkError?: string;
  }>(() => {
    try {
      return { recovery: readRecoveryFromUrl(searchParams.get("code")) };
    } catch (err) {
      return {
        recovery: null,
        linkError:
          err instanceof Error ? err.message : "This reset link is invalid.",
      };
    }
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextPasswordError =
      password.length >= 8 ? undefined : "Use at least 8 characters.";
    const nextConfirmError =
      confirm === password ? undefined : "Passwords don't match.";
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    setFormError(undefined);
    if (nextPasswordError || nextConfirmError || loading) return;
    if (!recovery) {
      setFormError("This reset link is invalid or has expired. Request a new one below.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(
        recovery.kind === "code"
          ? { password, code: recovery.code }
          : {
              password,
              access_token: recovery.access_token,
              refresh_token: recovery.refresh_token,
            },
      );
      // Drop token fragments from the URL so they aren't left in history.
      window.history.replaceState(null, "", window.location.pathname);
      setDone(true);
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "Could not update your password. Try again.",
      );
    } finally {
      setLoading(false);
    }
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
      {linkError ?? (!recovery ? "Open the reset link from your email to continue. Links expire after use." : null) ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-sm text-error"
        >
          {linkError ?? "Open the reset link from your email to continue. Links expire after use."}
        </p>
      ) : null}
      <form noValidate onSubmit={onSubmit}>
        {formError ? (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-sm text-error"
          >
            {formError}
          </p>
        ) : null}
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
        <PrimaryButton type="submit" loading={loading} loadingText="Updating…" className="mt-6">
          Update password
        </PrimaryButton>
      </form>
    </CenteredLayout>
  );
}
