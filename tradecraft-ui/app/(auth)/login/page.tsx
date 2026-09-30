import type { Metadata } from "next";
import { LoginForm } from "./form";

export const metadata: Metadata = {
  title: "Log in · TradeCraft",
};

export default function LoginPage() {
  return <LoginForm />;
}
