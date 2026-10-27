import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CreatorNav } from "@/app/components/creator-nav";
import {
  CreatorWizard,
  CreatorProfileForm,
  EvidenceUploadForm,
  SocialAccountForm,
  SubmitApplicationButton,
} from "@/app/components/creator-forms";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Completar perfil" };

const evidenceStatus: Record<string, string> = {
  pending: "Aguardando validação",
  approved: "Validada",
  rejected: "Rejeitada",
  changes_requested: "Correção solicitada",
};

export default async function CreatorProfilePage() {
  const { supabase, user } = await requireUser();
  const [profileResult, accountsResult, evidenceResult, settingsResult] =
    await Promise.all([
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
        .select("minimum_followers, minimum_story_views, max_story_age_days")
        .eq("singleton", true)
        .maybeSingle(),
    ]);

  const profile = profileResult.data;
  const accounts = accountsResult.data ?? [];
  const evidence = evidenceResult.data ?? [];
  const settings = settingsResult.data;
  const evidenceSlots = new Map(evidence.map((item) => [item.position, item]));
  const signedUrls = evidence.length
    ? await supabase.storage.from("story-evidence").createSignedUrls(
        evidence.map((item) => item.storage_path),
        60,
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
  const canEdit =
    Boolean(profile) &&
    ["incomplete", "changes_requested"].includes(profile?.status ?? "");
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
      reviewIssues.push(`Envie a evidência ${position}.`);
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
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">V</span>
          <span>VYREX</span>
        </Link>
        <Link className="quiet-button" href="/dashboard">
          Voltar ao painel
        </Link>
      </header>
      <CreatorNav />
      <section className="profile-content">
        <p className="eyebrow">
          <span /> CADASTRO DO CRIADOR
        </p>
        <h1>Seu perfil, no seu ritmo.</h1>
        <p className="profile-lede">
          Salve etapas incompletas e volte depois. Só encaminharemos seu perfil
          quando você enviar as informações para análise manual.
        </p>
        {hasLoadError && (
          <div className="setup-warning" role="alert">
            Não foi possível carregar os dados. Confirme as variáveis do
            Supabase e aplique as migrations documentadas no README.
          </div>
        )}

        <CreatorWizard
          steps={[
            {
              title: "Perfil",
              panelId: "perfil",
              complete: Boolean(profile?.public_name.trim()),
              help: "Informe como você quer ser apresentado. O rascunho é salvo automaticamente no servidor depois de uma pequena pausa.",
            },
            {
              title: "Redes sociais",
              panelId: "redes",
              complete: accounts.length > 0,
              help: "Informe seu perfil público e os seguidores declarados. Não existe mínimo eliminatório; a audiência será avaliada com nicho, localização e compatibilidade com cada campanha.",
            },
            {
              title: "Evidências",
              panelId: "evidencias",
              complete:
                evidence.length === 5 &&
                evidence.every(
                  (item) =>
                    item.views_reported >= minimumViews &&
                    (!earliestStoryDate ||
                      item.story_published_on >= earliestStoryDate),
                ),
              help: `Envie os cinco Stories mais recentes, do mais novo (posição 1) ao mais antigo (posição 5). Cada imagem só conta como enviada depois da confirmação; a captura não comprova as métricas automaticamente.`,
            },
            {
              title: "Revisão e envio",
              panelId: "revisao",
              complete: reviewIssues.length === 0,
              help: "Confira os dados e as pendências antes de enviar. A equipe fará a análise manual. Aprovação significa elegibilidade, não garantia de campanha, contratação ou pagamento.",
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
              <p className="field-hint">
                Seu cadastro está em uma etapa que não permite edição. Consulte
                o status e as mensagens da equipe no painel.
              </p>
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
                        {account.platform === "instagram"
                          ? "Instagram"
                          : account.platform === "tiktok"
                            ? "TikTok"
                            : account.platform === "youtube"
                              ? "YouTube"
                              : "Outra rede"}{" "}
                        · @{account.handle}
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
            {canEdit && <SocialAccountForm />}
          </section>

          <section
            className="profile-section"
            id="evidencias"
            data-wizard-step="2"
          >
            <div className="section-heading">
              <span className="principle-number">03</span>
              <div>
                <h2>As cinco evidências</h2>
                <p>
                  Envie os Stories mais recentes. Cada um precisa informar pelo
                  menos{" "}
                  {(settings?.minimum_story_views ?? 1000).toLocaleString(
                    "pt-BR",
                  )}{" "}
                  visualizações.
                </p>
              </div>
            </div>
            <div className="evidence-grid">
              {[1, 2, 3, 4, 5].map((position) => {
                const item = evidenceSlots.get(position);
                const imageUrl = item
                  ? urlByPath.get(item.storage_path)
                  : undefined;
                return (
                  <article className="evidence-item" key={position}>
                    <span className="evidence-index">0{position}</span>
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={`Evidência do Story ${position}`}
                        width={300}
                        height={400}
                        unoptimized
                      />
                    ) : (
                      <div className="evidence-empty">
                        {item ? "Prévia indisponível" : "Sem evidência"}
                      </div>
                    )}
                    <strong>
                      {item
                        ? (evidenceStatus[item.review_status] ?? "Em análise")
                        : "Pendente"}
                    </strong>
                    {item && (
                      <span>
                        {new Date(
                          `${item.story_published_on}T12:00:00`,
                        ).toLocaleDateString("pt-BR")}{" "}
                        · {item.views_reported.toLocaleString("pt-BR")}{" "}
                        visualizações
                      </span>
                    )}
                    {item?.review_reason && (
                      <p className="evidence-reason">{item.review_reason}</p>
                    )}
                  </article>
                );
              })}
            </div>
            {canEdit ? (
              <EvidenceUploadForm
                socialAccounts={accounts}
                existingPositions={evidence.map((item) => item.position)}
                minimumViews={minimumViews}
                maxStoryAgeDays={maxStoryAgeDays}
              />
            ) : (
              <p className="field-hint">
                O envio de evidências está bloqueado enquanto este cadastro não
                estiver em rascunho ou correção.
              </p>
            )}
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
                  {evidence.length} de 5 enviadas; mínimo de{" "}
                  {minimumViews.toLocaleString("pt-BR")} visualizações
                  {maxStoryAgeDays === null
                    ? ""
                    : ` e até ${maxStoryAgeDays} dias de idade`}
                  .
                </dd>
              </div>
              <div>
                <dt>Estado do cadastro</dt>
                <dd>
                  {profile?.status === "changes_requested"
                    ? "Correções solicitadas"
                    : profile?.status === "incomplete"
                      ? "Rascunho incompleto"
                      : (profile?.status ?? "Indisponível")}
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
                Os requisitos informados parecem completos. O servidor fará a
                validação final antes de encaminhar.
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
                  O sistema confere os requisitos mínimos; a equipe decide
                  manualmente.
                </p>
              </div>
            </div>
            {profile?.decision_reason && (
              <p className="decision-reason">{profile.decision_reason}</p>
            )}
            <p className="field-hint">
              O envio não confirma a autenticidade das imagens nem garante
              aprovação. Um cadastro aprovado integra a base de elegíveis e não
              representa contratação, campanha ou pagamento.
            </p>
            {canEdit ? (
              <SubmitApplicationButton />
            ) : (
              <p className="field-hint">
                Este cadastro já foi encaminhado ou teve uma decisão. Para
                acompanhar, consulte o painel e as mensagens da equipe.
              </p>
            )}
          </section>
        </CreatorWizard>
      </section>
    </main>
  );
}
