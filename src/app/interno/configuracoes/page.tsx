import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PresentationVideoForm } from "@/app/components/presentation-video-form";
import { EligibilitySettingsForm } from "@/app/components/team-management";
import { InternalShell } from "../internal-shell";
import { auditDetailsSummary } from "@/lib/audit-labels";
import { fetchActiveRoleKeys, requireUserFast } from "@/lib/auth";
import { isInternalRole, roleLabels } from "@/lib/labels";
import { getPresentationVideoUrl } from "@/lib/site-media";
import styles from "../internal.module.css";
import teamStyles from "../team.module.css";
import { AuditHistory } from "../team-sections";
import { Notice, PageHeader, Panel } from "../ui";

export const metadata: Metadata = { title: "Configurações" };

export default async function EligibilitySettingsPage() {
  const { supabase, user, activeCheck, ensureActive } = await requireUserFast();
  const [permission, activeResult, settingsResult, auditResult, videoUrl, roleResult] =
    await Promise.all([
      supabase.rpc("has_permission", {
        permission_name: "creators.configure_eligibility",
      }),
      activeCheck,
      supabase
        .from("eligibility_settings")
        .select(
          "minimum_followers, required_story_evidence, minimum_story_views, max_story_age_days, updated_at",
        )
        .eq("singleton", true)
        .maybeSingle(),
      supabase
        .from("audit_logs")
        .select("id, actor_id, details, created_at")
        .eq("action", "eligibility.settings.changed")
        .order("created_at", { ascending: false })
        .limit(60),
      getPresentationVideoUrl(),
      fetchActiveRoleKeys(supabase, user.id),
    ]);
  await ensureActive(activeResult);
  if (permission.error || !permission.data) redirect("/acesso-negado");

  const history = auditResult.data ?? [];
  // Nomes de quem alterou os critérios, para o histórico.
  const actorIds = [...new Set(history.map((entry) => entry.actor_id).filter(Boolean))] as string[];
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] };
  const actorNames = new Map((actors ?? []).map((actor) => [actor.id, actor.full_name]));
  const settings = settingsResult.data;

  return (
    <InternalShell
      active="criterios"
      isAdmin={true}
      roles={roleResult.keys.filter(isInternalRole).map((key) => roleLabels[key])}
      email={user.email}
      name={user.name}>
      <section className={styles.main}>
        <PageHeader
          title="Configurações"
          description="Critérios que um cadastro de criador precisa cumprir e o vídeo de apresentação exibido no cadastro."
        />

        {settingsResult.error || !settings ? (
          <Notice tone="danger" role="alert">
            Não foi possível carregar os critérios de elegibilidade. Atualize a
            página; se o erro continuar, verifique a conexão com o banco de dados.
          </Notice>
        ) : (
          <Panel
            title="Critérios de elegibilidade"
            description={`Valem para os próximos envios. Última alteração em ${new Date(settings.updated_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}.`}
          >
            <p className={teamStyles.hint}>
              Hoje cada criador envia {settings.required_story_evidence}{" "}
              {settings.required_story_evidence === 1 ? "Story obrigatório" : "Stories obrigatórios"}, cada um com
              pelo menos {settings.minimum_story_views.toLocaleString("pt-BR")} visualizações.
              Não existe corte por número de seguidores: a referência só ajuda a
              priorizar conforme a campanha, sem excluir quem está começando. Toda
              evidência continua passando por conferência manual.
            </p>
            <EligibilitySettingsForm
              minimumFollowers={settings.minimum_followers}
              requiredEvidence={settings.required_story_evidence}
              minimumViews={settings.minimum_story_views}
              maxStoryAgeDays={settings.max_story_age_days}
            />
          </Panel>
        )}

        <Panel
          title="Vídeo de apresentação"
          description="Aparece na tela de cadastro quando a pessoa clica na esfera Vyrex."
        >
          <PresentationVideoForm currentUrl={videoUrl} />
        </Panel>

        <AuditHistory
          title="Histórico de alterações dos critérios"
          loadError={Boolean(auditResult.error)}
          emptyText="Cada vez que os critérios forem salvos, a mudança aparece aqui."
          entries={history.map((entry) => ({
            id: String(entry.id),
            action: "Critérios alterados",
            details: auditDetailsSummary(entry.details),
            actor: (entry.actor_id && actorNames.get(entry.actor_id)) || "Sistema",
            target: "eligibility_settings",
            targetName: "Critérios de elegibilidade",
            createdAt: entry.created_at,
          }))}
        />
      </section>
    </InternalShell>
  );
}
