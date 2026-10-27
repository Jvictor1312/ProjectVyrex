import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/app/components/auth-form";

export const metadata: Metadata = { title: "Definir nova senha" };

export default function ResetPasswordPage() {
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/">
        <span className="brand-mark">V</span>
        <span>VYREX</span>
      </Link>
      <AuthForm mode="reset" />
      <p className="auth-footer">Sua presença, novas possibilidades.</p>
    </main>
  );
}
