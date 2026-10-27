import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/app/components/auth-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecoveryPage() {
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/">
        <span className="brand-mark">V</span>
        <span>VYREX</span>
      </Link>
      <AuthForm mode="recovery" />
      <p className="auth-footer">Sua presença, novas possibilidades.</p>
    </main>
  );
}
