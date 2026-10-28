import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResolveDataRequestForm } from "@/app/components/privacy-forms";
import { InternalShell } from "../internal-shell";
import { requireUserFast } from "@/lib/auth";
import {
  dataRequestKindLabels,
  dataRequestStatusLabels,
} from "@/lib/validation/privacy";
import internalStyles from "../internal.module.css";
import styles from "../team-management.module.css";

export const metadata: Metadata = { title: "Solicitações de privacidade" };

export default async function PrivacyRequestsPage() {
  const { supabase, user, activeCheck, ensureActive } = await requireUserFast();
  // Permissão, conta ativa e pedidos (com o nome de quem pediu) numa rodada.
  const [permission, activeResult, requestsResult] = await Promise.all([
    supabase.rpc("has_permission", {
      permission_name: "privacy.requests.manage",
    }),
    activeCheck,
    supabase
      .from("data_requests")
      .select(
        "id, user_id, kind, details, status, resolution_note, created_at, resolved_at, person:profiles!data_requests_user_id_fkey(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  await ensureActive(activeResult);
  if (permission.error || !permission.data) redirect("/acesso-negado");
  const requests = requestsResult.data ?? [];
  const names = new Map(
    requests.map((request) => {
      const person = Array.isArray(request.person)
        ? request.person[0]
        : request.person;
      return [request.user_id, person?.full_name ?? "Usuário"];
    }),
  );

  const active = requests.filter(
    (request) => request.status === "open" || request.status === "in_progress",
  );
  const closed = requests.filter(
    (request) => request.status === "resolved" || request.status === "rejected",
  );

  return (
    <InternalShell active="privacidade" isAdmin={true} email={user.email}>
      <section className={internalStyles.main}>
        <header className={internalStyles.pageHeader}>
          <div>
            <p className={internalStyles.eyebrow}>ADMINISTRAÇÃO</p>
            <h1>Solicitações de privacidade</h1>
            <p>Pedidos dos usuários sobre os próprios dados.</p>
          </div>
        </header>

        {requestsResult.error ? (
          <p className={internalStyles.error} role="alert">
            Não foi possível carregar as solicitações. Confirme se a migration
            202610150001 foi aplicada.
          </p>
        ) : (
          <>
            <section className={internalStyles.section}>
              <h2>Em aberto ({active.length})</h2>
              {active.length === 0 ? (
                <p className={internalStyles.empty}>
                  Nenhuma solicitação pendente.
                </p>
              ) : (
                <div className={styles.auditList}>
                  {active.map((request) => (
                    <article className={styles.auditRow} key={request.id}>
                      <strong>
                        {names.get(request.user_id)} ·{" "}
                        {dataRequestKindLabels[
                          request.kind as keyof typeof dataRequestKindLabels
                        ] ?? request.kind}
                      </strong>
                      <span>
                        {dataRequestStatusLabels[request.status]} ·{" "}
                        {new Date(request.created_at).toLocaleString("pt-BR")}
                      </span>
                      {request.details && <p>{request.details}</p>}
                      <ResolveDataRequestForm requestId={request.id} />
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className={internalStyles.section}>
              <h2>Encerradas ({closed.length})</h2>
              {closed.length === 0 ? (
                <p className={internalStyles.empty}>
                  Nenhuma solicitação encerrada.
                </p>
              ) : (
                <div className={styles.auditList}>
                  {closed.map((request) => (
                    <article className={styles.auditRow} key={request.id}>
                      <strong>
                        {names.get(request.user_id)} ·{" "}
                        {dataRequestKindLabels[
                          request.kind as keyof typeof dataRequestKindLabels
                        ] ?? request.kind}
                      </strong>
                      <span>
                        {dataRequestStatusLabels[request.status]} ·{" "}
                        {request.resolved_at
                          ? new Date(request.resolved_at).toLocaleString(
                              "pt-BR",
                            )
                          : ""}
                      </span>
                      {request.resolution_note && (
                        <p>{request.resolution_note}</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </InternalShell>
  );
}
