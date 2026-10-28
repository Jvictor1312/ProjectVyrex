import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/app/components/auth-form";
import { VyrexLogo } from "@/app/components/vyrex-logo";

export const metadata: Metadata = { title: "Definir nova senha" };

export default function ResetPasswordPage() {
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/">
        <VyrexLogo />
      </Link>
      <AuthForm mode="reset" />
    </main>
  );
}
