import { redirect } from "next/navigation";

// A privacidade agora fica dentro de Configurações.
export default function CreatorPrivacyPage() {
  redirect("/dashboard/configuracoes#privacidade");
}
