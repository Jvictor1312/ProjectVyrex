import type { Metadata } from "next";
import { NotificationReadButton } from "@/app/components/notification-read-button";
import { requireUserFast } from "@/lib/auth";
import { CreatorShell } from "../creator-shell";
import styles from "../dashboard.module.css";

export const metadata: Metadata = { title: "Mensagens" };

// Mensagens da equipe e avisos do sistema ficam juntos numa só tela.
export default async function CreatorMessagesPage() {
  const { supabase, user, activeCheck, ensureActive } = await requireUserFast();
  const [messagesResult, notificationsResult, activeResult] = await Promise.all(
    [
      supabase
        .from("team_messages")
        .select("id, body, created_at")
        .eq("creator_id", user.id)
        .eq("visible_to_creator", true)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("notifications")
        .select("id, title, body, created_at, read_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      activeCheck,
    ],
  );
  await ensureActive(activeResult);
  const messages = messagesResult.data ?? [];
  const notifications = notificationsResult.data ?? [];

  return (
    <CreatorShell>
      <section className="dashboard-content">
        <h1>Mensagens</h1>
        {(messagesResult.error || notificationsResult.error) && (
          <p className="setup-warning" role="alert">
            Não foi possível carregar tudo. Recarregue a página.
          </p>
        )}

        <section className={styles.historySection} aria-labelledby="equipe">
          <h2 id="equipe">Da equipe</h2>
          {messages.length === 0 ? (
            <p className={styles.empty}>Nenhuma mensagem ainda.</p>
          ) : (
            <div className={styles.notificationList}>
              {messages.map((message) => (
                <article className={styles.notificationItem} key={message.id}>
                  <p>{message.body}</p>
                  <time dateTime={message.created_at}>
                    {new Date(message.created_at).toLocaleString("pt-BR")}
                  </time>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={styles.historySection} aria-labelledby="avisos">
          <h2 id="avisos">Avisos</h2>
          {notifications.length === 0 ? (
            <p className={styles.empty}>Nada novo por aqui.</p>
          ) : (
            <div className={styles.notificationList}>
              {notifications.map((notification) => (
                <article
                  className={styles.notificationItem}
                  key={notification.id}
                >
                  <div className={styles.notificationHeading}>
                    <h3>{notification.title}</h3>
                    {!notification.read_at && (
                      <span className={styles.notificationUnread}>Novo</span>
                    )}
                  </div>
                  <p>{notification.body}</p>
                  <time dateTime={notification.created_at}>
                    {new Date(notification.created_at).toLocaleString("pt-BR")}
                  </time>
                  {!notification.read_at && (
                    <NotificationReadButton notificationId={notification.id} />
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </CreatorShell>
  );
}
