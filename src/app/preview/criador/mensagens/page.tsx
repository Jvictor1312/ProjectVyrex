import Link from "next/link";
import { notFound } from "next/navigation";
import { CreatorNav } from "@/app/components/creator-nav";
import { VyrexLogo } from "@/app/components/vyrex-logo";
import { CreatorMessages } from "../../../dashboard/mensagens/creator-messages";

// Mensagens com o mesmo componente da tela real e dados fictícios, sem login.
// ?vazio=1 mostra a tela sem mensagens nem avisos. Marcar como lida exige login.
export default async function CreatorMessagesPreview({
  searchParams,
}: {
  searchParams: Promise<{ vazio?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const empty = (await searchParams).vazio === "1";

  return (
    <main className="dashboard-page">
      <header className="dashboard-header creator-header">
        <Link className="brand" href="/">
          <VyrexLogo />
        </Link>
        <CreatorNav />
        <Link className="quiet-button" href="/login">
          Entrar na conta
        </Link>
      </header>
      <CreatorMessages
        hasLoadError={false}
        messages={
          empty
            ? []
            : [
                {
                  id: "m2",
                  body: "Oi, Marina! Conferimos sua rede social. Falta só reenviar o print do Story 3 mostrando o número de visualizações.",
                  created_at: "2026-10-26T09:20:00Z",
                },
                {
                  id: "m1",
                  body: "Recebemos seu cadastro. A equipe está conferindo as informações.",
                  created_at: "2026-10-25T14:00:00Z",
                },
              ]
        }
        notifications={
          empty
            ? []
            : [
                {
                  id: "n2",
                  title: "Correção solicitada",
                  body: "A evidência 3 precisa ser enviada de novo.",
                  created_at: "2026-10-26T09:15:00Z",
                  read_at: null,
                },
                {
                  id: "n1",
                  title: "Nova mensagem da equipe",
                  body: "Recebemos seu cadastro. A equipe está conferindo as informações.",
                  created_at: "2026-10-25T14:00:00Z",
                  read_at: "2026-10-25T15:00:00Z",
                },
              ]
        }
      />
    </main>
  );
}
