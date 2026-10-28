import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  InviteInternalUserForm,
  UserActiveForm,
  UserRoleForm,
} from "@/app/components/team-management";
import { InternalShell } from "../internal-shell";
import { auditActionLabel, auditDetailsSummary } from "@/lib/audit-labels";
import { requireUserFast } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import internalStyles from "../internal.module.css";
import styles from "../team-management.module.css";

export const metadata: Metadata = { title: "Equipe interna" };

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  recruiter: "Recrutador",
  relationship_manager: "Relacionamento",
  validator: "Validação",
};

export default async function InternalTeamPage() {
  const { supabase, user, activeCheck, ensureActive } = await requireUserFast();
  const adminClient = createSupabaseAdminClient();
  const [
    permission,
    activeResult,
    authUsersResult,
    profilesResult,
    rolesResult,
    assignmentsResult,
    auditResult,
  ] = await Promise.all([
    supabase.rpc("has_permission", {
      permission_name: "creators.manage_roles",
    }),
    activeCheck,
    adminClient
      ? adminClient.auth.admin.listUsers({ perPage: 1000 })
      : Promise.resolve(null),
    supabase
      .from("profiles")
      .select("id, full_name, is_active, deactivated_at")
      .order("full_name"),
    supabase.from("roles").select("id, key, label"),
    supabase
      .from("user_roles")
      .select("user_id, role_id")
      .is("revoked_at", null),
    supabase
      .from("audit_logs")
      .select(
        "id, actor_id, action, entity_type, entity_id, details, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  await ensureActive(activeResult);
  if (permission.error || !permission.data) redirect("/acesso-negado");

  const hasLoadError = Boolean(
    profilesResult.error || rolesResult.error || assignmentsResult.error,
  );
  const profiles = profilesResult.data ?? [];
  const roles = rolesResult.data ?? [];
  const roleById = new Map(roles.map((role) => [role.id, role.key]));
  const userRoles = new Map<string, string[]>();

  for (const assignment of assignmentsResult.data ?? []) {
    const role = roleById.get(assignment.role_id);
    if (!role || !(role in roleLabels)) continue;
    const currentRoles = userRoles.get(assignment.user_id) ?? [];
    currentRoles.push(role);
    userRoles.set(assignment.user_id, currentRoles);
  }

  const teamMembers = profiles.filter((profile) => userRoles.has(profile.id));
  const activeCount = teamMembers.filter((profile) => profile.is_active).length;
  const emailByUserId = new Map(
    (authUsersResult?.data.users ?? []).map((authUser) => [
      authUser.id,
      authUser.email ?? "",
    ]),
  );
  const teamAudit = auditResult.data ?? [];
  const nameById = new Map(
    profiles.map((profile) => [profile.id, profile.full_name]),
  );
  // Sem a chave de serviço válida, e-mails e convites ficam indisponíveis.
  const serviceKeyWorks = Boolean(adminClient) && !authUsersResult?.error;
  const inviteConfigured = serviceKeyWorks;

  return (
    <InternalShell active="equipe" isAdmin={true} email={user.email}>
      <section className={internalStyles.main}>
        <header className={internalStyles.pageHeader}>
          <div>
            <h1>Equipe interna</h1>
            <p>Convites, funções e estado das contas colaboradoras.</p>
          </div>
        </header>

        <div className={internalStyles.summary}>
          <article className={internalStyles.metric}>
            <span>Colaboradores</span>
            <strong>{teamMembers.length.toLocaleString("pt-BR")}</strong>
          </article>
          <article className={internalStyles.metric}>
            <span>Contas ativas</span>
            <strong>{activeCount.toLocaleString("pt-BR")}</strong>
          </article>
        </div>

        {hasLoadError && (
          <p className={internalStyles.error} role="alert">
            Não foi possível carregar a equipe. Confirme se as migrations foram
            aplicadas.
          </p>
        )}

        <section className={internalStyles.section}>
          <h2>Convidar colaborador</h2>
          <InviteInternalUserForm configured={inviteConfigured} />
        </section>

        <section className={internalStyles.section}>
          <h2>Contas e funções</h2>
          {!serviceKeyWorks && (
            <p className={styles.warning}>
              Para ver os e-mails e convidar pessoas, configure a chave de
              serviço do Supabase no servidor (SUPABASE_SERVICE_ROLE_KEY).
            </p>
          )}
          {!hasLoadError && teamMembers.length === 0 && (
            <p className={internalStyles.empty}>
              Nenhum colaborador interno cadastrado.
            </p>
          )}
          <div className={styles.userList}>
            {teamMembers.map((member) => (
              <article className={styles.userRow} key={member.id}>
                <div className={styles.userIdentity}>
                  <strong>{member.full_name}</strong>
                  {emailByUserId.get(member.id) && (
                    <span>{emailByUserId.get(member.id)}</span>
                  )}
                </div>
                <span
                  className={
                    member.is_active ? styles.activeLabel : styles.inactiveLabel
                  }
                >
                  {member.is_active ? "Ativa" : "Desativada"}
                </span>
                <div className={styles.roleList}>
                  {(userRoles.get(member.id) ?? []).map((role) => (
                    <span key={role}>{roleLabels[role]}</span>
                  ))}
                </div>
                <UserRoleForm userId={member.id} />
                <UserActiveForm userId={member.id} active={member.is_active} />
              </article>
            ))}
          </div>
        </section>

        <section className={internalStyles.section}>
          <h2>Auditoria recente</h2>
          {auditResult.error ? (
            <p className={internalStyles.error} role="alert">
              Não foi possível consultar os registros de auditoria.
            </p>
          ) : teamAudit.length === 0 ? (
            <p className={internalStyles.empty}>
              Nenhuma ação administrativa registrada ainda.
            </p>
          ) : (
            <div className={styles.auditList}>
              {teamAudit.map((entry) => (
                <article className={styles.auditRow} key={entry.id}>
                  <strong>{auditActionLabel(entry.action)}</strong>
                  {auditDetailsSummary(entry.details) && (
                    <span>{auditDetailsSummary(entry.details)}</span>
                  )}
                  <small>
                    {(entry.actor_id && nameById.get(entry.actor_id)) ||
                      "Sistema"}{" "}
                    · {new Date(entry.created_at).toLocaleString("pt-BR")}
                  </small>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </InternalShell>
  );
}
