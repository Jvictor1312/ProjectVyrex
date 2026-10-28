import type { Metadata } from "next";
import Link from "next/link";
import {
  AccountSettingsForm,
  DataRequestForm,
  PasswordForm,
} from "@/app/components/privacy-forms";
import { requireUserFast } from "@/lib/auth";
import {
  dataRequestKindLabels,
  dataRequestStatusLabels,
} from "@/lib/validation/privacy";
import { CreatorShell } from "../creator-shell";
import styles from "../dashboard.module.css";

export const metadata: Metadata = { title: "Configurações" };

// Conta, senha e privacidade numa só tela; a privacidade fica recolhida.
export default async function CreatorSettingsPage() {
  const { supabase, user, activeCheck, ensureActive } = await requireUserFast();
  const [profileResult, requestsResult, activeResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("data_requests")
      .select("id, kind, details, status, resolution_note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    activeCheck,
  ]);
  await ensureActive(activeResult);
  const profile = profileResult.data;
  const requests = requestsResult.data ?? [];

  return (
    <CreatorShell>
      <section className="dashboard-content">
        <h1>Configurações</h1>
        <p className="dashboard-email">{user.email}</p>
        {profileResult.error || !profile ? (
          <p className="setup-warning" role="alert">
            Não foi possível carregar os dados da conta.
          </p>
        ) : (
          <section className={styles.historySection}>
            <h2>Seus dados</h2>
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

        <details className={styles.privacy} id="privacidade">
          <summary>Privacidade e seus dados</summary>
          <p className={styles.statusDescription}>
            Peça acesso, correção, cópia ou exclusão dos seus dados. Veja a{" "}
            <Link href="/privacidade">política de privacidade</Link>.
          </p>
          <DataRequestForm />
          {requests.length > 0 && (
            <ol className={styles.requestList}>
              {requests.map((request) => (
                <li key={request.id}>
                  <strong>
                    {dataRequestKindLabels[
                      request.kind as keyof typeof dataRequestKindLabels
                    ] ?? request.kind}{" "}
                    ·{" "}
                    {dataRequestStatusLabels[request.status] ?? request.status}
                  </strong>
                  <time dateTime={request.created_at}>
                    {new Date(request.created_at).toLocaleDateString("pt-BR")}
                  </time>
                  {request.resolution_note && (
                    <p>Resposta da equipe: {request.resolution_note}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </details>
      </section>
    </CreatorShell>
  );
}
