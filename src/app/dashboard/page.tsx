import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { CreatorNav } from "@/app/components/creator-nav";
import { requireUser } from "@/lib/auth";
import styles from "./dashboard.module.css";

const statusLabels: Record<string, string> = {
  incomplete: "Cadastro incompleto",
  submitted: "Aguardando análise",
  under_review: "Em análise",
  changes_requested: "Correção solicitada",
  approved: "Aprovado",
  rejected: "Rejeitado",
  suspended: "Cadastro suspenso",
};

const statusDescriptions: Record<string, string> = {
  incomplete:
    "Complete seu perfil, informe uma rede social e envie as evidências para solicitar a análise.",
  submitted: "Seu cadastro foi encaminhado e aguarda a triagem da equipe.",
  under_review:
    "A equipe está conferindo manualmente suas informações e evidências.",
  changes_requested:
    "A equipe pediu ajustes. Consulte o motivo e atualize seu cadastro.",
  approved:
    "Seu perfil atende aos critérios atuais e pode integrar a base de elegíveis. Isso não garante campanha, contratação ou pagamento.",
  rejected:
    "A equipe concluiu a análise. Consulte o motivo registrado no seu cadastro.",
  suspended:
    "O acesso ao cadastro está suspenso. Consulte a mensagem da equipe para orientações.",
};

const historyLabels: Record<string, string> = {
  submitted: "Cadastro enviado",
  forwarded: "Encaminhado para validação",
  approved: "Cadastro aprovado",
  rejected: "Cadastro rejeitado",
  changes_requested: "Correção solicitada",
  suspended: "Cadastro suspenso",
  reinstated: "Cadastro reativado",
};

type NextStep = { title: string; text: string; href: string; cta: string };

function nextStepFor(
  status: string,
  accountCount: number,
  evidenceCount: number,
  requiredEvidence: number,
  hasEvidenceIssues: boolean,
): NextStep {
  switch (status) {
    case "changes_requested":
      return {
        title: "Corrija as pendências",
        text: "A equipe pediu ajustes. Atualize as informações ou evidências indicadas e envie novamente.",
        href: "/dashboard/perfil",
        cta: "Corrigir cadastro",
      };
    case "submitted":
    case "under_review":
      return {
        title: "Acompanhe sua análise",
        text: "Seu cadastro está com a equipe. Você será avisado por mensagens e notificações nesta plataforma.",
        href: "/dashboard/mensagens",
        cta: "Ver mensagens",
      };
    case "approved":
      return {
        title: "Mantenha seus dados atualizados",
        text: "Seu perfil integra a base de elegíveis. Isso não garante campanha, contratação ou pagamento.",
        href: "/dashboard/perfil",
        cta: "Ver meu cadastro",
      };
    case "rejected":
    case "suspended":
      return {
        title: "Consulte a resposta da equipe",
        text: "Veja o motivo registrado e as mensagens enviadas pela equipe.",
        href: "/dashboard/mensagens",
        cta: "Ver mensagens",
      };
    default:
      if (accountCount === 0) {
        return {
          title: "Adicione sua rede social",
          text: "Informe seu perfil e a quantidade de seguidores. A equipe confere esses números manualmente.",
          href: "/dashboard/perfil#redes",
          cta: "Adicionar rede",
        };
      }
      if (evidenceCount < requiredEvidence || hasEvidenceIssues) {
        return {
          title: "Envie as evidências dos Stories",
          text: `Você enviou ${evidenceCount} de ${requiredEvidence} evidências.`,
          href: "/dashboard/perfil#evidencias",
          cta: "Enviar evidências",
        };
      }
      return {
        title: "Envie para análise",
        text: "Tudo pronto. Revise seus dados e encaminhe o cadastro para a análise manual.",
        href: "/dashboard/perfil#envio",
        cta: "Revisar e enviar",
      };
  }
}

