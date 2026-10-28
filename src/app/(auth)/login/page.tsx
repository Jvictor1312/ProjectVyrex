import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/app/components/auth-form";
import { fetchActiveRoleKeys, getSignedInUser } from "@/lib/auth";
import { dashboardPathForRoles } from "@/lib/auth-routing";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    configuracao?: string | string[];
    "conta-desativada"?: string | string[];
    "senha-atualizada"?: string | string[];
  }>;
}) {
  const params = await searchParams;
  // Quem já está logado não precisa entrar de novo: vai direto ao painel.
  const signedIn = await getSignedInUser();
  if (signedIn) {
    const roles = await fetchActiveRoleKeys(signedIn.supabase, signedIn.user.id);
    if (!roles.error) redirect(dashboardPathForRoles(roles.keys));
  }
  const configurationMessage =
    params.configuracao === "supabase"
      ? "O acesso ainda não está disponível neste ambiente. A equipe precisa configurar o Supabase."
      : params.configuracao === "banco"
        ? "O banco da plataforma ainda não está configurado. A equipe precisa aplicar as migrations."
        : null;
  const accountDisabled = params["conta-desativada"] === "1";
  const passwordUpdated = params["senha-atualizada"] === "1";

  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/">
        <span className="brand-mark">V</span>
        <span>VYREX</span>
      </Link>
      {configurationMessage && (
        <p className="form-message error" role="alert">
          {configurationMessage}
        </p>
      )}
      {accountDisabled && (
        <p className="form-message error" role="alert">
          Esta conta está desativada. Entre em contato com a equipe Vyrex.
        </p>
      )}
      {passwordUpdated && (
        <p className="form-message success" role="status">
          Sua senha foi atualizada. Entre com a nova senha.
        </p>
      )}
      <AuthForm mode="login" />
    </main>
  );
}
