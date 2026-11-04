// Estrutura do banco da verificação de métricas (migration 202610310001).
// Enquanto ela não for aplicada, as tabelas não existem e o Supabase responde
// PGRST205 ("tabela não encontrada"). Esse caso tem estado próprio
// ("indisponível") em vez de virar erro genérico na tela; qualquer outro erro
// continua sendo erro.

export const verificationMigration = "202610310001_instagram_metric_verification";

// PGRST205: a API do Supabase não conhece a tabela. 42P01: o Postgres não
// encontrou a tabela (mesma causa, vista direto do banco).
const missingStructureCodes = new Set(["PGRST205", "42P01"]);

export function isMissingStructureError(error: { code?: unknown } | null | undefined) {
  return Boolean(error && missingStructureCodes.has(String(error.code)));
}

// Depois de constatar a falta da estrutura, as telas não consultam de novo
// por 60 s (evita uma consulta com erro a cada página). Passado esse tempo,
// conferem de novo: aplicada a migration, a verificação aparece sozinha.
export const missingStructureRecheckMs = 60_000;
let missingUntil = 0;

export function isStructureKnownMissing(now = Date.now()) {
  return now < missingUntil;
}

export function rememberStructureMissing(now = Date.now()) {
  missingUntil = now + missingStructureRecheckMs;
}

export function forgetStructureMissing() {
  missingUntil = 0;
}
