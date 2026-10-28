import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResolveDataRequestForm } from "@/app/components/privacy-forms";
import { InternalShell } from "../internal-shell";
import { requireUserFast } from "@/lib/auth";
import {
  dataRequestKindLabels,
  dataRequestStatusLabels,
} from "@/lib/validation/privacy";
import styles from "../internal.module.css";
import teamStyles from "../team.module.css";
import { Badge, EmptyState, Notice, PageHeader, Panel, Stats } from "../ui";

export const metadata: Metadata = { title: "Pedidos de privacidade" };

const when = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : "—";

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
  const nameOf = (request: (typeof requests)[number]) => {
    const person = Array.isArray(request.person) ? request.person[0] : request.person;
    return person?.full_name ?? "Usuário sem nome";
  };
  const kindOf = (kind: string) =>
    dataRequestKindLabels[kind as keyof typeof dataRequestKindLabels] ?? kind;

  const open = requests.filter(
    (request) => request.status === "open" || request.status === "in_progress",
  );
  const closed = requests.filter(
    (request) => request.status === "resolved" || request.status === "rejected",
  );

  return (
    <InternalShell active="privacidade" isAdmin={true} email={user.email}>
      <section className={styles.main}>
        <PageHeader
          title="Pedidos de privacidade"
          description="Pedidos de criadores e colaboradores sobre os próprios dados (acesso, correção, exclusão). Cada resposta fica registrada."
        />

        {requestsResult.error ? (
          <Notice tone="danger" role="alert">
            Não foi possível carregar os pedidos agora. Atualize a página; se o
            erro continuar, verifique a conexão com o banco de dados.
          </Notice>
        ) : (
          <>
            <Stats
              label="Resumo dos pedidos"
              items={[
                { label: "Aguardando resposta", value: open.length.toLocaleString("pt-BR") },
                { label: "Encerrados", value: closed.length.toLocaleString("pt-BR") },
              ]}
            />

            <Panel
              title="Aguardando resposta"
              description="Responda cada pedido e registre o que foi feito."
              flush
            >
              {open.length === 0 ? (
                <EmptyState
                  title="Nenhum pedido em aberto"
                  text="Quando alguém pedir acesso, correção ou exclusão de dados, o pedido aparece aqui."
                />
              ) : (
                <ul className={teamStyles.requestList}>
                  {open.map((request) => (
                    <li key={request.id}>
                      <div className={teamStyles.requestHead}>
                        <strong>{kindOf(request.kind)}</strong>
                        <Badge tone={request.status === "open" ? "warning" : "info"}>
                          {dataRequestStatusLabels[request.status]}
                        </Badge>
                      </div>
                      <p className={teamStyles.hint}>
                        {nameOf(request)} · pedido em {when(request.created_at)}
                      </p>
                      {request.details && <p className={teamStyles.requestText}>{request.details}</p>}
                      <ResolveDataRequestForm requestId={request.id} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Encerrados" flush>
              {closed.length === 0 ? (
                <EmptyState title="Nenhum pedido encerrado ainda" />
              ) : (
                <table className={teamStyles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Pedido</th>
                      <th scope="col">Pessoa</th>
                      <th scope="col">Resultado</th>
                      <th scope="col">Resposta</th>
                      <th scope="col">Encerrado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closed.map((request) => (
                      <tr key={request.id}>
                        <td data-label="Pedido">{kindOf(request.kind)}</td>
                        <td data-label="Pessoa">{nameOf(request)}</td>
                        <td data-label="Resultado">
                          <Badge tone={request.status === "resolved" ? "success" : "danger"}>
                            {dataRequestStatusLabels[request.status]}
                          </Badge>
                        </td>
                        <td data-label="Resposta">
                          <span className={teamStyles.muted}>{request.resolution_note ?? "—"}</span>
                        </td>
                        <td data-label="Encerrado em">
                          <span className={teamStyles.date}>{when(request.resolved_at)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          </>
        )}
      </section>
    </InternalShell>
  );
}
