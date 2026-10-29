import Link from "next/link";
import {
  CreatorWizard,
  CreatorProfileForm,
  SocialAccountForm,
  SubmitApplicationButton,
  WithdrawApplicationButton,
} from "@/app/components/creator-forms";
import {
  EvidenceBoard,
  type EvidenceSlot,
} from "@/app/components/evidence-board";
import {
  accountVerificationLabels,
  creatorStatusLabel,
  platformLabels,
} from "@/lib/labels";

// "Meu cadastro": a mesma apresentação na tela real (/dashboard/perfil) e na
// prévia sem login (/preview/criador/cadastro). Os dados chegam prontos.
export type CreatorProfileViewProps = {
  lede: string;
  hasLoadError: boolean;
  canEdit: boolean;
  // Por que a edição está bloqueada (quando canEdit é falso).
  lockedMessage: string;
  status: string | null;
  decisionReason: string | null;
  profile: {
    publicName: string;
    city: string;
    region: string;
    biography: string;
    categories: string[];
  };
  accounts: {
    id: string;
    platform: string;
    handle: string;
    profile_url: string;
    followers_reported: number;
    verification_status: string;
  }[];
  evidenceSlots: EvidenceSlot[];
  evidenceCount: number;
  evidenceComplete: boolean;
  requiredEvidence: number;
  minimumViews: number;
  maxStoryAgeDays: number | null;
  reviewIssues: string[];
};

export function CreatorProfileView({
  lede,
  hasLoadError,
  canEdit,
  lockedMessage,
  status,
  decisionReason,
  profile,
  accounts,
  evidenceSlots,
  evidenceCount,
  evidenceComplete,
  requiredEvidence,
  minimumViews,
  maxStoryAgeDays,
  reviewIssues,
}: CreatorProfileViewProps) {
  return (
    <section className="profile-content">
      <h1>Meu cadastro</h1>
      <p className="profile-lede">{lede}</p>
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
            complete: Boolean(profile.publicName.trim()),
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
            complete: evidenceComplete,
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
            <CreatorProfileForm initial={profile} />
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
                    {accountVerificationLabels[account.verification_status] ??
                      "Não verificada"}
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
          {canEdit && (
            <SocialAccountForm startCollapsed={accounts.length > 0} />
          )}
        </section>

        <section className="profile-section" id="evidencias" data-wizard-step="2">
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
            slots={evidenceSlots}
            socialAccounts={accounts}
            minimumViews={minimumViews}
            maxStoryAgeDays={maxStoryAgeDays}
            canEdit={canEdit}
            canDelete={status === "incomplete"}
            requiredCount={requiredEvidence}
          />
        </section>

        <section className="profile-section" id="revisao" data-wizard-step="3">
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
                {profile.publicName || "Nome público não informado"}
                {profile.city ? ` · ${profile.city}` : ""}
                {profile.region ? `, ${profile.region}` : ""}
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
                {evidenceCount} enviadas ({requiredEvidence} obrigatórias);
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
                {status ? creatorStatusLabel(status) : "Indisponível no momento"}
              </dd>
            </div>
          </dl>
          {reviewIssues.length > 0 ? (
            <div className="review-issues" role="status">
              <strong>Pendências antes do envio</strong>
              <ul>
                {reviewIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="review-ready">
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
                A equipe confere sua rede social e seus Stories e responde pela
                sua conta. Enquanto a análise não começar, você pode desfazer o
                envio; depois, só será possível editar se a equipe pedir
                correções. Enviar não garante aprovação.
              </p>
            </div>
          </div>
          {decisionReason && <p className="decision-reason">{decisionReason}</p>}
          {canEdit ? (
            <SubmitApplicationButton />
          ) : (
            <p className="field-hint">
              Cadastro já enviado. Acompanhe pela{" "}
              <Link href="/dashboard">visão geral</Link>.
              {status === "submitted" &&
                " Enquanto a equipe não começar a análise, você ainda pode desfazer o envio."}
            </p>
          )}
          {status === "submitted" && <WithdrawApplicationButton />}
        </section>
      </CreatorWizard>
    </section>
  );
}
