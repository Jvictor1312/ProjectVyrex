import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { InfoHelp } from "@/app/components/info-help";
import { EligibilitySettingsForm } from "@/app/components/team-management";
import { requireUser } from "@/lib/auth";
import internalStyles from "../internal.module.css";
import styles from "../team-management.module.css";

export const metadata: Metadata = { title: "Critérios de elegibilidade" };

export default async function EligibilitySettingsPage() {
  const { supabase, user } = await requireUser();
  const { data: allowed, error: permissionError } = await supabase.rpc(
    "has_permission",
    { permission_name: "creators.configure_eligibility" },
  );
  if (permissionError || !allowed) redirect("/acesso-negado");

  const [settingsResult, auditResult] = await Promise.all([
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
  ]);

  const history = auditResult.data ?? [];

  return (
    <main className={internalStyles.shell}>
      <aside className={internalStyles.sidebar}>
        <Link className={internalStyles.brand} href="/">
          <span className={internalStyles.brandMark}>V</span>
          <span>VYREX</span>
        </Link>
        <div className={internalStyles.sideGroup}>
          <span className={internalStyles.sideLabel}>ESPAÇO INTERNO</span>
          <Link className={internalStyles.sideLink} href="/interno">
            Painel
          </Link>
          <Link className={internalStyles.sideLink} href="/interno/equipe">
            Equipe
          </Link>
          <Link
            className={internalStyles.sideLinkActive}
            href="/interno/configuracoes"
          >
            Critérios
          </Link>
          <Link className={internalStyles.sideLink} href="/interno/privacidade">
            Privacidade
          </Link>
        </div>
        <form action={logoutAction} className={internalStyles.logoutForm}>
          <button type="submit">Sair</button>
        </form>
      </aside>

      <section className={internalStyles.main}>
        <header className={internalStyles.pageHeader}>
          <div>
            <p className={internalStyles.eyebrow}>ADMINISTRAÇÃO</p>
            <h1>Critérios de elegibilidade</h1>
            <p>
              Alterações passam por validação server-side e geram auditoria.
            </p>
          </div>
          <span className={internalStyles.userLabel}>{user.email}</span>
        </header>

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
                  <strong>{entry.actor_id?.slice(0, 8) ?? "Sistema"}</strong>
                  <span>
                    {new Date(entry.created_at).toLocaleString("pt-BR")}
                  </span>
                  <code>{JSON.stringify(entry.details)}</code>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
