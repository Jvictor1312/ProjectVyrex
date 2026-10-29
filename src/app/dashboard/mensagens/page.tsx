import type { Metadata } from "next";
import { requireUserFast } from "@/lib/auth";
import { CreatorMessages } from "./creator-messages";

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

  return (
    <>
      <CreatorMessages
        hasLoadError={Boolean(messagesResult.error || notificationsResult.error)}
        messages={messagesResult.data ?? []}
        notifications={notificationsResult.data ?? []}
      />
    </>
  );
}
