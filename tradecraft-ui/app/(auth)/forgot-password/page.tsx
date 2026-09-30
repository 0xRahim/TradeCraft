import type { Metadata } from "next";
import { ForgotPasswordForm } from "./form";

export const metadata: Metadata = {
  title: "Forgot password · TradeCraft",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
