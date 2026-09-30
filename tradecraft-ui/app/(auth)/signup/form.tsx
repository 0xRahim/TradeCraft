"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActivityFeed } from "@/components/auth/activity-feed";
import { AuthHeading, AuthSub } from "@/components/auth/auth-bits";
import { AuthInput } from "@/components/auth/auth-input";
import { Field } from "@/components/auth/field";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordMeter } from "@/components/auth/password-meter";
import { PrimaryButton } from "@/components/auth/primary-button";
import { SplitLayout } from "@/components/auth/split-layout";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth/auth-context";
import { isValidEmail } from "@/lib/auth/password";

export function SignupForm() {
  const router = useRouter();
  const { status, signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [pendingConfirmation, setPendingConfirmation] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authed") router.replace("/dashboard");
  }, [status, router]);

  async function onSubmit(e: React.FormEvent) {
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
    setFormError(undefined);
    if (nextNameError || nextEmailError || nextPasswordError || loading) return;
    setLoading(true);
    try {
      const { confirmationRequired } = await signup({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      if (confirmationRequired) {
        setPendingConfirmation(email.trim());
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "Could not create your account. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (pendingConfirmation) {
    return (
      <SplitLayout aside={<ActivityFeed />}>
        <AuthHeading>Check your email</AuthHeading>
        <AuthSub>
          We sent a confirmation link to{" "}
          <span className="font-mono text-foreground">{pendingConfirmation}</span>.
          Open it to finish creating your account, then log in.
        </AuthSub>
        <Link
          href="/login"
          className="mt-6 flex h-9 w-full items-center justify-center rounded-lg bg-primary font-sans text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover"
        >
          Continue to log in
        </Link>
      </SplitLayout>
    );
  }

  return (
    <SplitLayout aside={<ActivityFeed />}>
      <AuthHeading>Create your account</AuthHeading>
      <AuthSub>Start journaling in under a minute.</AuthSub>
      <form noValidate onSubmit={onSubmit}>
        {formError ? (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-sm text-error"
          >
            {formError}
          </p>
        ) : null}
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
