"use client";

import Link from "next/link";
import { useState } from "react";
import { ActivityFeed } from "@/components/auth/activity-feed";
import { AuthHeading, AuthSub } from "@/components/auth/auth-bits";
import { AuthInput } from "@/components/auth/auth-input";
import { Field } from "@/components/auth/field";
import { PasswordInput } from "@/components/auth/password-input";
import { PrimaryButton } from "@/components/auth/primary-button";
import { SplitLayout } from "@/components/auth/split-layout";
import { isValidEmail } from "@/lib/auth/password";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextEmailError = isValidEmail(email)
      ? undefined
      : "Enter a valid email address.";
    const nextPasswordError = password ? undefined : "Enter your password.";
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError || loading) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 1400);
  }

  return (
    <SplitLayout aside={<ActivityFeed />}>
      <AuthHeading>Welcome back</AuthHeading>
      <AuthSub>Log in to review your trades.</AuthSub>
      <form noValidate onSubmit={onSubmit}>
        <Field label="Email" htmlFor="email" error={emailError}>
          <AuthInput
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            invalid={Boolean(emailError)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={emailError ? "email-error" : undefined}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          error={passwordError}
          action={
            <Link
              href="/forgot-password"
              className="font-normal text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
            >
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            invalid={Boolean(passwordError)}
            value={password}
            onChange={setPassword}
          />
        </Field>
        <PrimaryButton type="submit" loading={loading} loadingText="Logging in…" className="mt-6">
          Log in
        </PrimaryButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to TradeEye?{" "}
        <Link href="/signup" className="font-medium text-foreground hover:underline hover:underline-offset-4">
          Create an account
        </Link>
      </p>
    </SplitLayout>
  );
}
