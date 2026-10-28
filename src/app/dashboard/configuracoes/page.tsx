import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { CreatorNav } from "@/app/components/creator-nav";
import {
  AccountSettingsForm,
  PasswordForm,
} from "@/app/components/privacy-forms";
import { requireUser } from "@/lib/auth";
import styles from "../dashboard.module.css";

export const metadata: Metadata = { title: "Configurações da conta" };

export default async function CreatorSettingsPage() {
  const { supabase, user } = await requireUser();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">V</span>
          <span>VYREX</span>
        </Link>
        <form action={logoutAction}>
          <button className="quiet-button" type="submit">
            Sair
          </button>
        </form>
      </header>
      <CreatorNav />
      <section className="dashboard-content">
        <h1>Sua conta</h1>
        <p className="dashboard-email">{user.email}</p>
        {error || !profile ? (
          <p className="setup-warning" role="alert">
            Não foi possível carregar os dados da conta.
          </p>
        ) : (
          <section className={styles.historySection}>
            <h2>Dados da conta</h2>
            <AccountSettingsForm
              initial={{
                fullName: profile.full_name ?? "",
                phone: profile.phone ?? "",
              }}
            />
          </section>
        )}
        <section className={styles.historySection}>
          <h2>Alterar senha</h2>
          <PasswordForm />
        </section>
        <section className={styles.historySection}>
          <h2>Encerrar sessão</h2>
          <form action={logoutAction}>
            <button className="button button-dark" type="submit">
              Sair da conta
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
