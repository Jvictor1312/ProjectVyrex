import Link from "next/link";
import { WithdrawApplicationButton } from "@/app/components/creator-forms";
import {
  creatorStatusLabel,
  creatorStatusTone,
  evidenceStatusLabels,
} from "@/lib/labels";
import styles from "./creator-overview.module.css";

// Cada etapa da análise com um nome que o criador entende (antes, as
// conferências de evidência e de rede apareciam como "Atualização do cadastro").
const historyLabels: Record<string, string> = {
  submitted: "Cadastro enviado",
  withdrawn: "Envio desfeito por você",
  forwarded: "Encaminhado para validação",
  review_started: "Análise iniciada",
  evidence_approved: "Evidência aprovada",
  evidence_rejected: "Evidência recusada",
  evidence_changes_requested: "Correção pedida em uma evidência",
  social_account_verified: "Rede social conferida",
  social_account_rejected: "Rede social precisa de ajuste",
  approved: "Cadastro aprovado",
  rejected: "Cadastro não aprovado",
  changes_requested: "Correção solicitada",
  suspended: "Cadastro suspenso",
  reinstated: "Cadastro reativado",
};

type NextStep = { title: string; text?: string; href: string; cta: string };

export function nextStepFor(
  status: string,
  hasPublicName: boolean,
  accountCount: number,
  evidenceCount: number,
  requiredEvidence: number,
  hasEvidenceIssues: boolean,
): NextStep {
  switch (status) {
    case "changes_requested":
      return {
        title: "Corrija as pendências",
        text: "Atualize o que a equipe pediu e envie de novo.",
        href: "/dashboard/perfil",
        cta: "Corrigir cadastro",
      };
    case "submitted":
    case "under_review":
      return {
        title: "Seu cadastro está em análise",
        text: "A equipe está conferindo seus dados e evidências. Você recebe um aviso aqui quando houver novidade.",
        href: "/dashboard/mensagens",
        cta: "Ver mensagens",
      };
    case "approved":
      return {
        title: "Seu perfil foi aprovado",
        text: "Você já faz parte da rede Vyrex. A equipe entra em contato por aqui quando surgir uma campanha compatível com o seu perfil.",
        href: "/dashboard/mensagens",
        cta: "Ver mensagens",
      };
    case "rejected":
    case "suspended":
      return {
        title: "Veja a resposta da equipe",
        text: "A equipe explicou o motivo na página Mensagens.",
        href: "/dashboard/mensagens",
        cta: "Ver mensagens",
      };
    default:
      if (!hasPublicName) {
        return {
          title: "Complete seu perfil",
          text: "Diga como quer ser apresentado às marcas.",
          href: "/dashboard/perfil#perfil",
          cta: "Completar perfil",
        };
      }
      if (accountCount === 0) {
        return {
          title: "Adicione sua rede social",
          text: "Informe a rede em que você publica e quantos seguidores tem.",
          href: "/dashboard/perfil#redes",
          cta: "Adicionar rede",
        };
      }
      if (evidenceCount < requiredEvidence || hasEvidenceIssues) {
        return {
          title: "Envie as evidências dos Stories",
          text: `${evidenceCount} de ${requiredEvidence} obrigatórias enviadas. Envie prints recentes que mostrem as visualizações.`,
          href: "/dashboard/perfil#evidencias",
          cta: "Enviar evidências",
        };
      }
      return {
        title: "Envie para análise",
        text: "Perfil, rede social e evidências estão completos. Revise e envie.",
        href: "/dashboard/perfil#envio",
        cta: "Revisar e enviar",
      };
  }
}

