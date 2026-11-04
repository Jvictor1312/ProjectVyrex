import Link from "next/link";
import { notFound } from "next/navigation";
import { CreatorNav } from "@/app/components/creator-nav";
import { CreatorMetricVerification } from "@/app/components/metric-verification";
import type { MetricVerificationData } from "@/lib/instagram/view-data";
import { VyrexLogo } from "@/app/components/vyrex-logo";
import { CreatorProfileView } from "../../../dashboard/perfil/creator-profile-view";

const demoStory = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 160"><rect width="90" height="160" fill="#2d3a4a"/><circle cx="45" cy="60" r="28" fill="#e9a66b"/><rect x="12" y="110" width="66" height="10" rx="5" fill="#fff"/><rect x="12" y="128" width="44" height="8" rx="4" fill="#9fb4c8"/></svg>',
)}`;

// Verificação de métricas fictícia: ?verificacao=conectado mostra uma conta
// ligada pela API (com uma métrica indisponível) e uma gravação enviada;
// ?verificacao=indisponivel mostra a Vyrex sem a conexão configurada e
// ?verificacao=pendente, o banco sem a estrutura (migration não aplicada).
const connectedDemo: MetricVerificationData = {
  available: true,
  loadError: false,
  connection: {
    username: "marina.demo",
    accountType: "MEDIA_CREATOR",
    status: "active",
    connectedAt: "2026-10-30T14:00:00Z",
    lastSyncedAt: "2026-10-31T09:20:00Z",
    lastSyncError: null,
    tokenExpiresAt: "2026-12-29T14:00:00Z",
    grantedScopes: ["instagram_business_basic", "instagram_business_manage_insights"],
  },
  snapshot: {
    fetchedAt: "2026-10-31T09:20:00Z",
    username: "marina.demo",
    followersCount: 4790,
    mediaCount: 312,
    accountViews: 58210,
    accountReach: null,
    insightsSince: "2026-10-03T09:20:00Z",
    insightsUntil: "2026-10-31T09:20:00Z",
    stories: [
      { mediaId: "1", postedAt: "2026-10-30T21:10:00Z", permalink: null, views: 1480, reach: 1210, unavailable: {} },
      { mediaId: "2", postedAt: "2026-10-31T08:05:00Z", permalink: null, views: null, reach: null, unavailable: { views: "not_enough_viewers", reach: "not_enough_viewers" } },
    ],
    unavailable: { account_reach: "no_data" },
  },
  recording: {
    id: "demo",
    url: null,
    contentType: "video/mp4",
    sizeBytes: 18_400_000,
    durationSeconds: 74,
    status: "pending",
    reason: null,
    createdAt: "2026-10-31T09:30:00Z",
    reviewedAt: null,
  },
};
const emptyDemo: MetricVerificationData = {
  available: true,
  loadError: false,
  connection: null,
  snapshot: null,
  recording: null,
};

// "Meu cadastro" com o mesmo componente da tela real e dados fictícios, sem
// login (para conferir o layout, principalmente no celular). Salvar exige
// login.
export default async function CreatorProfilePreview({
  searchParams,
}: {
  searchParams: Promise<{ verificacao?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { verificacao } = await searchParams;

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
        initialStep={verificacao ? "redes" : undefined}
        metricVerification={
          <CreatorMetricVerification
            configured={verificacao !== "indisponivel"}
            recordingEnabled={verificacao !== "indisponivel"}
            data={
              verificacao === "conectado"
                ? connectedDemo
                : verificacao === "pendente"
                  ? { ...emptyDemo, available: false }
                  : emptyDemo
            }
            canEdit
            userId="00000000-0000-4000-8000-000000000000"
            declaredHandle="marina.demo"
            declaredFollowers={4820}
          />
        }
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
