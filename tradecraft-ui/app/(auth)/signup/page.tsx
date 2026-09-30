import type { Metadata } from "next";
import { SignupForm } from "./form";

export const metadata: Metadata = {
  title: "Sign up · TradeEye",
};

export default function SignupPage() {
  return <SignupForm />;
}