export type CreatorOverviewProps = {
  name: string | null;
  status: string;
  decisionReason: string | null;
  steps: { label: string; done: boolean }[];
  evidenceIssues: {
    position: number;
    review_status: string;
    review_reason: string | null;
  }[];
  nextStep: NextStep;
  messages: { id: string; body: string; created_at: string }[];
  notifications: {
    id: string;
    title: string;
    body: string;
    created_at: string;
  }[];
  history: {
    id: string;
    action: string;
    reason: string | null;
    created_at: string;
  }[];
  hasLoadError: boolean;
};

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function CreatorOverview({
  name,
  status,
  decisionReason,
  steps,
  evidenceIssues,
  nextStep,
  messages,
  notifications,
  history,
  hasLoadError,
}: CreatorOverviewProps) {
  const tone = creatorStatusTone(status);
  const showSteps = status === "incomplete" || status === "changes_requested";

  return (
    <section className={styles.page}>
      <h1 className={styles.greeting}>Olá{name ? `, ${name}` : ""}.</h1>

      {hasLoadError && (
        <p className="setup-warning" role="alert">
          Não foi possível carregar seu cadastro. Recarregue a página.
        </p>
      )}

      <section className={styles.card} aria-labelledby="next-step-title">
        <span className={`${styles.badge} ${styles[tone]}`}>
          {creatorStatusLabel(status)}
        </span>
        <h2 id="next-step-title">{nextStep.title}</h2>
        {nextStep.text && <p className={styles.cardText}>{nextStep.text}</p>}
        {decisionReason && <p className={styles.reason}>{decisionReason}</p>}

        {evidenceIssues.length > 0 && (
          <ul className={styles.issues} aria-label="Pendências nas evidências">
            {evidenceIssues.map((item) => (
              <li key={item.position}>
                <strong>Story {item.position}</strong>
                {item.review_reason ??
                  evidenceStatusLabels[item.review_status] ??
                  "Correção solicitada"}
              </li>
            ))}
          </ul>
        )}

        {showSteps && (
          <ol className={styles.steps} aria-label="Etapas do cadastro">
            {steps.map((step) => (
              <li key={step.label} className={step.done ? styles.done : ""}>
                <span className={styles.stepMark} aria-hidden="true">
                  {step.done && (
                    <svg viewBox="0 0 12 12" width="11" height="11">
                      <path
                        d="M2.5 6.2 5 8.5l4.5-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                {step.label}
                <span className={styles.srOnly}>
                  {step.done ? " (concluída)" : " (pendente)"}
                </span>
              </li>
            ))}
          </ol>
        )}

        <Link className={styles.cta} href={nextStep.href}>
          {nextStep.cta}
        </Link>
        {/* Só enquanto a equipe não começou a análise (o banco confere). */}
        {status === "submitted" && <WithdrawApplicationButton dark />}
      </section>

      <div className={styles.feed}>
        <FeedSection
          title="Mensagens"
          href="/dashboard/mensagens"
          empty="A equipe ainda não enviou mensagens. Quando enviar, elas aparecem aqui."
          items={messages.map((message) => ({
            id: message.id,
            body: message.body,
            date: message.created_at,
          }))}
        />
        <FeedSection
          title="Notificações"
          href="/dashboard/mensagens#avisos"
          empty="Nenhum aviso no momento. Mudanças no seu cadastro aparecem aqui."
          items={notifications.map((notification) => ({
            id: notification.id,
            title: notification.title,
            body: notification.body,
            date: notification.created_at,
          }))}
        />
      </div>

      {history.length > 0 && (
        <section className={styles.history} aria-labelledby="history-title">
          <h2 id="history-title">Histórico</h2>
          <ol>
            {history.map((entry) => (
              <li key={entry.id}>
                <time dateTime={entry.created_at}>
                  {shortDate(entry.created_at)}
                </time>
                <span>
                  {historyLabels[entry.action] ?? "Atualização do cadastro"}
                  {entry.reason && <small>{entry.reason}</small>}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}

function FeedSection({
  title,
  href,
  empty,
  items,
}: {
  title: string;
  href: string;
  empty: string;
  items: { id: string; title?: string; body: string; date: string }[];
}) {
  return (
    <section className={styles.feedSection}>
      <div className={styles.feedHeading}>
        <h2>{title}</h2>
        {items.length > 0 && <Link href={href}>Ver todas</Link>}
      </div>
      {items.length === 0 ? (
        <p className={styles.empty}>{empty}</p>
      ) : (
        <ul>
          {items.slice(0, 3).map((item) => (
            <li key={item.id}>
              {item.title && <strong>{item.title}</strong>}
              <p>{item.body}</p>
              <time dateTime={item.date}>{shortDate(item.date)}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
