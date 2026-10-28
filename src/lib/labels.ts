// Vocabulário único da plataforma. Toda tela usa estes nomes, para que a mesma
// coisa não apareça com nomes diferentes ("Validação" aqui, "Analista" ali).

export const internalRoleKeys = [
  "admin",
  "recruiter",
  "relationship_manager",
  "validator",
] as const;
export type InternalRole = (typeof internalRoleKeys)[number];

export const roleLabels: Record<InternalRole, string> = {
  admin: "Administrador",
  recruiter: "Recrutador",
  relationship_manager: "Gestor de relacionamento",
  validator: "Analista de validação",
};

// O que cada função pode fazer, em uma frase (mostrado na gestão de colaboradores).
export const roleDescriptions: Record<InternalRole, string> = {
  admin:
    "Acesso completo: colaboradores, critérios de elegibilidade, privacidade e todos os cadastros.",
  recruiter:
    "Faz a triagem dos criadores atribuídos e encaminha os cadastros para validação.",
  relationship_manager:
    "Acompanha os criadores atribuídos, registra contatos e envia mensagens.",
  validator:
    "Confere redes e evidências, solicita correções e registra a decisão final.",
};

export function isInternalRole(key: string): key is InternalRole {
  return (internalRoleKeys as readonly string[]).includes(key);
}

export const creatorStatusKeys = [
  "incomplete",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "rejected",
  "suspended",
] as const;
export type CreatorStatus = (typeof creatorStatusKeys)[number];

export const creatorStatusLabels: Record<CreatorStatus, string> = {
  incomplete: "Cadastro incompleto",
  submitted: "Aguardando análise",
  under_review: "Em análise",
  changes_requested: "Correção solicitada",
  approved: "Aprovado",
  rejected: "Rejeitado",
  suspended: "Suspenso",
};

// Tom visual de cada situação. A cor sempre acompanha o texto, nunca o substitui.
export type Tone = "neutral" | "info" | "warning" | "success" | "danger";

export const creatorStatusTones: Record<CreatorStatus, Tone> = {
  incomplete: "neutral",
  submitted: "info",
  under_review: "info",
  changes_requested: "warning",
  approved: "success",
  rejected: "danger",
  suspended: "danger",
};

export function creatorStatusLabel(status: string) {
  return creatorStatusLabels[status as CreatorStatus] ?? status;
}

export function creatorStatusTone(status: string): Tone {
  return creatorStatusTones[status as CreatorStatus] ?? "neutral";
}

export const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  other: "Outra rede",
};

// Categorias de conteúdo (chaves em src/lib/validation/creator.ts).
export const categoryLabels: Record<string, string> = {
  games: "Games e jogos",
  beleza: "Beleza",
  tecnologia: "Tecnologia",
  humor: "Humor",
  lifestyle: "Estilo de vida",
  esportes: "Esportes",
  alimentacao: "Alimentação",
  moda: "Moda",
  viagens: "Viagens",
  educacao: "Educação",
  musica: "Música",
  outros: "Outros",
};

export const categoryLabel = (key: string) => categoryLabels[key] ?? key;

// Situação de cada evidência (Story) depois da conferência da equipe.
export const evidenceStatusLabels: Record<string, string> = {
  pending: "Aguardando conferência",
  approved: "Aprovada",
  rejected: "Rejeitada",
  changes_requested: "Correção solicitada",
};

export const evidenceStatusTones: Record<string, Tone> = {
  pending: "info",
  approved: "success",
  rejected: "danger",
  changes_requested: "warning",
};

// Verificação da rede social pela equipe.
export const accountVerificationLabels: Record<string, string> = {
  unverified: "Não verificada",
  verified: "Verificada",
  rejected: "Rejeitada",
};

export const accountVerificationTones: Record<string, Tone> = {
  unverified: "neutral",
  verified: "success",
  rejected: "danger",
};

// Fallback quando a configuração de elegibilidade não carrega.
export const defaultRequiredEvidence = 3;
