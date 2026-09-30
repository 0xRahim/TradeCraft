"use client";

import Link from "next/link";
import { useState } from "react";
import { ActivityFeed } from "@/components/auth/activity-feed";
import { AuthHeading, AuthSub } from "@/components/auth/auth-bits";
import { AuthInput } from "@/components/auth/auth-input";
import { Field } from "@/components/auth/field";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordMeter } from "@/components/auth/password-meter";
import { PrimaryButton } from "@/components/auth/primary-button";
import { SplitLayout } from "@/components/auth/split-layout";
import { isValidEmail } from "@/lib/auth/password";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextNameError = name.trim() ? undefined : "Enter your name.";
    const nextEmailError = isValidEmail(email)
      ? undefined
      : "Enter a valid email address.";
    const nextPasswordError =
      password.length >= 8 ? undefined : "Use at least 8 characters.";
    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextNameError || nextEmailError || nextPasswordError || loading) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 1400);
  }

  return (
    <SplitLayout aside={<ActivityFeed />}>
      <AuthHeading>Create your account</AuthHeading>
      <AuthSub>Start journaling in under a minute.</AuthSub>
      <form noValidate onSubmit={onSubmit}>
        <Field label="Full name" htmlFor="name" error={nameError}>
          <AuthInput
            id="name"
            placeholder="Ada Lovelace"
            autoComplete="name"
            invalid={Boolean(nameError)}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Email" htmlFor="email" error={emailError}>
          <AuthInput
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            invalid={Boolean(emailError)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <div className="mb-4">
          <label
            htmlFor="password"
            className="mb-2 flex items-center justify-between text-sm font-medium"
          >
            <span>Password</span>
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            invalid={Boolean(passwordError)}
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
        <PrimaryButton
          type="submit"
          loading={loading}
          loadingText="Creating account…"
          className="mt-6"
        >
          Create account
        </PrimaryButton>
      </form>
      <p className="mt-4 text-center text-xs text-subtle-foreground">
        By continuing you agree to the{" "}
        <Link href="#" className="text-muted-foreground hover:underline hover:underline-offset-4">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="#" className="text-muted-foreground hover:underline hover:underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline hover:underline-offset-4">
          Log in
        </Link>
      </p>
    </SplitLayout>
  );
}
