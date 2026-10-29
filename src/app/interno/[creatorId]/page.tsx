import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AssignmentForm,
  EvidenceReviewForm,
  FinalDecisionForm,
  RecruiterControls,
  RelationshipControls,
  SocialAccountReviewForm,
} from "@/app/components/internal-actions";
import { InternalShell } from "../internal-shell";
import { fetchActiveRoleKeys, requireUserFast } from "@/lib/auth";
import {
  historyEntryLabel,
  historyEvidenceSelect,
  historyStoryPosition,
} from "@/lib/history";
import {
  accountVerificationLabels,
  accountVerificationTones,
  categoryLabel,
  creatorStatusLabel,
  creatorStatusTone,
  evidenceStatusLabels,
  evidenceStatusTones,
  platformLabels,
  roleLabels,
} from "@/lib/labels";
import { Badge, Notice } from "../ui";
import styles from "../internal-detail.module.css";

export const metadata: Metadata = { title: "Ficha do criador" };

const historyLabels: Record<string, string> = {
  submitted: "Cadastro enviado pelo criador",
  withdrawn: "Envio desfeito pelo criador",
  forwarded: "Encaminhado para validação",
  evidence_approved: "Evidência aprovada",
  evidence_rejected: "Evidência recusada",
  evidence_changes_requested: "Correção de evidência solicitada",
  social_account_verified: "Rede social verificada",
  social_account_rejected: "Rede social precisa de ajuste",
  approved: "Cadastro aprovado",
  rejected: "Cadastro não aprovado",
  changes_requested: "Correções solicitadas",
  suspended: "Cadastro suspenso",
  reinstated: "Cadastro reativado",
};

const roleNames: Record<string, string> = roleLabels;

function actorName(
  actor: { full_name: string | null } | { full_name: string | null }[] | null,
) {
  const person = Array.isArray(actor) ? actor[0] : actor;
  return person?.full_name || "Equipe";
}

