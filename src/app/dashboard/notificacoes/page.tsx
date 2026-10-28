import { redirect } from "next/navigation";

// As notificações agora ficam na tela de Mensagens.
export default function CreatorNotificationsPage() {
  redirect("/dashboard/mensagens#avisos");
}
