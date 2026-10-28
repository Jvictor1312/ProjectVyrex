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
import { requireUserWithRoles } from "@/lib/auth";
import styles from "../internal-detail.module.css";

export const metadata: Metadata = { title: "Ficha do criador" };

const statusLabels: Record<string, string> = {
  incomplete: "Cadastro incompleto",
  submitted: "Aguardando análise",
  under_review: "Em análise",
  changes_requested: "Correção solicitada",
  approved: "Aprovado",
  rejected: "Rejeitado",
  suspended: "Suspenso",
};

const historyLabels: Record<string, string> = {
  submitted: "Cadastro encaminhado",
  forwarded: "Encaminhado para validação",
  evidence_approved: "Evidência aprovada",
  evidence_rejected: "Evidência rejeitada",
  evidence_changes_requested: "Correção de evidência solicitada",
  social_account_verified: "Rede social verificada",
  social_account_rejected: "Rede social rejeitada",
  approved: "Cadastro aprovado",
  rejected: "Cadastro rejeitado",
  changes_requested: "Correções solicitadas",
  suspended: "Cadastro suspenso",
  reinstated: "Cadastro reativado",
};

export default async function CreatorInternalDetail({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;
  const { supabase, roleKeys, rolesError } =
    await requireUserWithRoles();
  if (rolesError) notFound();

  const roles = new Set(roleKeys);
  const isAdmin = roles.has("admin");
  const canRecruit = isAdmin || roles.has("recruiter");
  const canRelate = isAdmin || roles.has("relationship_manager");
  const canValidate = isAdmin || roles.has("validator");
  if (!canRecruit && !canRelate && !canValidate) notFound();

  const [
    profileResult,
    accountsResult,
    evidenceResult,
    historyResult,
    messagesResult,
    contactsResult,
  ] = await Promise.all([
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
      .select("id, actor_id, action, outcome, reason, created_at")
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
  ]);

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
        .createSignedUrls(storagePaths, 60)
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
    const staffRoles = await supabase
      .from("roles")
      .select("id, key")
      .in("key", ["recruiter", "relationship_manager"]);
    const recruiterRoleId = staffRoles.data?.find(
      (role) => role.key === "recruiter",
    )?.id;
    const managerRoleId = staffRoles.data?.find(
      (role) => role.key === "relationship_manager",
    )?.id;
    const staffRoleIds = [recruiterRoleId, managerRoleId].filter(
      (id): id is number => id !== undefined,
    );
    const [staffLinks, recruiterAssignment, managerAssignment] =
      await Promise.all([
        staffRoleIds.length
          ? supabase
              .from("user_roles")
              .select("user_id, role_id")
              .is("revoked_at", null)
              .in("role_id", staffRoleIds)
          : Promise.resolve({ data: [], error: null }),
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
    const staffIds = [
      ...new Set((staffLinks.data ?? []).map((link) => link.user_id)),
    ];
    const staffProfiles = staffIds.length
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", staffIds)
      : { data: [], error: null };
    const namesById = new Map(
      (staffProfiles.data ?? []).map((person) => [person.id, person.full_name]),
    );
    const recruiterIds = new Set(
      (staffLinks.data ?? [])
        .filter((link) => link.role_id === recruiterRoleId)
        .map((link) => link.user_id),
    );
    const managerIds = new Set(
      (staffLinks.data ?? [])
        .filter((link) => link.role_id === managerRoleId)
        .map((link) => link.user_id),
    );

    assignmentProps = {
      recruiters: [...recruiterIds].map((id) => ({
        id,
        name: namesById.get(id) ?? id.slice(0, 8),
      })),
      managers: [...managerIds].map((id) => ({
        id,
        name: namesById.get(id) ?? id.slice(0, 8),
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
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="brand" href="/interno">
          <span className="brand-mark">V</span>
          <span>VYREX</span>
        </Link>
        <Link className="quiet-button" href="/interno">
          Voltar à fila
        </Link>
      </header>

      <div className={styles.page}>
        <section className={styles.heading}>
          <p className="eyebrow">
            <span /> FICHA DO CRIADOR
          </p>
          <h1>{creator.public_name || "Perfil sem nome público"}</h1>
          <p>
            {creator.city || "Cidade não informada"}
            {creator.region ? `, ${creator.region.trim()}` : ""}
          </p>
          <span className={styles.status}>
            {statusLabels[creator.status] ?? creator.status}
          </span>
        </section>

        <section className={styles.section}>
          <h2>Perfil</h2>
          <p>{creator.biography || "Sem descrição informada."}</p>
          <div className={styles.categories}>
            {creatorCategories.map((category) => (
              <span key={category}>{category}</span>
            ))}
          </div>
          {creator.decision_reason && (
            <p className="decision-reason">{creator.decision_reason}</p>
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
                      {account.platform} · @{account.handle}
                    </strong>
                    <span>
                      {account.followers_reported.toLocaleString("pt-BR")}{" "}
                      seguidores informados ·{" "}
                      {account.verification_status === "verified"
                        ? "verificada"
                        : account.verification_status === "rejected"
                          ? "rejeitada"
                          : "não verificada"}
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
                      <Image
                        src={imageUrl}
                        alt={`Evidência do Story ${item.position}`}
                        width={300}
                        height={400}
                        unoptimized
                      />
                    ) : (
                      <div className="evidence-empty">Prévia indisponível</div>
                    )}
                    <strong>
                      {item.review_status === "approved"
                        ? "Aprovada"
                        : item.review_status === "rejected"
                          ? "Rejeitada"
                          : item.review_status === "changes_requested"
                            ? "Correção solicitada"
                            : "Aguardando análise"}
                    </strong>
                    <span>
                      {new Date(
                        `${item.story_published_on}T12:00:00`,
                      ).toLocaleDateString("pt-BR")}{" "}
                      · {item.views_reported.toLocaleString("pt-BR")}{" "}
                      visualizações informadas
                    </span>
                    {item.creator_notes && <p>{item.creator_notes}</p>}
                    {item.review_reason && (
                      <p className="decision-reason">{item.review_reason}</p>
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

        {canRecruit && creator.status === "submitted" && (
          <RecruiterControls creatorId={creatorId} />
        )}
        {canRelate && <RelationshipControls creatorId={creatorId} />}
        {canDecideNow && (
          <section className={styles.section}>
            <h2>Decisão final</h2>
            <FinalDecisionForm creatorId={creatorId} />
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
                  <strong>{historyLabels[entry.action] ?? entry.action}</strong>
                  <span>
                    {new Date(entry.created_at).toLocaleString("pt-BR")} ·{" "}
                    {entry.actor_id.slice(0, 8)}…
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
    </main>
  );
}
