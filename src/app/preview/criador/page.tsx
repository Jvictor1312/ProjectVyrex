import Link from "next/link";
import { notFound } from "next/navigation";
import { CreatorNav } from "@/app/components/creator-nav";
import { CreatorOverview } from "../../dashboard/creator-overview";

// Mostra a visão geral real do criador com dados fictícios, sem login.
export default function CreatorDashboardPreview() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="dashboard-page">
      <header className="dashboard-header creator-header">
        <Link className="brand" href="/">
          <span className="brand-mark">V</span>
          <span>VYREX</span>
        </Link>
        <CreatorNav />
        <Link className="quiet-button" href="/login">
          Entrar na conta
        </Link>
      </header>
      <CreatorOverview
        name="Marina"
        status="changes_requested"
        decisionReason={null}
        steps={[
          { label: "Perfil", done: true },
          { label: "Rede social", done: true },
          { label: "Evidências 2/3", done: false },
        ]}
        evidenceIssues={[
          {
            position: 3,
            review_status: "changes_requested",
            review_reason: "A captura não mostra o número de visualizações.",
          },
        ]}
        nextStep={{
          title: "Corrija as pendências",
          text: "Atualize o que a equipe pediu e envie de novo.",
          href: "/preview/criador/perfil",
          cta: "Corrigir cadastro",
        }}
        messages={[
          {
            id: "m1",
            body: "Recebemos seu cadastro. A equipe está conferindo as informações.",
            created_at: "2026-10-25T14:00:00Z",
          },
          {
            id: "m2",
            body: "Suas métricas serão verificadas manualmente.",
            created_at: "2026-10-24T10:30:00Z",
          },
        ]}
        notifications={[
          {
            id: "n1",
            title: "Correção solicitada",
            body: "A evidência 3 precisa ser enviada de novo.",
            created_at: "2026-10-26T09:15:00Z",
          },
        ]}
        history={[
          {
            id: "h2",
            action: "changes_requested",
            reason: "Evidência 3 ilegível.",
            created_at: "2026-10-26T09:15:00Z",
          },
          {
            id: "h1",
            action: "submitted",
            reason: null,
            created_at: "2026-10-23T18:40:00Z",
          },
        ]}
        hasLoadError={false}
      />
    </main>
  );
}
