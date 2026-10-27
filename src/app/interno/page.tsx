import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";
import styles from "./internal.module.css";

export const metadata: Metadata = { title: "Painel interno" };

const statusOptions = [
  "incomplete",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "rejected",
  "suspended",
] as const;

const statusLabels: Record<(typeof statusOptions)[number], string> = {
  incomplete: "Incompleto",
  submitted: "Aguardando análise",
  under_review: "Em análise",
  changes_requested: "Correção solicitada",
  approved: "Aprovado",
  rejected: "Rejeitado",
  suspended: "Suspenso",
};

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  recruiter: "Recrutador",
  relationship_manager: "Relacionamento",
  validator: "Validação",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function stringParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function formatCount(count: number | null) {
  return count === null ? "—" : count.toLocaleString("pt-BR");
}

export default async function InternalDashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const search = stringParam(params.q)?.trim().slice(0, 80) ?? "";
  const rawStatus = stringParam(params.status) ?? "all";
  const selectedStatus = statusOptions.includes(
    rawStatus as (typeof statusOptions)[number],
  )
    ? (rawStatus as (typeof statusOptions)[number])
    : "all";
  const rawPage = Number(stringParam(params.page) ?? "1");
  const page =
    Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 10000) : 1;
  const pageSize = 25;

  const roleLinks = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", user.id)
    .is("revoked_at", null);
  if (roleLinks.error) redirect("/dashboard");

  const roleIds = (roleLinks.data ?? []).map((link) => link.role_id);
  if (roleIds.length === 0) redirect("/acesso-negado");

  const roleRows = await supabase.from("roles").select("key").in("id", roleIds);
  if (roleRows.error) redirect("/dashboard");

  const roles = (roleRows.data ?? [])
    .map((role) => role.key)
    .filter((role) => role in roleLabels);
  if (roles.length === 0) redirect("/acesso-negado");

  const primaryRole = roles.includes("admin")
    ? "admin"
    : roles.includes("validator")
      ? "validator"
      : roles.includes("relationship_manager")
        ? "relationship_manager"
        : "recruiter";

  const statuses =
    selectedStatus === "all" ? [...statusOptions] : [selectedStatus];
  let creatorsQuery = supabase
    .from("creator_profiles")
    .select("user_id, public_name, status, submitted_at, updated_at", {
      count: "exact",
    })
    .in("status", statuses)
    .ilike("public_name", search ? `%${search}%` : "%")
    .order("updated_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (primaryRole === "validator") {
    const validationStates = ["submitted", "under_review", "changes_requested"];
    const allowedStates =
      selectedStatus === "all"
        ? validationStates
        : validationStates.includes(selectedStatus)
          ? [selectedStatus]
          : [];
    creatorsQuery = supabase
      .from("creator_profiles")
      .select("user_id, public_name, status, submitted_at, updated_at", {
        count: "exact",
      })
      .in("status", allowedStates)
      .ilike("public_name", search ? `%${search}%` : "%")
      .order("submitted_at", { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1);
  }

  const [
    creatorResult,
    totalResult,
    submittedResult,
    correctionsResult,
    approvedResult,
    rejectedResult,
    recruiterAssignmentsResult,
    managerAssignmentsResult,
    socialAccountsResult,
    decisionTimesResult,
  ] = await Promise.all([
    creatorsQuery,
    primaryRole === "admin"
      ? supabase
          .from("creator_profiles")
          .select("user_id", { count: "exact", head: true })
      : Promise.resolve({ count: null, error: null }),
    primaryRole === "admin"
      ? supabase
          .from("creator_profiles")
          .select("user_id", { count: "exact", head: true })
          .eq("status", "submitted")
      : Promise.resolve({ count: null, error: null }),
    primaryRole === "admin"
      ? supabase
          .from("creator_profiles")
          .select("user_id", { count: "exact", head: true })
          .eq("status", "changes_requested")
      : Promise.resolve({ count: null, error: null }),
    primaryRole === "admin"
      ? supabase
          .from("creator_profiles")
          .select("user_id", { count: "exact", head: true })
          .eq("status", "approved")
      : Promise.resolve({ count: null, error: null }),
    primaryRole === "admin"
      ? supabase
          .from("creator_profiles")
          .select("user_id", { count: "exact", head: true })
          .eq("status", "rejected")
      : Promise.resolve({ count: null, error: null }),
    supabase
      .from("recruiter_assignments")
      .select("creator_id, recruiter_id")
      .is("ended_at", null),
    supabase
      .from("relationship_assignments")
      .select("creator_id, manager_id")
      .is("ended_at", null),
    supabase.from("social_accounts").select("platform"),
    primaryRole === "admin"
      ? supabase
          .from("creator_profiles")
          .select("submitted_at, decided_at")
          .not("submitted_at", "is", null)
          .not("decided_at", "is", null)
      : Promise.resolve({ data: null, error: null }),
  ]);

  const recruiterCounts = new Map<string, number>();
  for (const assignment of recruiterAssignmentsResult.data ?? []) {
    recruiterCounts.set(
      assignment.recruiter_id,
      (recruiterCounts.get(assignment.recruiter_id) ?? 0) + 1,
    );
  }
  const managerCounts = new Map<string, number>();
  for (const assignment of managerAssignmentsResult.data ?? []) {
    managerCounts.set(
      assignment.manager_id,
      (managerCounts.get(assignment.manager_id) ?? 0) + 1,
    );
  }
  const socialCounts = new Map<string, number>();
  for (const account of socialAccountsResult.data ?? []) {
    socialCounts.set(
      account.platform,
      (socialCounts.get(account.platform) ?? 0) + 1,
    );
  }
  const averageAnalysisDays = (decisionTimesResult.data ?? [])
    .filter((entry) => entry.submitted_at && entry.decided_at)
    .map(
      (entry) =>
        (new Date(entry.decided_at!).getTime() -
          new Date(entry.submitted_at!).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  const averageAnalysisLabel =
    averageAnalysisDays.length >= 5
      ? `${(averageAnalysisDays.reduce((total, days) => total + days, 0) / averageAnalysisDays.length).toFixed(1)} dias`
      : "Dados insuficientes";
  const assignedStaffIds =
    primaryRole === "admin"
      ? [...new Set([...recruiterCounts.keys(), ...managerCounts.keys()])]
      : [];
  const staffProfileResult = assignedStaffIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", assignedStaffIds)
    : { data: [], error: null };
  const staffNames = new Map(
    (staffProfileResult.data ?? []).map((profile) => [
      profile.id,
      profile.full_name,
    ]),
  );
  const recruiterReport = [...recruiterCounts].map(([staffId, count]) => ({
    name: staffNames.get(staffId) ?? staffId.slice(0, 8),
    count,
  }));
  const managerReport = [...managerCounts].map(([staffId, count]) => ({
    name: staffNames.get(staffId) ?? staffId.slice(0, 8),
    count,
  }));

  const creators = creatorResult.data ?? [];
  const totalPages = Math.max(
    1,
    Math.ceil((creatorResult.count ?? 0) / pageSize),
  );
  const pageLink = (targetPage: number) => {
    const nextParams = new URLSearchParams();
    if (search) nextParams.set("q", search);
    if (selectedStatus !== "all") nextParams.set("status", selectedStatus);
    nextParams.set("page", String(targetPage));
    return `/interno?${nextParams.toString()}`;
  };

  const summary =
    primaryRole === "admin"
      ? [
          {
            label: "Total de cadastros",
            value: formatCount(totalResult.count),
          },
          {
            label: "Aguardando análise",
            value: formatCount(submittedResult.count),
          },
          { label: "Em correção", value: formatCount(correctionsResult.count) },
          { label: "Aprovados", value: formatCount(approvedResult.count) },
          { label: "Rejeitados", value: formatCount(rejectedResult.count) },
          { label: "Tempo médio de análise", value: averageAnalysisLabel },
        ]
      : [
          {
            label:
              primaryRole === "validator"
                ? "Na fila de validação"
                : "Cadastros acessíveis",
            value: formatCount(creatorResult.count),
          },
        ];

  const headings: Record<string, { title: string; description: string }> = {
    admin: {
      title: "Visão geral",
      description: "Indicadores e cadastros da base Vyrex.",
    },
    validator: {
      title: "Fila de validação",
      description: "Cadastros encaminhados para análise manual.",
    },
    recruiter: {
      title: "Triagem de criadores",
      description: "Acompanhe os cadastros atribuídos à sua fila.",
    },
    relationship_manager: {
      title: "Relacionamento",
      description: "Acompanhe os criadores e pendências atribuídos a você.",
    },
  };
  const heading = headings[primaryRole];
  const hasQueryError =
    Boolean(creatorResult.error) ||
    (primaryRole === "admin" &&
      [
        totalResult,
        submittedResult,
        correctionsResult,
        approvedResult,
        rejectedResult,
      ].some((result) => result.error));

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>V</span>
          <span>VYREX</span>
        </Link>
        <div className={styles.sideGroup}>
          <span className={styles.sideLabel}>ESPAÇO INTERNO</span>
          <Link className={styles.sideLinkActive} href="/interno">
            Painel
          </Link>
          {roles.includes("admin") && (
            <Link className={styles.sideLink} href="/interno/equipe">
              Equipe interna
            </Link>
          )}
          {roles.includes("admin") && (
            <Link className={styles.sideLink} href="/interno/configuracoes">
              Critérios de elegibilidade
            </Link>
          )}
          {roles.includes("admin") && (
            <Link className={styles.sideLink} href="/interno/privacidade">
              Privacidade
            </Link>
          )}
          <Link className={styles.sideLink} href="/dashboard">
            Área do criador
          </Link>
        </div>
        <div className={styles.sideRoles}>
          {roles.map((role) => (
            <span key={role}>{roleLabels[role]}</span>
          ))}
        </div>
        <form action={logoutAction} className={styles.logoutForm}>
          <button type="submit">Sair</button>
        </form>
      </aside>

      <section className={styles.main}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>
              {roleLabels[primaryRole].toUpperCase()}
            </p>
            <h1>{heading.title}</h1>
            <p>{heading.description}</p>
          </div>
          <span className={styles.userLabel}>{user.email}</span>
        </header>

        <div className={styles.summary}>
          {summary.map((metric) => (
            <article className={styles.metric} key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>

        {primaryRole === "admin" && (
          <div className={styles.reports}>
            <section className={styles.report}>
              <h2>Por recrutador</h2>
              {recruiterReport.length === 0 ? (
                <p>Nenhuma atribuição ativa.</p>
              ) : (
                recruiterReport.map((item) => (
                  <div className={styles.reportRow} key={item.name}>
                    <span>{item.name}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))
              )}
            </section>
            <section className={styles.report}>
              <h2>Por relacionamento</h2>
              {managerReport.length === 0 ? (
                <p>Nenhuma atribuição ativa.</p>
              ) : (
                managerReport.map((item) => (
                  <div className={styles.reportRow} key={item.name}>
                    <span>{item.name}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))
              )}
            </section>
            <section className={styles.report}>
              <h2>Por rede social</h2>
              {socialCounts.size === 0 ? (
                <p>Nenhuma rede social cadastrada.</p>
              ) : (
                [...socialCounts].map(([platform, count]) => (
                  <div className={styles.reportRow} key={platform}>
                    <span>{platform}</span>
                    <strong>{count}</strong>
                  </div>
                ))
              )}
            </section>
          </div>
        )}

        <form className={styles.filters} method="get">
          <label>
            <span>Buscar criador</span>
            <input
              name="q"
              maxLength={80}
              defaultValue={search}
              placeholder="Nome público"
            />
          </label>
          <label>
            <span>Status</span>
            <select name="status" defaultValue={selectedStatus}>
              <option value="all">Todos os status</option>
              {statusOptions.map((status) => (
                <option value={status} key={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Aplicar filtros</button>
        </form>

        {hasQueryError && (
          <p className={styles.error} role="alert">
            Não foi possível carregar os dados. Confirme se as migrations foram
            aplicadas.
          </p>
        )}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Criador</th>
                <th>Status</th>
                <th>Atualizado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {creators.map((creator) => (
                <tr key={creator.user_id}>
                  <td>
                    <strong>
                      {creator.public_name || "Perfil sem nome público"}
                    </strong>
                    <small>{creator.user_id.slice(0, 8)}…</small>
                  </td>
                  <td>
                    <span className={styles.status}>
                      {statusLabels[
                        creator.status as keyof typeof statusLabels
                      ] ?? creator.status}
                    </span>
                  </td>
                  <td>
                    {new Date(creator.updated_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td>
                    <Link href={`/interno/${creator.user_id}`}>
                      Abrir cadastro
                    </Link>
                  </td>
                </tr>
              ))}
              {creators.length === 0 && !hasQueryError && (
                <tr>
                  <td colSpan={4} className={styles.empty}>
                    Nenhum cadastro visível com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className={styles.pagination}>
          <span>{formatCount(creatorResult.count)} cadastro(s)</span>
          <div>
            <Link
              aria-disabled={page <= 1}
              href={pageLink(Math.max(1, page - 1))}
            >
              Anterior
            </Link>
            <span>
              Página {page} de {totalPages}
            </span>
            <Link
              aria-disabled={page >= totalPages}
              href={pageLink(Math.min(totalPages, page + 1))}
            >
              Próxima
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
