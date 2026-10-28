import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  InviteInternalUserForm,
  UserActiveForm,
  UserRoleForm,
} from "@/app/components/team-management";
import { InternalShell } from "../internal-shell";
import { requireUser } from "@/lib/auth";
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
  const { supabase, user } = await requireUser();
  const { data: allowed, error: permissionError } = await supabase.rpc(
    "has_permission",
    { permission_name: "creators.manage_roles" },
  );
  if (permissionError || !allowed) redirect("/acesso-negado");

  const [profilesResult, rolesResult, assignmentsResult, auditResult] =
    await Promise.all([
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
  const adminClient = createSupabaseAdminClient();
  const authUsersResult = adminClient
    ? await adminClient.auth.admin.listUsers({ perPage: 1000 })
    : null;
  const emailByUserId = new Map(
    (authUsersResult?.data.users ?? []).map((authUser) => [
      authUser.id,
      authUser.email ?? "",
    ]),
  );
  const teamAudit = auditResult.data ?? [];
  const inviteConfigured = Boolean(adminClient);

  return (
    <InternalShell active="equipe" isAdmin={true} email={user.email}>

      <section className={internalStyles.main}>
        <header className={internalStyles.pageHeader}>
          <div>
            <p className={internalStyles.eyebrow}>ADMINISTRAÇÃO</p>
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
          {!adminClient && (
            <p className={styles.warning}>
              SUPABASE_SERVICE_ROLE_KEY ausente: os e-mails não podem ser
              consultados pelo servidor e os convites ficam desabilitados.
            </p>
          )}
          {authUsersResult?.error && (
            <p className={styles.warning}>
              Não foi possível consultar os e-mails no Auth Admin. Revise a
              chave de serviço configurada no servidor.
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
                  <span>
                    {emailByUserId.get(member.id) || "E-mail indisponível"}
                  </span>
                  <small>{member.id.slice(0, 8)}…</small>
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
                  <strong>{entry.action}</strong>
                  <span>
                    {entry.entity_type}
                    {entry.entity_id ? ` · ${entry.entity_id}` : ""}
                  </span>
                  <small>
                    {entry.actor_id
                      ? `${entry.actor_id.slice(0, 8)}…`
                      : "Sistema"}{" "}
                    · {new Date(entry.created_at).toLocaleString("pt-BR")}
                  </small>
                  <code>{JSON.stringify(entry.details)}</code>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </InternalShell>
  );
}
