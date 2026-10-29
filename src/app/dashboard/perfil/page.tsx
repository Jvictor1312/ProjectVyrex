import type { Metadata } from "next";
import Link from "next/link";
import {
  CreatorWizard,
  CreatorProfileForm,
  SocialAccountForm,
  SubmitApplicationButton,
  WithdrawApplicationButton,
} from "@/app/components/creator-forms";
import { EvidenceBoard } from "@/app/components/evidence-board";
import { requireUserFast } from "@/lib/auth";
import {
  creatorStatusLabel,
  defaultRequiredEvidence,
  evidenceStatusLabels,
  platformLabels,
} from "@/lib/labels";
import { CreatorShell } from "../creator-shell";

export const metadata: Metadata = { title: "Meu cadastro" };

// Para o criador, "pendente" significa que a evidência foi enviada e espera
// a conferência da equipe.
const evidenceStatus: Record<string, string> = {
  ...evidenceStatusLabels,
  pending: "Enviada",
};

export default async function CreatorProfilePage() {
  const { supabase, user, activeCheck, ensureActive } = await requireUserFast();
  const [
    profileResult,
    accountsResult,
    evidenceResult,
    settingsResult,
    activeResult,
  ] = await Promise.all([
    supabase
      .from("creator_profiles")
      .select(
        "public_name, city, region, biography, categories, status, decision_reason",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("social_accounts")
      .select(
        "id, platform, handle, profile_url, followers_reported, followers_reported_at, verification_status",
      )
      .eq("creator_id", user.id)
      .order("created_at"),
    supabase
      .from("metric_evidence")
      .select(
        "id, position, content_type, story_published_on, views_reported, review_status, review_reason, storage_path",
      )
      .eq("creator_id", user.id)
      .order("position"),
    supabase
      .from("eligibility_settings")
      .select(
        "minimum_followers, minimum_story_views, max_story_age_days, required_story_evidence",
      )
      .eq("singleton", true)
      .maybeSingle(),
    activeCheck,
  ]);
  await ensureActive(activeResult);

  const profile = profileResult.data;
  const accounts = accountsResult.data ?? [];
  const evidence = evidenceResult.data ?? [];
  const settings = settingsResult.data;
  const evidenceSlots = new Map(evidence.map((item) => [item.position, item]));
  const signedUrls = evidence.length
    ? await supabase.storage.from("story-evidence").createSignedUrls(
        evidence.map((item) => item.storage_path),
        600,
      )
    : { data: [] };
  const urlByPath = new Map(
    (signedUrls.data ?? []).map((item) => [item.path, item.signedUrl]),
  );
  const hasLoadError =
    profileResult.error ||
    accountsResult.error ||
    evidenceResult.error ||
    settingsResult.error;
  const minimumViews = settings?.minimum_story_views ?? 1000;
  const maxStoryAgeDays = settings ? settings.max_story_age_days : 7;
  const requiredEvidence =
    settings?.required_story_evidence ?? defaultRequiredEvidence;
  const canEdit =
    Boolean(profile) &&
    ["incomplete", "changes_requested"].includes(profile?.status ?? "");
  // Por que a edição está bloqueada e o que a pessoa pode fazer.
  const lockedMessages: Record<string, string> = {
    submitted:
      "Seu cadastro foi enviado e aguarda a equipe. Enquanto a análise não começar, você pode desfazer o envio na visão geral e voltar a editar.",
    under_review:
      "Seu cadastro está em análise. Se a equipe pedir alguma correção, a edição é liberada de novo.",
    approved:
      "Seu cadastro foi aprovado. Para alterar algum dado, fale com a equipe pela página Mensagens.",
    rejected:
      "Seu cadastro não foi aprovado e não pode ser editado. Veja a resposta da equipe na página Mensagens.",
    suspended:
      "Seu cadastro está suspenso. Veja a orientação da equipe na página Mensagens.",
  };
  const lockedMessage =
    lockedMessages[profile?.status ?? ""] ??
    "Seu cadastro não pode ser editado agora. Veja a situação na visão geral.";
  const reviewIssues: string[] = [];
  if (!settings) {
    reviewIssues.push(
      "Não foi possível carregar os critérios atuais. Atualize a página.",
    );
  }
  if (!profile?.public_name.trim()) {
    reviewIssues.push("Informe seu nome público.");
  }
  const earliestStoryDate =
    maxStoryAgeDays === null
      ? null
      : new Date(Date.now() - maxStoryAgeDays * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
  for (const position of [1, 2, 3, 4, 5]) {
    const item = evidenceSlots.get(position);
    if (!item) {
      if (position <= requiredEvidence) {
        reviewIssues.push(`Envie a evidência ${position}.`);
      }
    } else {
      if (item.views_reported < minimumViews) {
        reviewIssues.push(
          `A evidência ${position} precisa informar pelo menos ${minimumViews.toLocaleString("pt-BR")} visualizações.`,
        );
      }
      if (earliestStoryDate && item.story_published_on < earliestStoryDate) {
        reviewIssues.push(
          `A evidência ${position} está fora do limite de ${maxStoryAgeDays} dias.`,
        );
      }
    }
  }

  return (
    <CreatorShell>
      <section className="profile-content">
        <h1>Meu cadastro</h1>
        <p className="profile-lede">
          {canEdit
            ? "Tudo é salvo enquanto você preenche."
            : `Situação: ${creatorStatusLabel(profile?.status ?? "")}. A edição está bloqueada nesta etapa.`}
        </p>
        {hasLoadError && (
          <div className="setup-warning" role="alert">
            Não foi possível carregar seus dados. Recarregue a página.
          </div>
        )}

        <CreatorWizard
          steps={[
            {
              title: "Perfil",
              panelId: "perfil",
              complete: Boolean(profile?.public_name.trim()),
              help: "Como você quer ser apresentado.",
            },
            {
              title: "Redes sociais",
              panelId: "redes",
              complete: accounts.length > 0,
              help: "Seu perfil público e quantos seguidores você tem.",
            },
            {
              title: "Evidências",
              panelId: "evidencias",
              complete:
                [...Array(requiredEvidence)].every((_, index) =>
                  evidenceSlots.has(index + 1),
                ) &&
                evidence.every(
                  (item) =>
                    item.views_reported >= minimumViews &&
                    (!earliestStoryDate ||
                      item.story_published_on >= earliestStoryDate),
                ),
              help: `Os Stories mais recentes, do mais novo (1) ao mais antigo. Os ${requiredEvidence} primeiros são obrigatórios.`,
            },
            {
              title: "Revisão e envio",
              panelId: "revisao",
              complete: reviewIssues.length === 0,
              help: "Confira tudo e envie para a equipe.",
            },
          ]}
        >
          <section className="profile-section" id="perfil" data-wizard-step="0">
            <div className="section-heading">
              <span className="principle-number">01</span>
              <div>
                <h2>Seu perfil</h2>
                <p>Informações essenciais para apresentar seu trabalho.</p>
              </div>
            </div>
            {canEdit ? (
              <CreatorProfileForm
                initial={{
                  publicName: profile?.public_name ?? "",
                  city: profile?.city ?? "",
                  region: profile?.region?.trim() ?? "",
                  biography: profile?.biography ?? "",
                  categories: profile?.categories ?? [],
                }}
              />
            ) : (
              <p className="field-hint">{lockedMessage}</p>
            )}
          </section>

          <section className="profile-section" id="redes" data-wizard-step="1">
            <div className="section-heading">
              <span className="principle-number">02</span>
              <div>
                <h2>Redes sociais</h2>
                <p>
                  Seguidores são informados por você e conferidos pela equipe.
                </p>
              </div>
            </div>
            {accounts.length > 0 && (
              <div className="account-list">
                {accounts.map((account) => (
                  <article className="account-row" key={account.id}>
                    <div>
                      <strong>
                        {platformLabels[account.platform] ?? "Outra rede"} · @
                        {account.handle}
                      </strong>
                      <span>
                        {account.followers_reported.toLocaleString("pt-BR")}{" "}
                        seguidores informados
                      </span>
                    </div>
                    <span
                      className={`account-verification verification-${account.verification_status}`}
                    >
                      {account.verification_status === "verified"
                        ? "Verificada"
                        : account.verification_status === "rejected"
                          ? "Precisa de ajuste"
                          : "Não verificada"}
                    </span>
                    {canEdit && (
                      <details className="account-edit">
                        <summary>Editar dados da rede</summary>
                        <SocialAccountForm
                          initialAccount={{
                            id: account.id,
                            platform: account.platform,
                            handle: account.handle,
                            profileUrl: account.profile_url,
                            followersReported: account.followers_reported,
                          }}
                        />
                      </details>
                    )}
                  </article>
                ))}
              </div>
            )}
            {canEdit && <SocialAccountForm startCollapsed={accounts.length > 0} />}
          </section>

          <section
            className="profile-section"
            id="evidencias"
            data-wizard-step="2"
          >
            <div className="section-heading">
              <span className="principle-number">03</span>
              <div>
                <h2>Evidências</h2>
                <p>
                  Envie 3 prints de Stories (os quadros 1, 2 e 3, marcados com
                  *); o 4 e o 5 são opcionais. Cada Story precisa ter
                  {maxStoryAgeDays === null ? "" : ` até ${maxStoryAgeDays} dias e`} pelo menos{" "}
                  {minimumViews.toLocaleString("pt-BR")} visualizações visíveis no
                  print. Aceitamos JPEG, PNG ou WebP de até 8 MB. Dá para
                  escolher vários prints de uma vez e salvar tudo junto.
                </p>
              </div>
            </div>
            <EvidenceBoard
              slots={[1, 2, 3, 4, 5].map((position) => {
                const item = evidenceSlots.get(position);
                return {
                  position,
                  uploaded: Boolean(item),
                  imageUrl:
                    (item && urlByPath.get(item.storage_path)) || undefined,
                  statusLabel: item
                    ? (evidenceStatus[item.review_status] ?? "Em análise")
                    : "Pendente",
                  meta: item
                    ? `${item.views_reported.toLocaleString("pt-BR")} visualizações`
                    : undefined,
                  reason: item?.review_reason,
                  needsAttention:
                    item?.review_status === "rejected" ||
                    item?.review_status === "changes_requested",
                };
              })}
              socialAccounts={accounts}
              minimumViews={minimumViews}
              maxStoryAgeDays={maxStoryAgeDays}
              canEdit={canEdit}
              canDelete={profile?.status === "incomplete"}
              requiredCount={requiredEvidence}
            />
          </section>

          <section
            className="profile-section"
            id="revisao"
            data-wizard-step="3"
          >
            <div className="section-heading">
              <span className="principle-number">04</span>
              <div>
                <h2>Revise seu cadastro</h2>
                <p>Confira os dados que serão encaminhados para análise.</p>
              </div>
            </div>
            <dl className="application-review">
              <div>
                <dt>Perfil</dt>
                <dd>
                  {profile?.public_name || "Nome público não informado"}
                  {profile?.city ? ` · ${profile.city}` : ""}
                  {profile?.region ? `, ${profile.region.trim()}` : ""}
                </dd>
              </div>
              <div>
                <dt>Redes sociais</dt>
                <dd>
                  {accounts.length === 0
                    ? "Nenhuma rede cadastrada"
                    : accounts
                        .map(
                          (account) =>
                            `@${account.handle} · ${account.followers_reported.toLocaleString("pt-BR")} seguidores`,
                        )
                        .join("; ")}
                </dd>
              </div>
              <div>
                <dt>Evidências</dt>
                <dd>
                  {evidence.length} enviadas ({requiredEvidence} obrigatórias);
                  mínimo de {minimumViews.toLocaleString("pt-BR")} visualizações
                  {maxStoryAgeDays === null
                    ? ""
                    : ` e até ${maxStoryAgeDays} dias de idade`}
                  .
                </dd>
              </div>
              <div>
                <dt>Situação do cadastro</dt>
                <dd>
                  {profile?.status
                    ? creatorStatusLabel(profile.status)
                    : "Indisponível no momento"}
                </dd>
              </div>
            </dl>
            {reviewIssues.length > 0 ? (
              <div className="setup-warning" role="status">
                <strong>Pendências antes do envio</strong>
                <ul>
                  {reviewIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="field-hint">
                Nenhuma pendência: o cadastro pode ser enviado para análise.
              </p>
            )}
          </section>

          <section
            className="profile-section submission-section"
            id="envio"
            data-wizard-step="3"
          >
            <div className="section-heading">
              <span className="principle-number">05</span>
              <div>
                <h2>Enviar para análise</h2>
                <p>
                  A equipe confere sua rede social e seus Stories e responde
                  pela sua conta. Enquanto a análise não começar, você pode
                  desfazer o envio; depois, só será possível editar se a
                  equipe pedir correções. Enviar não garante aprovação.
                </p>
              </div>
            </div>
            {profile?.decision_reason && (
              <p className="decision-reason">{profile.decision_reason}</p>
            )}
            {canEdit ? (
              <SubmitApplicationButton />
            ) : (
              <p className="field-hint">
                Cadastro já enviado. Acompanhe pela{" "}
                <Link href="/dashboard">visão geral</Link>.
                {profile?.status === "submitted" &&
                  " Enquanto a equipe não começar a análise, você ainda pode desfazer o envio."}
              </p>
            )}
            {profile?.status === "submitted" && <WithdrawApplicationButton />}
          </section>
        </CreatorWizard>
      </section>
    </CreatorShell>
  );
}
