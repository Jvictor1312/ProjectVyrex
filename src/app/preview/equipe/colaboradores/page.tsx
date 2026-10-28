import { notFound } from "next/navigation";
import { TeamDirectory, type TeamMember } from "@/app/components/team-directory";
import { InternalShell } from "../../../interno/internal-shell";
import { AuditHistory, RoleLegend } from "../../../interno/team-sections";
import styles from "../../../interno/internal.module.css";

// Gestão de colaboradores real com dados fictícios, só em desenvolvimento.
// As ações chamam o servidor de verdade e são recusadas por falta de login.
const demoMembers: TeamMember[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Ana Ribeiro",
    email: "ana.ribeiro@vyrex.demo",
    roles: ["admin"],
    active: true,
    createdAt: "2026-08-04T12:00:00Z",
    deactivatedAt: null,
    deactivationReason: null,
    lastSignInAt: "2026-10-28T09:12:00Z",
    isCurrentUser: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Bruno Tavares",
    email: "bruno.tavares@vyrex.demo",
    roles: ["recruiter", "relationship_manager"],
    active: true,
    createdAt: "2026-09-02T12:00:00Z",
    deactivatedAt: null,
    deactivationReason: null,
    lastSignInAt: "2026-10-27T17:40:00Z",
    isCurrentUser: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Carla Mendes",
    email: "carla.mendes@vyrex.demo",
    roles: ["validator"],
    active: true,
    createdAt: "2026-09-15T12:00:00Z",
    deactivatedAt: null,
    deactivationReason: null,
    lastSignInAt: null,
    isCurrentUser: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Diego Souza",
    email: "diego.souza@vyrex.demo",
    roles: ["recruiter"],
    active: false,
    createdAt: "2026-08-20T12:00:00Z",
    deactivatedAt: "2026-10-10T12:00:00Z",
    deactivationReason: "Encerramento do contrato de prestação de serviço.",
    lastSignInAt: "2026-10-09T11:05:00Z",
    isCurrentUser: false,
  },
];

export default async function TeamMembersPreview() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <InternalShell
      active="equipe"
      isAdmin
      roles={["Administrador"]}
      email="ana.ribeiro@vyrex.demo"
      logoutHref="/login"
    >
      <section className={styles.main}>
        <p className={styles.demoNotice}>
          Prévia de desenvolvimento com dados fictícios. As ações são recusadas
          pelo servidor porque não há login.
        </p>
        <TeamDirectory
          members={demoMembers}
          inviteConfigured={false}
          emailsAvailable
          loadError={false}
        />
        <RoleLegend
          counts={{ admin: 1, recruiter: 2, relationship_manager: 1, validator: 1 }}
        />
        <AuditHistory
          loadError={false}
          entries={[
            { id: "a1", action: "Função de colaborador alterada", details: "Função Recrutador adicionada", actor: "Ana Ribeiro", target: "user_role:2", targetName: "Bruno Tavares", createdAt: "2026-10-28T14:02:00Z" },
            { id: "a2", action: "Função de colaborador alterada", details: "Função Gestor de relacionamento adicionada", actor: "Ana Ribeiro", target: "user_role:2", targetName: "Bruno Tavares", createdAt: "2026-10-28T14:05:00Z" },
            { id: "a3", action: "Função de colaborador alterada", details: "Função Analista de validação removida", actor: "Ana Ribeiro", target: "user_role:2", targetName: "Bruno Tavares", createdAt: "2026-10-28T14:11:00Z" },
            { id: "a4", action: "Conta ativada ou desativada", details: "desativada · “Encerramento do contrato”", actor: "Ana Ribeiro", target: "profile:4", targetName: "Diego Souza", createdAt: "2026-10-10T12:00:00Z" },
            { id: "a5", action: "Critérios de elegibilidade alterados", details: "1.000 visualizações mínimas · 3 evidências obrigatórias", actor: "Ana Ribeiro", target: "eligibility_settings:", targetName: "Critérios de elegibilidade", createdAt: "2026-09-20T15:30:00Z" },
          ]}
        />
      </section>
    </InternalShell>
  );
}
