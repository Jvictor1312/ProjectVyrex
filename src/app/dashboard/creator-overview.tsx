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

// Caminho completo do criador na Vyrex, para ele saber onde está e o que vem
// depois.
const journey = [
  { title: "Preencha o cadastro", text: "Perfil, rede social e os prints dos Stories." },
  { title: "Envie para análise", text: "Revise e envie. Dá para desfazer o envio enquanto a análise não começa." },
  { title: "A equipe analisa", text: "Pessoas da equipe conferem sua rede e as visualizações dos Stories." },
  { title: "Resultado", text: "Aprovação, pedido de correção ou resposta da equipe, sempre avisados aqui." },
  { title: "Campanhas", text: "Perfis aprovados entram na rede que as marcas consultam." },
];

function journeyStage(status: string) {
  switch (status) {
    case "submitted":
      return 1;
    case "under_review":
      return 2;
    case "approved":
      return 4;
    case "rejected":
    case "suspended":
      return 3;
    default:
      return 0; // incompleto ou com correção pedida: o criador está preenchendo
  }
}

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

      {/* No computador: próximo passo, jornada e histórico à esquerda;
          mensagens e avisos à direita. No celular, uma coluna só. */}
      <div className={styles.layout}>
      <div className={styles.mainColumn}>
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

      <section className={styles.journey} aria-labelledby="journey-title">
        <h2 id="journey-title">Sua jornada na Vyrex</h2>
        <ol>
          {journey.map((stage, index) => {
            const current = journeyStage(status);
            const state =
              index < current ? "past" : index === current ? "current" : "next";
            return (
              <li
                key={stage.title}
                className={styles[state]}
                aria-current={state === "current" ? "step" : undefined}
              >
                <span className={styles.journeyMark} aria-hidden="true">
                  {index + 1}
                </span>
                <span>
                  <strong>
                    {stage.title}
                    {state === "current" && (
                      <em className={styles.youAreHere}>Você está aqui</em>
                    )}
                  </strong>
                  <small>{stage.text}</small>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={styles.history} aria-labelledby="history-title">
        <h2 id="history-title">Histórico</h2>
        {history.length === 0 ? (
          <p className={styles.empty}>
            Cada etapa do seu cadastro (envio, análise, decisões) fica
            registrada aqui.
          </p>
        ) : (
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
        )}
      </section>
      </div>

      <aside className={styles.feed} aria-label="Mensagens e avisos">
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
      </aside>
      </div>
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
