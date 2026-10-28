import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResolveDataRequestForm } from "@/app/components/privacy-forms";
import { InternalShell } from "../internal-shell";
import { requireUser } from "@/lib/auth";
import {
  dataRequestKindLabels,
  dataRequestStatusLabels,
} from "@/lib/validation/privacy";
import internalStyles from "../internal.module.css";
import styles from "../team-management.module.css";

export const metadata: Metadata = { title: "Solicitações de privacidade" };

export default async function PrivacyRequestsPage() {
  const { supabase, user } = await requireUser();
  const { data: allowed, error: permissionError } = await supabase.rpc(
    "has_permission",
    { permission_name: "privacy.requests.manage" },
  );
  if (permissionError || !allowed) redirect("/acesso-negado");

  const requestsResult = await supabase
    .from("data_requests")
    .select(
      "id, user_id, kind, details, status, resolution_note, created_at, resolved_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  const requests = requestsResult.data ?? [];

  const userIds = [...new Set(requests.map((request) => request.user_id))];
  const profilesResult = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [], error: null };
  const names = new Map(
    (profilesResult.data ?? []).map((profile) => [
      profile.id,
      profile.full_name,
    ]),
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
            <p>
              Pedidos de titulares sobre seus dados. A plataforma registra o
              andamento e a resposta; o atendimento efetivo (como exportar ou
              eliminar dados) é um procedimento manual da empresa. Cada
              atualização gera auditoria e notifica o titular.
            </p>
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
                        {names.get(request.user_id) ??
                          request.user_id.slice(0, 8)}{" "}
                        ·{" "}
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
                        {names.get(request.user_id) ??
                          request.user_id.slice(0, 8)}{" "}
                        ·{" "}
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
