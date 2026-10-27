import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { CreatorNav } from "@/app/components/creator-nav";
import { DataRequestForm } from "@/app/components/privacy-forms";
import { requireUser } from "@/lib/auth";
import {
  dataRequestKindLabels,
  dataRequestStatusLabels,
} from "@/lib/validation/privacy";
import styles from "../dashboard.module.css";

export const metadata: Metadata = { title: "Privacidade e dados" };

export default async function CreatorPrivacyPage() {
  const { supabase, user } = await requireUser();
  const { data: requests, error } = await supabase
    .from("data_requests")
    .select("id, kind, details, status, resolution_note, created_at, resolved_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

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
        <p className="eyebrow">
          <span /> PRIVACIDADE
        </p>
        <h1>Seus dados</h1>
        <p className={styles.statusDescription}>
          Você pode pedir acesso, correção, cópia, eliminação ou oposição ao
          tratamento dos seus dados. A plataforma registra o pedido e a
          resposta da equipe; a análise é feita manualmente e pode depender de
          obrigações legais. Consulte a{" "}
          <Link href="/privacidade">política de privacidade</Link> (rascunho em
          revisão jurídica).
        </p>

        <section className={styles.historySection}>
          <h2>Nova solicitação</h2>
          <DataRequestForm />
        </section>

        <section className={styles.historySection}>
          <h2>Minhas solicitações</h2>
          {error ? (
            <p className="setup-warning" role="alert">
              Não foi possível carregar as solicitações. Confirme se as
              migrations foram aplicadas.
            </p>
          ) : !requests || requests.length === 0 ? (
            <p className={styles.empty}>Você ainda não fez solicitações.</p>
          ) : (
            <ol>
              {requests.map((request) => (
                <li key={request.id}>
                  <strong>
                    {dataRequestKindLabels[
                      request.kind as keyof typeof dataRequestKindLabels
                    ] ?? request.kind}{" "}
                    · {dataRequestStatusLabels[request.status] ?? request.status}
                  </strong>
                  <time dateTime={request.created_at}>
                    {new Date(request.created_at).toLocaleString("pt-BR")}
                  </time>
                  {request.details && <p>{request.details}</p>}
                  {request.resolution_note && (
                    <p>
                      <strong>Resposta da equipe:</strong>{" "}
                      {request.resolution_note}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      </section>
    </main>
  );
}
