import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InternalShell } from "./internal-shell";
import { CreatorQueue } from "./creator-queue";
import { requireUserWithRoles } from "@/lib/auth";
import {
  creatorStatusKeys,
  isInternalRole,
  platformLabels,
  roleLabels,
  type CreatorStatus,
  type InternalRole,
} from "@/lib/labels";
import styles from "./internal.module.css";
import { PageHeader, Stats } from "./ui";

export const metadata: Metadata = { title: "Visão geral da operação" };

function accountName(
  person: { full_name: string | null } | { full_name: string | null }[] | null,
) {
  const value = Array.isArray(person) ? person[0] : person;
  return value?.full_name ?? null;
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function stringParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function formatCount(count: number | null) {
  return count === null ? "—" : count.toLocaleString("pt-BR");
}

// Título e descrição de cada perfil: cada um vê a tela pelo próprio trabalho.
const headings: Record<InternalRole, { title: string; description: string; list: string }> = {
  admin: {
    title: "Visão geral da operação",
    description:
      "Situação dos cadastros de criadores, distribuição entre responsáveis e redes declaradas.",
    list: "Cadastros de criadores",
  },
  validator: {
    title: "Fila de validação",
    description:
      "Cadastros encaminhados para conferência de redes e evidências, dos mais antigos para os mais recentes.",
    list: "Cadastros para validar",
  },
  recruiter: {
    title: "Triagem de criadores",
    description:
      "Cadastros da sua carteira. Confira os dados e encaminhe para validação os que estiverem completos.",
    list: "Sua carteira",
  },
  relationship_manager: {
    title: "Criadores acompanhados",
    description:
      "Criadores sob a sua responsabilidade: contatos, mensagens e pendências de cada cadastro.",
    list: "Seus criadores",
  },
};

export default async function InternalDashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { supabase, user, roleKeys, rolesError } = await requireUserWithRoles();
  const params = await searchParams;
  const search = stringParam(params.q)?.trim().slice(0, 80) ?? "";
  const rawStatus = stringParam(params.status) ?? "all";
  const selectedStatus = creatorStatusKeys.includes(rawStatus as CreatorStatus)
    ? (rawStatus as CreatorStatus)
    : "all";
  const rawPage = Number(stringParam(params.page) ?? "1");
  const page =
    Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 10000) : 1;
  const pageSize = 25;

  if (rolesError) redirect("/dashboard");
  const roles = roleKeys.filter(isInternalRole);
  if (roles.length === 0) redirect("/acesso-negado");

  const primaryRole: InternalRole = roles.includes("admin")
    ? "admin"
    : roles.includes("validator")
      ? "validator"
      : roles.includes("relationship_manager")
        ? "relationship_manager"
        : "recruiter";

  // O analista só trabalha com cadastros em validação.
  const validationStates: CreatorStatus[] = ["submitted", "under_review", "changes_requested"];
  const statusOptions =
    primaryRole === "validator" ? validationStates : [...creatorStatusKeys];
  const statuses =
    selectedStatus === "all"
      ? statusOptions
      : statusOptions.includes(selectedStatus)
        ? [selectedStatus]
        : [];

  const creatorsQuery = supabase
    .from("creator_profiles")
    .select(
      "user_id, public_name, status, submitted_at, updated_at, account:profiles!creator_profiles_user_id_fkey(full_name)",
      { count: "exact" },
    )
    .in("status", statuses)
    .ilike("public_name", search ? `%${search}%` : "%")
    .order(primaryRole === "validator" ? "submitted_at" : "updated_at", {
      ascending: primaryRole === "validator",
    })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const countByStatus = (status?: CreatorStatus) => {
    const query = supabase
      .from("creator_profiles")
      .select("user_id", { count: "exact", head: true });
    return status ? query.eq("status", status) : query;
  };
  const adminOnly = <T, F>(promise: PromiseLike<T>, fallback: F): PromiseLike<T | F> =>
    primaryRole === "admin" ? promise : Promise.resolve(fallback);
  const noCount = { count: null, error: null } as const;

  const [
    creatorResult,
    totalResult,
    submittedResult,
    reviewResult,
    correctionsResult,
    approvedResult,
    recruiterAssignmentsResult,
    managerAssignmentsResult,
    socialAccountsResult,
    decisionTimesResult,
  ] = await Promise.all([
    creatorsQuery,
    adminOnly(countByStatus(), noCount),
    adminOnly(countByStatus("submitted"), noCount),
    adminOnly(countByStatus("under_review"), noCount),
    adminOnly(countByStatus("changes_requested"), noCount),
    adminOnly(countByStatus("approved"), noCount),
    supabase
      .from("recruiter_assignments")
      .select(
        "creator_id, recruiter_id, person:profiles!recruiter_assignments_recruiter_id_fkey(full_name)",
      )
      .is("ended_at", null),
    supabase
      .from("relationship_assignments")
      .select(
        "creator_id, manager_id, person:profiles!relationship_assignments_manager_id_fkey(full_name)",
      )
      .is("ended_at", null),
    supabase.from("social_accounts").select("platform"),
    adminOnly(
      supabase
        .from("creator_profiles")
        .select("submitted_at, decided_at")
        .not("submitted_at", "is", null)
        .not("decided_at", "is", null),
      { data: null, error: null },
    ),
  ]);

  const countBy = <T,>(items: T[], key: (item: T) => string) => {
    const counts = new Map<string, number>();
    for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
    return counts;
  };
  const recruiterCounts = countBy(recruiterAssignmentsResult.data ?? [], (a) => a.recruiter_id);
  const managerCounts = countBy(managerAssignmentsResult.data ?? [], (a) => a.manager_id);
  const socialCounts = countBy(socialAccountsResult.data ?? [], (a) => a.platform);

  const staffNames = new Map<string, string>();
  for (const row of [
    ...(recruiterAssignmentsResult.data ?? []).map((item) => ({ id: item.recruiter_id, person: item.person })),
    ...(managerAssignmentsResult.data ?? []).map((item) => ({ id: item.manager_id, person: item.person })),
  ]) {
    const name = accountName(row.person);
    if (name) staffNames.set(row.id, name);
  }
  const toReport = (counts: Map<string, number>, label: (key: string) => string) =>
    [...counts]
      .map(([key, count]) => ({ name: label(key), count }))
      .sort((a, b) => b.count - a.count);

  const analysisDays = (decisionTimesResult.data ?? [])
    .filter((entry) => entry.submitted_at && entry.decided_at)
    .map(
      (entry) =>
        (new Date(entry.decided_at!).getTime() - new Date(entry.submitted_at!).getTime()) /
        86_400_000,
    );
  // Média só com amostra mínima, para não exibir um número enganoso.
  const averageAnalysis =
    analysisDays.length >= 5
      ? `${(analysisDays.reduce((total, days) => total + days, 0) / analysisDays.length).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias`
      : "—";

  const creators = creatorResult.data ?? [];
  const totalPages = Math.max(1, Math.ceil((creatorResult.count ?? 0) / pageSize));
  const pageHref = (targetPage: number) => {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (selectedStatus !== "all") next.set("status", selectedStatus);
    next.set("page", String(targetPage));
    return `/interno?${next.toString()}`;
  };

  const heading = headings[primaryRole];
  const hasQueryError =
    Boolean(creatorResult.error) ||
    [totalResult, submittedResult, reviewResult, correctionsResult, approvedResult].some(
      (result) => result.error,
    );

  return (
    <InternalShell
      active="painel"
      isAdmin={roles.includes("admin")}
      roles={roles.map((role) => roleLabels[role])}
      email={user.email}
    >
      <section className={styles.main}>
        <PageHeader title={heading.title} description={heading.description} />

        {primaryRole === "admin" && (
          <>
            <Stats
              label="Indicadores dos cadastros"
              items={[
                { label: "Cadastros no total", value: formatCount(totalResult.count) },
                { label: "Aguardando análise", value: formatCount(submittedResult.count) },
                { label: "Em análise", value: formatCount(reviewResult.count) },
                { label: "Com correção pendente", value: formatCount(correctionsResult.count) },
                { label: "Aprovados", value: formatCount(approvedResult.count) },
                {
                  label: "Tempo médio de análise",
                  value: averageAnalysis,
                  hint: analysisDays.length < 5 ? "(a partir de 5 decisões)" : undefined,
                },
              ]}
            />
            <div className={styles.reports}>
              <Report
                title="Carteira por recrutador"
                empty="Nenhum criador atribuído a recrutadores."
                rows={toReport(recruiterCounts, (id) => staffNames.get(id) ?? "Sem nome")}
              />
              <Report
                title="Carteira por gestor de relacionamento"
                empty="Nenhum criador atribuído a gestores."
                rows={toReport(managerCounts, (id) => staffNames.get(id) ?? "Sem nome")}
              />
              <Report
                title="Redes declaradas"
                empty="Nenhuma rede social cadastrada ainda."
                rows={toReport(socialCounts, (key) => platformLabels[key] ?? key)}
              />
            </div>
          </>
        )}

        <CreatorQueue
          title={heading.list}
          rows={creators.map((creator) => ({
            id: creator.user_id,
            name: creator.public_name || accountName(creator.account) || "Sem nome público",
            status: creator.status,
            submittedAt: creator.submitted_at,
            updatedAt: creator.updated_at,
            href: `/interno/${creator.user_id}`,
          }))}
          total={creatorResult.count ?? null}
          search={search}
          status={selectedStatus}
          statusOptions={statusOptions}
          page={page}
          totalPages={totalPages}
          pageHref={pageHref}
          loadError={hasQueryError}
        />
      </section>
    </InternalShell>
  );
}

function Report({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: { name: string; count: number }[];
}) {
  return (
    <section className={styles.report}>
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p>{empty}</p>
      ) : (
        rows.map((row) => (
          <div className={styles.reportRow} key={row.name}>
            <span>{row.name}</span>
            <strong>{row.count.toLocaleString("pt-BR")}</strong>
          </div>
        ))
      )}
    </section>
  );
}
