import { roleLabels } from "@/lib/labels";

// Textos legíveis para os registros de auditoria (audit_logs).
const actionLabels: Record<string, string> = {
  "creator.application.submitted": "Cadastro enviado para análise",
  "creator.application.withdrawn": "Envio desfeito pelo criador",
  "creator.evidence.removed": "Evidência apagada pelo criador",
  "creator.social_account.verification_reset": "Rede editada pelo criador (verificação refeita)",
  "user.cpf.changed": "CPF da conta alterado",
  "creator.evidence.reviewed": "Evidência analisada",
  "creator.decision.recorded": "Decisão final registrada",
  "creator.suspended": "Cadastro suspenso",
  "creator.reinstated": "Cadastro reativado",
  "creator.responsibles.changed": "Responsáveis alterados",
  "creator.message.sent": "Mensagem enviada ao criador",
  "creator.corrections.requested": "Correção solicitada",
  "creator.social_account.reviewed": "Rede social analisada",
  "creator.forwarded_to_validation": "Encaminhado para validação",
  "creator.contact.recorded": "Contato registrado",
  "user.role.changed": "Função de colaborador alterada",
  "user.account.status.changed": "Conta ativada ou desativada",
  "eligibility.settings.changed": "Critérios de elegibilidade alterados",
  "privacy.request.created": "Pedido de privacidade criado",
  "privacy.request.in_progress": "Pedido de privacidade em andamento",
  "privacy.request.resolved": "Pedido de privacidade concluído",
  "privacy.request.rejected": "Pedido de privacidade recusado",
};

const valueLabels: Record<string, string> = {
  approved: "aprovado",
  rejected: "rejeitado",
  changes_requested: "correção solicitada",
  verified: "verificado",
  granted: "concedida",
  revoked: "removida",
};

const entityLabels: Record<string, string> = {
  eligibility_settings: "Critérios de elegibilidade",
  site_settings: "Vídeo de apresentação",
  data_request: "Pedido de privacidade",
};

// Em quem (ou em quê) a alteração foi feita, para mostrar no histórico.
export function auditTargetName(
  entityType: string,
  entityId: string | null,
  nameById: Map<string, string>,
) {
  return (
    (entityId && nameById.get(entityId)) ||
    entityLabels[entityType] ||
    "Registro do sistema"
  );
}

export function auditActionLabel(action: string) {
  return actionLabels[action] ?? "Ação administrativa";
}

// Resume os detalhes em uma frase curta, sem mostrar dados técnicos.
export function auditDetailsSummary(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const record = details as Record<string, unknown>;
  const parts: string[] = [];
  // Mudança de função: "Recrutador adicionada" / "Administrador removida".
  if (typeof record.role === "string") {
    const label = (roleLabels as Record<string, string>)[record.role] ?? record.role;
    parts.push(`Função ${label} ${record.enabled === false ? "removida" : "adicionada"}`);
  }
  for (const key of record.role ? ["decision", "status", "outcome"] : ["decision", "status", "outcome", "enabled"]) {
    const value = record[key];
    if (typeof value === "string") parts.push(valueLabels[value] ?? value);
    if (typeof value === "boolean")
      parts.push(value ? "ativada" : "desativada");
  }
  if (typeof record.reason === "string" && record.reason.trim()) {
    parts.push(`“${record.reason.trim()}”`);
  }
  if (typeof record.minimum_story_views === "number") {
    parts.push(
      `${record.minimum_story_views.toLocaleString("pt-BR")} visualizações mínimas`,
    );
  }
  if (typeof record.required_story_evidence === "number") {
    parts.push(`${record.required_story_evidence} evidências obrigatórias`);
  }
  return parts.length ? parts.join(" · ") : null;
}
