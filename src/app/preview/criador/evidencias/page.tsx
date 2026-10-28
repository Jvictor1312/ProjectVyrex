import { notFound } from "next/navigation";
import { EvidenceBoard } from "@/app/components/evidence-board";

const demoStory = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 160"><rect width="90" height="160" fill="#2d3a4a"/><circle cx="45" cy="60" r="28" fill="#e9a66b"/><rect x="12" y="110" width="66" height="10" rx="5" fill="#fff"/><rect x="12" y="128" width="44" height="8" rx="4" fill="#9fb4c8"/></svg>',
)}`;

// Quadro real de evidências com dados fictícios. Salvar exige login.
export default function EvidencePreview() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="dashboard-page">
      <p className="preview-notice" role="note">
        Demonstração com dados fictícios
      </p>
      <section className="profile-content">
        <section className="profile-section">
          <div className="section-heading">
            <span className="principle-number">03</span>
            <div>
              <h2>Evidências</h2>
              <p>Toque em cada quadro e envie o print do Story.</p>
            </div>
          </div>
          <EvidenceBoard
            slots={[1, 2, 3, 4, 5].map((position) => ({
              position,
              uploaded: position <= 2,
              imageUrl: position <= 2 ? demoStory : undefined,
              statusLabel: position === 2 ? "Correção solicitada" : "Enviada",
              meta: position <= 2 ? "1.250 visualizações" : undefined,
              reason:
                position === 2 ? "O número de visualizações não aparece." : null,
              needsAttention: position === 2,
            }))}
            socialAccounts={[
              { id: "demo", platform: "instagram", handle: "marina.demo" },
            ]}
            minimumViews={1000}
            maxStoryAgeDays={7}
            canEdit
          />
        </section>
      </section>
    </main>
  );
}
