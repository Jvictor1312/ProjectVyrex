import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InfoHelp } from "@/app/components/info-help";
import { PresentationVideoForm } from "@/app/components/presentation-video-form";
import { EligibilitySettingsForm } from "@/app/components/team-management";
import { InternalShell } from "../internal-shell";
import { auditDetailsSummary } from "@/lib/audit-labels";
import { requireUserFast } from "@/lib/auth";
import { getPresentationVideoUrl } from "@/lib/site-media";
import internalStyles from "../internal.module.css";
import styles from "../team-management.module.css";

export const metadata: Metadata = { title: "Configurações" };

export default async function EligibilitySettingsPage() {
  const { supabase, user, activeCheck, ensureActive } = await requireUserFast();
  const [permission, activeResult, settingsResult, auditResult, videoUrl] =
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
        .limit(20),
      getPresentationVideoUrl(),
    ]);
  await ensureActive(activeResult);
  if (permission.error || !permission.data) redirect("/acesso-negado");

  const history = auditResult.data ?? [];

  return (
    <InternalShell active="criterios" isAdmin={true} email={user.email}>
      <section className={internalStyles.main}>
        <header className={internalStyles.pageHeader}>
          <div>
            <h1>Configurações</h1>
            <p>Vídeo de apresentação e critérios de elegibilidade.</p>
          </div>
        </header>

        <section className={internalStyles.section}>
          <h2>Vídeo de apresentação</h2>
          <p className={internalStyles.empty}>
            Aparece na tela de cadastro, ao clicar na esfera Vyrex.
          </p>
          <PresentationVideoForm currentUrl={videoUrl} />
        </section>

        {settingsResult.error || !settingsResult.data ? (
          <p className={internalStyles.error} role="alert">
            Não foi possível carregar os critérios. Confirme se a migration foi
            aplicada.
          </p>
        ) : (
          <section className={internalStyles.section}>
            <div className="section-heading">
              <div>
                <h2>Requisitos atuais</h2>
                <p className={internalStyles.empty}>
                  Os valores afetam novos envios; alterações ficam registradas
                  na auditoria.
                </p>
              </div>
              <InfoHelp title="Como os critérios funcionam">
                Não existe corte mínimo de seguidores. Use a referência apenas
                para orientar a prioridade de acordo com cada campanha; não
                exclua quem está começando. As cinco evidências devem ter ao
                menos 1.000 views cada e continuam sujeitas à conferência
                manual.
              </InfoHelp>
            </div>
            <p className={internalStyles.empty}>
              Atualizados em{" "}
              {new Date(settingsResult.data.updated_at).toLocaleString("pt-BR")}
              .
            </p>
            <EligibilitySettingsForm
              minimumFollowers={settingsResult.data.minimum_followers}
              requiredEvidence={settingsResult.data.required_story_evidence}
              minimumViews={settingsResult.data.minimum_story_views}
              maxStoryAgeDays={settingsResult.data.max_story_age_days}
            />
          </section>
        )}

        <section className={internalStyles.section}>
          <h2>Histórico de alterações</h2>
          {auditResult.error ? (
            <p className={internalStyles.error} role="alert">
              Não foi possível carregar a auditoria.
            </p>
          ) : history.length === 0 ? (
            <p className={internalStyles.empty}>
              Nenhuma alteração registrada.
            </p>
          ) : (
            <div className={styles.auditList}>
              {history.map((entry) => (
                <article className={styles.auditRow} key={entry.id}>
                  <strong>
                    {auditDetailsSummary(entry.details) ??
                      "Critérios alterados"}
                  </strong>
                  <span>
                    {new Date(entry.created_at).toLocaleString("pt-BR")}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </InternalShell>
  );
}
