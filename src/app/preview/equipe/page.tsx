import { notFound } from "next/navigation";
import { CreatorQueue } from "../../interno/creator-queue";
import { InternalShell } from "../../interno/internal-shell";
import { PageHeader, Stats } from "../../interno/ui";
import styles from "../../interno/internal.module.css";

// Visão geral real da equipe com dados fictícios, só em desenvolvimento.
const demoRows = [
  { id: "1", name: "Marina Costa", status: "under_review", submittedAt: "2026-10-22T12:00:00Z", updatedAt: "2026-10-27T12:00:00Z" },
  { id: "2", name: "Rafael Lima", status: "submitted", submittedAt: "2026-10-26T12:00:00Z", updatedAt: "2026-10-26T12:00:00Z" },
  { id: "3", name: "Bia Nunes", status: "changes_requested", submittedAt: "2026-10-18T12:00:00Z", updatedAt: "2026-10-25T12:00:00Z" },
  { id: "4", name: "Lucas Prado", status: "approved", submittedAt: "2026-10-10T12:00:00Z", updatedAt: "2026-10-20T12:00:00Z" },
  { id: "5", name: "Joana Alves", status: "incomplete", submittedAt: null, updatedAt: "2026-10-28T12:00:00Z" },
].map((row) => ({ ...row, href: "/preview/criador" }));

export default async function TeamDashboardPreview() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <InternalShell
      active="painel"
      isAdmin
      roles={["Administrador"]}
      email="ana.ribeiro@vyrex.demo"
      logoutHref="/login"
    >
      <section className={styles.main}>
        <p className={styles.demoNotice}>
          Prévia de desenvolvimento com dados fictícios.
        </p>
        <PageHeader
          title="Visão geral da operação"
          description="Situação dos cadastros de criadores, distribuição entre responsáveis e redes declaradas."
        />
        <Stats
          label="Indicadores dos cadastros"
          items={[
            { label: "Cadastros no total", value: "128" },
            { label: "Aguardando análise", value: "16" },
            { label: "Em análise", value: "9" },
            { label: "Com correção pendente", value: "7" },
            { label: "Aprovados", value: "54" },
            { label: "Tempo médio de análise", value: "2,4 dias" },
          ]}
        />
        <div className={styles.reports}>
          <section className={styles.report}>
            <h2>Carteira por recrutador</h2>
            <div className={styles.reportRow}><span>Bruno Tavares</span><strong>42</strong></div>
            <div className={styles.reportRow}><span>Diego Souza</span><strong>18</strong></div>
          </section>
          <section className={styles.report}>
            <h2>Carteira por gestor de relacionamento</h2>
            <div className={styles.reportRow}><span>Bruno Tavares</span><strong>31</strong></div>
          </section>
          <section className={styles.report}>
            <h2>Redes declaradas</h2>
            <div className={styles.reportRow}><span>Instagram</span><strong>96</strong></div>
            <div className={styles.reportRow}><span>TikTok</span><strong>41</strong></div>
            <div className={styles.reportRow}><span>YouTube</span><strong>12</strong></div>
          </section>
        </div>
        <CreatorQueue
          title="Cadastros de criadores"
          rows={demoRows}
          total={demoRows.length}
          search=""
          status="all"
          page={1}
          totalPages={1}
          pageHref={() => "/preview/equipe"}
          loadError={false}
        />
      </section>
    </InternalShell>
  );
}