export default async function CreatorDashboardPage() {
  const { supabase, user } = await requireUser();
  const [
    profileResult,
    messageResult,
    notificationResult,
    historyResult,
    accountsResult,
    evidenceResult,
    settingsResult,
  ] = await Promise.all([
      supabase
        .from("creator_profiles")
        .select("status, public_name, decision_reason")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("team_messages")
        .select("id, body, created_at")
        .eq("creator_id", user.id)
        .eq("visible_to_creator", true)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("notifications")
        .select("id, title, body, created_at, read_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("review_history")
        .select("id, action, reason, created_at")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("social_accounts")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", user.id),
      supabase
        .from("metric_evidence")
        .select("position, review_status, review_reason")
        .eq("creator_id", user.id)
        .order("position"),
      supabase
        .from("eligibility_settings")
        .select("required_story_evidence")
        .eq("singleton", true)
        .maybeSingle(),
    ]);

  const creatorProfile = profileResult.data;
  const messages = messageResult.data ?? [];
  const notifications = notificationResult.data ?? [];
  const history = historyResult.data ?? [];
  const accountCount = accountsResult.count ?? 0;
  const evidence = evidenceResult.data ?? [];
  const requiredEvidence = settingsResult.data?.required_story_evidence ?? 5;
  const evidenceIssues = evidence.filter(
    (item) =>
      item.review_status === "rejected" ||
      item.review_status === "changes_requested",
  );
  const hasLoadError = Boolean(
    accountsResult.error ||
    evidenceResult.error ||
    settingsResult.error ||
    profileResult.error ||
    messageResult.error ||
    notificationResult.error ||
    historyResult.error ||
    !creatorProfile,
  );

  const status = creatorProfile?.status ?? "incomplete";
  const nextStep = nextStepFor(
    status,
    accountCount,
    evidence.length,
    requiredEvidence,
    evidenceIssues.length > 0,
  );
  const progressItems = [
    { label: "Perfil de criador", done: Boolean(creatorProfile?.public_name) },
    { label: "Rede social informada", done: accountCount > 0 },
    {
      label: `Evidências enviadas (${evidence.length}/${requiredEvidence})`,
      done: evidence.length >= requiredEvidence,
    },
  ];

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="brand" href="/">
          <span className="brand-mark">V</span>
          <span>VYREX</span>
        </Link>
        <form action={logoutAction}>
          <button className="quiet-button" type="submit">
            Sair
          </button>
        </form>
      </header>
      <CreatorNav />
      <section className="dashboard-content">
        <p className="eyebrow">
          <span /> ÁREA DO CRIADOR
        </p>
        <h1>
          Olá
          {creatorProfile?.public_name ? `, ${creatorProfile.public_name}` : ""}
          .
        </h1>
        <p className="dashboard-email">{user.email}</p>
        {hasLoadError && (
          <p className="setup-warning" role="alert">
            Não foi possível carregar o cadastro. Confirme se as migrations do
            banco foram aplicadas.
          </p>
        )}
        <div className="status-panel">
          <div>
            <span className="status-kicker">STATUS DO CADASTRO</span>
            <h2>{statusLabels[status] ?? "Status em atualização"}</h2>
          </div>
          <span className={`status-dot status-${status}`} aria-hidden="true" />
        </div>
        <p className={styles.statusDescription}>
          {statusDescriptions[status] ??
            "O status do cadastro está em atualização."}
        </p>
        {creatorProfile?.decision_reason && (
          <p className="decision-reason">{creatorProfile.decision_reason}</p>
        )}
        {(status === "incomplete" || status === "changes_requested") && (
          <ul className={styles.progressList} aria-label="Progresso do cadastro">
            {progressItems.map((item) => (
              <li key={item.label}>
                <span aria-hidden="true">{item.done ? "✓" : "○"}</span>
                {item.label}
                <span className={styles.srOnly}>
                  {item.done ? " (concluído)" : " (pendente)"}
                </span>
              </li>
            ))}
          </ul>
        )}
        {evidenceIssues.length > 0 && (
          <section className={styles.pendingBox} aria-label="Pendências">
            <h2>Pendências nas evidências</h2>
            <ul>
              {evidenceIssues.map((item) => (
                <li key={item.position}>
                  <strong>Story {item.position}:</strong>{" "}
                  {item.review_status === "rejected"
                    ? "rejeitada"
                    : "correção solicitada"}
                  {item.review_reason ? ` — ${item.review_reason}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="dashboard-next">
          <span className="principle-number">PRÓXIMO PASSO</span>
          <h2>{nextStep.title}</h2>
          <p>{nextStep.text}</p>
          <Link className="button button-dark" href={nextStep.href}>
            {nextStep.cta} <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className={styles.activityGrid}>
          <section className={styles.activitySection}>
            <div className={styles.activityHeading}>
              <h2>Mensagens da equipe</h2>
              <Link href="/dashboard/mensagens">Ver todas</Link>
            </div>
            {messages.length === 0 ? (
              <p className={styles.empty}>
                As mensagens compartilhadas aparecerão aqui.
              </p>
            ) : (
              messages.map((message) => (
                <article className={styles.activityItem} key={message.id}>
                  <p>{message.body}</p>
                  <time dateTime={message.created_at}>
                    {new Date(message.created_at).toLocaleString("pt-BR")}
                  </time>
                </article>
              ))
            )}
          </section>
          <section className={styles.activitySection}>
            <div className={styles.activityHeading}>
              <h2>Notificações</h2>
              <Link href="/dashboard/notificacoes">Ver todas</Link>
            </div>
            {notifications.length === 0 ? (
              <p className={styles.empty}>Você não tem notificações.</p>
            ) : (
              notifications.map((notification) => (
                <article className={styles.activityItem} key={notification.id}>
                  <strong>{notification.title}</strong>
                  <p>{notification.body}</p>
                  <time dateTime={notification.created_at}>
                    {new Date(notification.created_at).toLocaleString("pt-BR")}
                  </time>
                </article>
              ))
            )}
          </section>
        </div>
        <section className={styles.historySection}>
          <h2>Histórico do cadastro</h2>
          {history.length === 0 ? (
            <p className={styles.empty}>
              As atualizações relevantes aparecerão aqui.
            </p>
          ) : (
            <ol>
              {history.map((entry) => (
                <li key={entry.id}>
                  <strong>
                    {historyLabels[entry.action] ?? "Atualização do cadastro"}
                  </strong>
                  <time dateTime={entry.created_at}>
                    {new Date(entry.created_at).toLocaleString("pt-BR")}
                  </time>
                  {entry.reason && <p>{entry.reason}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>
        <p className="dashboard-disclaimer">
          A aprovação torna seu perfil elegível para oportunidades futuras. Não
          representa promessa de campanha, contratação ou pagamento.
        </p>
      </section>
    </main>
  );
}
