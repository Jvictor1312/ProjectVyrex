import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TeamDirectory, type TeamMember } from "@/app/components/team-directory";
import { InternalShell } from "../internal-shell";
import { AuditTable, RoleLegend } from "../team-sections";
import { auditActionLabel, auditDetailsSummary } from "@/lib/audit-labels";
import { requireUserFast } from "@/lib/auth";
import {
  internalRoleKeys,
  isInternalRole,
  roleLabels,
  type InternalRole,
} from "@/lib/labels";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import styles from "../internal.module.css";

export const metadata: Metadata = { title: "Gestão de colaboradores" };

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
      .select("id, full_name, is_active, deactivated_at, deactivation_reason, created_at")
      .order("full_name"),
    supabase.from("roles").select("id, key"),
    supabase
      .from("user_roles")
      .select("user_id, role_id")
      .is("revoked_at", null),
    supabase
      .from("audit_logs")
      .select("id, actor_id, action, details, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  await ensureActive(activeResult);
  if (permission.error || !permission.data) redirect("/acesso-negado");

  const loadError = Boolean(
    profilesResult.error || rolesResult.error || assignmentsResult.error,
  );
  const profiles = profilesResult.data ?? [];
  const roleKeyById = new Map((rolesResult.data ?? []).map((role) => [role.id, role.key]));
  const rolesByUser = new Map<string, InternalRole[]>();
  for (const assignment of assignmentsResult.data ?? []) {
    const key = roleKeyById.get(assignment.role_id);
    if (!key || !isInternalRole(key)) continue;
    rolesByUser.set(assignment.user_id, [...(rolesByUser.get(assignment.user_id) ?? []), key]);
  }

  // Sem a chave de serviço válida, e-mails, último acesso e convites ficam
  // indisponíveis (a tela avisa e não inventa valores).
  const serviceKeyWorks = Boolean(adminClient) && !authUsersResult?.error;
  const authById = new Map(
    (authUsersResult?.data?.users ?? []).map((authUser) => [authUser.id, authUser]),
  );

  const members: TeamMember[] = profiles
    .filter((profile) => rolesByUser.has(profile.id))
    .map((profile) => ({
      id: profile.id,
      name: profile.full_name,
      email: authById.get(profile.id)?.email ?? null,
      roles: internalRoleKeys.filter((key) => rolesByUser.get(profile.id)?.includes(key)),
      active: profile.is_active,
      createdAt: profile.created_at,
      deactivatedAt: profile.deactivated_at,
      deactivationReason: profile.deactivation_reason,
      lastSignInAt: authById.get(profile.id)?.last_sign_in_at ?? null,
      isCurrentUser: profile.id === user.id,
    }));

  const roleCounts = Object.fromEntries(
    internalRoleKeys.map((key) => [
      key,
      members.filter((member) => member.roles.includes(key)).length,
    ]),
  ) as Record<InternalRole, number>;

  const nameById = new Map(profiles.map((profile) => [profile.id, profile.full_name]));
  const auditEntries = (auditResult.data ?? []).map((entry) => ({
    id: entry.id,
    action: auditActionLabel(entry.action),
    details: auditDetailsSummary(entry.details),
    actor: (entry.actor_id && nameById.get(entry.actor_id)) || "Sistema",
    createdAt: entry.created_at,
  }));

  const currentRoles = rolesByUser.get(user.id) ?? [];

  return (
    <InternalShell
      active="equipe"
      isAdmin={true}
      roles={currentRoles.map((key) => roleLabels[key])}
      email={user.email}
      name={user.name}
    >
      <section className={styles.main}>
        <TeamDirectory
          members={members}
          inviteConfigured={serviceKeyWorks}
          emailsAvailable={serviceKeyWorks}
          loadError={loadError}
        />
        <RoleLegend counts={roleCounts} />
        <AuditTable entries={auditEntries} loadError={Boolean(auditResult.error)} />
      </section>
    </InternalShell>
  );
}
