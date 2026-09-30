import type { Metadata } from "next";
import { SignupForm } from "./form";

export const metadata: Metadata = {
  title: "Sign up · TradeCraft",
};

export default function SignupPage() {
  return <SignupForm />;
}
