import Link from "next/link";
import { notFound } from "next/navigation";
import { CreatorNav } from "@/app/components/creator-nav";
import { VyrexLogo } from "@/app/components/vyrex-logo";
import { CreatorProfileView } from "../../../dashboard/perfil/creator-profile-view";

const demoStory = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 160"><rect width="90" height="160" fill="#2d3a4a"/><circle cx="45" cy="60" r="28" fill="#e9a66b"/><rect x="12" y="110" width="66" height="10" rx="5" fill="#fff"/><rect x="12" y="128" width="44" height="8" rx="4" fill="#9fb4c8"/></svg>',
)}`;

// "Meu cadastro" com o mesmo componente da tela real e dados fictícios, sem
// login (para conferir o layout, principalmente no celular). Salvar exige
// login.
export default function CreatorProfilePreview() {
  if (process.env.NODE_ENV !== "development") notFound();

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
      <CreatorProfileView
        lede="Prévia com dados fictícios. Tudo é salvo enquanto você preenche."
        hasLoadError={false}
        canEdit
        lockedMessage=""
        status="incomplete"
        decisionReason={null}
        profile={{
          publicName: "Marina Costa",
          city: "Campinas",
          region: "SP",
          biography: "Rotina, moda acessível e viagens curtas.",
          categories: ["lifestyle", "moda", "viagens"],
        }}
        accounts={[
          {
            id: "demo",
            platform: "instagram",
            handle: "marina.demo",
            profile_url: "https://www.instagram.com/marina.demo",
            followers_reported: 4820,
            verification_status: "unverified",
          },
        ]}
        evidenceSlots={[1, 2, 3, 4, 5].map((position) => ({
          position,
          uploaded: position <= 2,
          imageUrl: position <= 2 ? demoStory : undefined,
          statusLabel: position <= 2 ? "Enviada" : "Pendente",
          meta: position <= 2 ? "1.250 visualizações" : undefined,
          reason: null,
          needsAttention: false,
        }))}
        evidenceCount={2}
        evidenceComplete={false}
        requiredEvidence={3}
        minimumViews={1000}
        maxStoryAgeDays={7}
        reviewIssues={["Envie a evidência 3."]}
      />
    </main>
  );
}