export default async function CreatorInternalDetail({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;
  const { supabase, user, activeCheck, ensureActive } =
    await requireUserFast();

  // Uma rodada só até o banco: funções, conta ativa, dados do cadastro e
  // equipe são buscados juntos. Os dados já são protegidos pelas regras do
  // banco; a checagem de função abaixo decide o que a tela mostra.
  const [
    rolesResult,
    activeResult,
    profileResult,
    accountsResult,
    evidenceResult,
    historyResult,
    messagesResult,
    contactsResult,
    staffResult,
    recruiterAssignment,
    managerAssignment,
  ] = await Promise.all([
    fetchActiveRoleKeys(supabase, user.id),
    activeCheck,
    supabase
      .from("creator_profiles")
      .select(
        "user_id, public_name, city, region, biography, categories, status, submitted_at, decided_at, decision_reason",
      )
      .eq("user_id", creatorId)
      .maybeSingle(),
    supabase
      .from("social_accounts")
      .select(
        "id, platform, handle, profile_url, followers_reported, verification_status, verified_by, verified_at",
      )
      .eq("creator_id", creatorId)
      .order("created_at"),
    supabase
      .from("metric_evidence")
      .select(
        "id, position, storage_path, story_published_on, views_reported, creator_notes, review_status, review_reason, reviewed_by, reviewed_at",
      )
      .eq("creator_id", creatorId)
      .order("position"),
    supabase
      .from("review_history")
      .select(
        `id, actor_id, action, outcome, reason, created_at, actor:profiles!review_history_actor_id_fkey(full_name), ${historyEvidenceSelect}`,
      )
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("team_messages")
      .select("id, sender_id, body, visible_to_creator, created_at")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("contact_history")
      .select("id, actor_id, channel, summary, visible_to_creator, created_at")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("user_roles")
      .select(
        "user_id, roles!inner(key), person:profiles!user_roles_user_id_fkey(full_name)",
      )
      .is("revoked_at", null)
      .in("roles.key", ["recruiter", "relationship_manager"]),
    supabase
      .from("recruiter_assignments")
      .select("recruiter_id")
      .eq("creator_id", creatorId)
      .is("ended_at", null)
      .maybeSingle(),
    supabase
      .from("relationship_assignments")
      .select("manager_id")
      .eq("creator_id", creatorId)
      .is("ended_at", null)
      .maybeSingle(),
  ]);
  await ensureActive(activeResult);
  if (rolesResult.error) notFound();

  const roles = new Set(rolesResult.keys);
  const isAdmin = roles.has("admin");
  const canRecruit = isAdmin || roles.has("recruiter");
  const canRelate = isAdmin || roles.has("relationship_manager");
  const canValidate = isAdmin || roles.has("validator");
  if (!canRecruit && !canRelate && !canValidate) notFound();

  const creator = profileResult.data;
  if (profileResult.error || !creator) notFound();
  const creatorCategories = Array.isArray(creator.categories)
    ? creator.categories.filter(
        (category: unknown): category is string => typeof category === "string",
      )
    : [];

  const canReviewNow =
    canValidate && ["submitted", "under_review"].includes(creator.status);
  const canDecideNow =
    canValidate &&
    ["submitted", "under_review", "changes_requested"].includes(creator.status);

  const accounts = accountsResult.data ?? [];
  const evidence = evidenceResult.data ?? [];
  const storagePaths = evidence.map((item) => item.storage_path);
  const signedUrls = storagePaths.length
    ? await supabase.storage
        .from("story-evidence")
        .createSignedUrls(storagePaths, 600)
    : { data: [] };
  const imageUrlByPath = new Map(
    (signedUrls.data ?? []).map((item) => [item.path, item.signedUrl]),
  );

  let assignmentProps: {
    recruiters: { id: string; name: string }[];
    managers: { id: string; name: string }[];
    currentRecruiter: string;
    currentManager: string;
  } | null = null;

  if (isAdmin) {
    type StaffRow = {
      user_id: string;
      roles: { key: string } | { key: string }[];
      person: { full_name: string | null } | { full_name: string | null }[] | null;
    };
    const staff = (staffResult.data ?? []) as StaffRow[];
    const first = <T,>(value: T | T[] | null) =>
      Array.isArray(value) ? value[0] : value;
    const namesById = new Map(
      staff.map((row) => [row.user_id, first(row.person)?.full_name ?? null]),
    );
    const idsFor = (key: string) =>
      new Set(
        staff
          .filter((row) => first(row.roles)?.key === key)
          .map((row) => row.user_id),
      );
    const recruiterIds = idsFor("recruiter");
    const managerIds = idsFor("relationship_manager");

    assignmentProps = {
      recruiters: [...recruiterIds].map((id) => ({
        id,
        name: namesById.get(id) ?? "Sem nome",
      })),
      managers: [...managerIds].map((id) => ({
        id,
        name: namesById.get(id) ?? "Sem nome",
      })),
      currentRecruiter: recruiterAssignment.data?.recruiter_id ?? "",
      currentManager: managerAssignment.data?.manager_id ?? "",
    };
  }

  const history = historyResult.data ?? [];
  const messages = messagesResult.data ?? [];
  const contacts = contactsResult.data ?? [];
  const hasHistoryError = Boolean(
    historyResult.error || messagesResult.error || contactsResult.error,
  );

  return (
    <InternalShell
      active="painel"
      isAdmin={isAdmin}
      roles={[...roles]
        .filter((role) => role !== "influencer")
        .map((role) => roleNames[role] ?? role)}
      email={user.email}
      name={user.name}
    >
      <div className={styles.page}>
        <Link className={styles.back} href="/interno">
          ← Voltar aos cadastros
        </Link>
        <section className={styles.heading}>
          <h1>{creator.public_name || "Perfil sem nome público"}</h1>
          <p>
            {creator.city || "Cidade não informada"}
            {creator.region ? `, ${creator.region.trim()}` : ""}
          </p>
          <Badge tone={creatorStatusTone(creator.status)}>
            {creatorStatusLabel(creator.status)}
          </Badge>
        </section>

        <section className={styles.section}>
          <h2>Perfil</h2>
          <p>{creator.biography || "Sem descrição informada."}</p>
          <div className={styles.categories}>
            {creatorCategories.map((category) => (
              <span key={category}>{categoryLabel(category)}</span>
            ))}
          </div>
          {creator.decision_reason && (
            // O tom acompanha a decisão: aprovação não aparece como erro.
            <Notice tone={creatorStatusTone(creator.status)}>
              <strong>Justificativa da decisão:</strong> {creator.decision_reason}
            </Notice>
          )}
        </section>

        <section className={styles.section}>
          <h2>Redes sociais</h2>
          {accounts.length === 0 ? (
            <p>Nenhuma rede social informada.</p>
          ) : (
            accounts.map((account) => {
              let publicProfileUrl: string | null = null;
              try {
                const parsedUrl = new URL(account.profile_url);
                if (parsedUrl.protocol === "https:")
                  publicProfileUrl = parsedUrl.toString();
              } catch {
                publicProfileUrl = null;
              }
              return (
                <article className={styles.account} key={account.id}>
                  <div>
                    <strong>
                      {platformLabels[account.platform] ?? account.platform} · @
                      {account.handle}
                    </strong>
                    <span>
                      {account.followers_reported.toLocaleString("pt-BR")}{" "}
                      seguidores informados
                    </span>
                    <span>
                      <Badge
                        tone={accountVerificationTones[account.verification_status] ?? "neutral"}
                      >
                        {accountVerificationLabels[account.verification_status] ??
                          account.verification_status}
                      </Badge>
                    </span>
                    {publicProfileUrl && (
                      <a
                        href={publicProfileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir perfil público
                      </a>
                    )}
                  </div>
                  {canReviewNow && (
                    <SocialAccountReviewForm accountId={account.id} />
                  )}
                </article>
              );
            })
          )}
        </section>

        <section className={styles.section}>
          <h2>Evidências dos Stories</h2>
          {evidence.length === 0 ? (
            <p>Nenhuma evidência enviada.</p>
          ) : (
            <div className={styles.evidenceGrid}>
              {evidence.map((item) => {
                const imageUrl = imageUrlByPath.get(item.storage_path);
                return (
                  <article className={styles.evidenceCard} key={item.id}>
                    <span className="evidence-index">
                      Story {item.position}
                    </span>
                    {imageUrl ? (
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir em tamanho real"
                      >
                        <Image
                          src={imageUrl}
                          alt={`Evidência do Story ${item.position}`}
                          width={270}
                          height={480}
                          unoptimized
                        />
                      </a>
                    ) : (
                      <div className="evidence-empty">Prévia indisponível</div>
                    )}
                    <span>
                      <Badge tone={evidenceStatusTones[item.review_status] ?? "neutral"}>
                        {evidenceStatusLabels[item.review_status] ?? item.review_status}
                      </Badge>
                    </span>
                    <span>
                      {new Date(
                        `${item.story_published_on}T12:00:00`,
                      ).toLocaleDateString("pt-BR")}{" "}
                      · {item.views_reported.toLocaleString("pt-BR")}{" "}
                      visualizações informadas
                    </span>
                    {item.creator_notes && <p>{item.creator_notes}</p>}
                    {item.review_reason && (
                      <Notice tone={evidenceStatusTones[item.review_status] ?? "neutral"}>
                        {item.review_reason}
                      </Notice>
                    )}
                    {canReviewNow && (
                      <EvidenceReviewForm evidenceId={item.id} />
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {canRecruit && (
          <RecruiterControls
            creatorId={creatorId}
            canForward={creator.status === "submitted"}
          />
        )}
        {canRelate && <RelationshipControls creatorId={creatorId} />}
        {canValidate && (
          <section className={styles.section}>
            <h2>Decisão final</h2>
            <FinalDecisionForm creatorId={creatorId} open={canDecideNow} />
          </section>
        )}
        {assignmentProps && (
          <section className={styles.section}>
            <h2>Responsáveis</h2>
            <AssignmentForm creatorId={creatorId} {...assignmentProps} />
          </section>
        )}

        <section className={styles.section}>
          <h2>Histórico de análise</h2>
          {hasHistoryError && (
            <p role="alert">Parte do histórico não pôde ser carregada.</p>
          )}
          {history.length === 0 ? (
            <p>Nenhuma análise registrada ainda.</p>
          ) : (
            <ol className={styles.history}>
              {history.map((entry) => (
                <li key={entry.id}>
                  <strong>
                    {historyEntryLabel(
                      historyLabels[entry.action] ?? entry.action,
                      historyStoryPosition(entry.evidence),
                    )}
                  </strong>
                  <span>
                    {new Date(entry.created_at).toLocaleString("pt-BR")} ·{" "}
                    {actorName(entry.actor)}
                  </span>
                  {entry.reason && <p>{entry.reason}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={styles.section}>
          <h2>Comunicação e contatos</h2>
          {messages.length === 0 && contacts.length === 0 ? (
            <p>Nenhuma comunicação registrada.</p>
          ) : (
            <div className={styles.communications}>
              {messages.map((message) => (
                <article key={message.id}>
                  <strong>Mensagem da equipe</strong>
                  <span>
                    {new Date(message.created_at).toLocaleString("pt-BR")}
                  </span>
                  <p>{message.body}</p>
                </article>
              ))}
              {contacts.map((contact) => (
                <article key={contact.id}>
                  <strong>Contato · {contact.channel}</strong>
                  <span>
                    {new Date(contact.created_at).toLocaleString("pt-BR")}
                  </span>
                  <p>{contact.summary}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </InternalShell>
  );
}
