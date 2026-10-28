import type { Metadata } from "next";
import Link from "next/link";
import { CreatorNav } from "@/app/components/creator-nav";
import { requireUser } from "@/lib/auth";
import styles from "../dashboard.module.css";

export const metadata: Metadata = { title: "Mensagens da equipe" };

export default async function CreatorMessagesPage() {
  const { supabase, user } = await requireUser();
  const { data: messages, error } = await supabase
    .from("team_messages")
    .select("id, body, created_at")
    .eq("creator_id", user.id)
    .eq("visible_to_creator", true)
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
        <h1>Mensagens da equipe</h1>
        {error ? (
          <p className="setup-warning" role="alert">
            Não foi possível carregar as mensagens. Tente novamente mais tarde.
          </p>
        ) : messages.length === 0 ? (
          <p className={styles.empty}>Você ainda não tem mensagens.</p>
        ) : (
          <section className={styles.notificationList} aria-label="Mensagens">
            {messages.map((message) => (
              <article className={styles.notificationItem} key={message.id}>
                <p>{message.body}</p>
                <time dateTime={message.created_at}>
                  {new Date(message.created_at).toLocaleString("pt-BR")}
                </time>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
