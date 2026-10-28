import type { Metadata } from "next";
import Link from "next/link";
import { RecoveryForm } from "@/app/components/recovery-form";
import { VyrexLogo } from "@/app/components/vyrex-logo";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecoveryPage() {
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/">
        <VyrexLogo />
      </Link>
      <RecoveryForm />
    </main>
  );
}
