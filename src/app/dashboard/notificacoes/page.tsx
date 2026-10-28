import type { Metadata } from "next";
import Link from "next/link";
import { CreatorNav } from "@/app/components/creator-nav";
import { NotificationReadButton } from "@/app/components/notification-read-button";
import { requireUser } from "@/lib/auth";
import styles from "../dashboard.module.css";

export const metadata: Metadata = { title: "Notificações" };

export default async function CreatorNotificationsPage() {
  const { supabase, user } = await requireUser();
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, title, body, created_at, read_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

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
      <section className="dashboard-content">
        <h1>Notificações</h1>
        {error ? (
          <p className="setup-warning" role="alert">
            Não foi possível carregar as notificações. Tente novamente mais
            tarde.
          </p>
        ) : notifications.length === 0 ? (
          <p className={styles.empty}>Você ainda não tem notificações.</p>
        ) : (
          <section
            className={styles.notificationList}
            aria-label="Notificações"
          >
            {notifications.map((notification) => (
              <article
                className={styles.notificationItem}
                key={notification.id}
              >
                <div className={styles.notificationHeading}>
                  <h2>{notification.title}</h2>
                  <span
                    className={
                      notification.read_at
                        ? styles.notificationRead
                        : styles.notificationUnread
                    }
                  >
                    {notification.read_at ? "Lida" : "Não lida"}
                  </span>
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
          </section>
        )}
      </section>
    </main>
  );
}
