import type { Metadata } from "next";
import { ResetPasswordForm } from "./form";

export const metadata: Metadata = {
  title: "Reset password · TradeCraft",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
