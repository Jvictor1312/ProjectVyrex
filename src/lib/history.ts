// Histórico do cadastro (review_history). Cada conferência de evidência é um
// registro próprio, ligado ao Story conferido (evidence_id). Sem o número do
// Story, três aprovações seguidas aparecem como três linhas idênticas.

// Relação usada pelas telas para trazer o Story junto do histórico.
export const historyEvidenceSelect =
  "evidence:metric_evidence!review_history_evidence_id_creator_id_fkey(position)";

type LinkedEvidence =
  | { position: number }
  | { position: number }[]
  | null
  | undefined;

// O Supabase devolve a evidência ligada como objeto ou como lista.
export function historyStoryPosition(evidence: LinkedEvidence): number | null {
  const item = Array.isArray(evidence) ? evidence[0] : evidence;
  return typeof item?.position === "number" ? item.position : null;
}

export function historyEntryLabel(label: string, position: number | null) {
  return position === null ? label : `${label} · Story ${position}`;
}
