import { NotificationReadButton } from "@/app/components/notification-read-button";
import { VyrexMark } from "@/app/components/vyrex-logo";
import styles from "./messages.module.css";

// Página Mensagens: a mesma apresentação na tela real (/dashboard/mensagens) e
// na prévia sem login (/preview/criador/mensagens).
export type CreatorMessagesProps = {
  hasLoadError: boolean;
  messages: { id: string; body: string; created_at: string }[];
  notifications: {
    id: string;
    title: string;
    body: string;
    created_at: string;
    read_at: string | null;
  }[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function CreatorMessages({
  hasLoadError,
  messages,
  notifications,
}: CreatorMessagesProps) {
  const unread = notifications.filter((item) => !item.read_at).length;

  return (
    <section className={`dashboard-content ${styles.page}`}>
      <header className={styles.header}>
        <h1>Mensagens</h1>
        <p>
          O que a equipe da Vyrex escreveu para você e os avisos sobre a
          situação do seu cadastro.
        </p>
      </header>

      {hasLoadError && (
        <p className="setup-warning" role="alert">
          Não foi possível carregar tudo. Recarregue a página.
        </p>
      )}

      <div className={styles.layout}>
        <section className={styles.panel} aria-labelledby="equipe">
          <div className={styles.panelHeader}>
            <h2 id="equipe">Mensagens da equipe</h2>
            {messages.length > 0 && (
              <span className={styles.count}>
                {messages.length}{" "}
                {messages.length === 1 ? "mensagem" : "mensagens"}
              </span>
            )}
          </div>
          {messages.length === 0 ? (
            <EmptyState
              icon="message"
              title="Nenhuma mensagem ainda"
              text="A equipe ainda não enviou mensagens. Quando enviar, elas aparecem aqui."
            />
          ) : (
            <ol className={styles.list}>
              {messages.map((message) => (
                <li key={message.id}>
                  <article className={styles.message}>
                    <span className={styles.sender} aria-hidden="true">
                      <VyrexMark />
                    </span>
                    <div className={styles.messageBody}>
                      <div className={styles.meta}>
                        <strong>Equipe Vyrex</strong>
                        <time dateTime={message.created_at}>
                          {formatDate(message.created_at)}
                        </time>
                      </div>
                      <p>{message.body}</p>
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section
          className={`${styles.panel} ${styles.notices}`}
          id="avisos"
          aria-labelledby="avisos-titulo"
        >
          <div className={styles.panelHeader}>
            <h2 id="avisos-titulo">Avisos</h2>
            {unread > 0 && (
              <span className={`${styles.count} ${styles.countNew}`}>
                {unread} {unread === 1 ? "novo" : "novos"}
              </span>
            )}
          </div>
          {notifications.length === 0 ? (
            <EmptyState
              icon="bell"
              title="Nenhum aviso no momento"
              text="Mudanças na situação do seu cadastro aparecem aqui."
            />
          ) : (
            <ol className={styles.list}>
              {notifications.map((notification) => {
                const isNew = !notification.read_at;
                return (
                  <li key={notification.id}>
                    <article
                      className={`${styles.notice} ${isNew ? styles.noticeNew : ""}`}
                    >
                      <div className={styles.meta}>
                        <h3>
                          {notification.title}
                          {isNew && <span className={styles.newTag}>Novo</span>}
                        </h3>
                        <time dateTime={notification.created_at}>
                          {formatDate(notification.created_at)}
                        </time>
                      </div>
                      <p>{notification.body}</p>
                      {isNew && (
                        <div className={styles.noticeAction}>
                          <NotificationReadButton
                            notificationId={notification.id}
                          />
                        </div>
                      )}
                    </article>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </section>
  );
}

// Estado vazio: ícone de traço fino, título curto e o que vai aparecer ali.
function EmptyState({
  icon,
  title,
  text,
}: {
  icon: "message" | "bell";
  title: string;
  text: string;
}) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20">
          {icon === "message" ? (
            <path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5h-1.5z" />
          ) : (
            <path d="M12 4.5a5 5 0 0 0-5 5v3.2L5.5 15.5h13L17 12.7V9.5a5 5 0 0 0-5-5zM10 18.5a2 2 0 0 0 4 0" />
          )}
        </svg>
      </span>
      <div>
        <p className={styles.emptyTitle}>{title}</p>
        <p className={styles.emptyText}>{text}</p>
      </div>
    </div>
  );
}
