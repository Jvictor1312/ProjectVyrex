import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Limite de tentativas. Protege login, cadastro e recuperação contra
// tentativas em massa. O contador fica no banco (consume_rate_limit,
// migration 202610290002) e vale para todos os servidores ao mesmo tempo.
// Se o banco não responder, o contador em memória (por servidor) assume, para
// o login não parar por causa do limite. O Supabase mantém os próprios limites
// como segunda camada.
const attempts = new Map<string, number[]>();
const maxTrackedKeys = 10_000;

// x-real-ip é preenchido pela hospedagem; o x-forwarded-for pode vir montado
// pelo próprio visitante, por isso fica só como alternativa.
async function clientAddress() {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  return list.get("x-real-ip")?.trim() || forwarded || "local";
}

// Com extraKey (e-mail ou id da conta), o limite vale para aquela conta em
// qualquer endereço de rede: trocar de IP (ou forjar o cabeçalho) não zera o
// contador. Sem extraKey, o limite é por endereço de rede.
export async function rateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
  extraKey = "",
) {
  const key = extraKey
    ? `${bucket}:account:${extraKey.trim().toLowerCase()}`
    : `${bucket}:ip:${await clientAddress()}`;

  const shared = await sharedRateLimit(key, limit, windowSeconds);
  if (shared !== null) return { allowed: shared };
  return memoryRateLimit(key, limit, windowSeconds);
}

// O banco recebe só o resumo (SHA-256) da chave: nada de e-mail ou IP gravado.
async function sharedRateLimit(key: string, limit: number, windowSeconds: number) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    counter_key: createHash("sha256").update(key).digest("hex"),
    max_hits: limit,
    window_seconds: windowSeconds,
  });
  return error || typeof data !== "boolean" ? null : data;
}

function memoryRateLimit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const recent = (attempts.get(key) ?? []).filter((time) => time > windowStart);

  if (recent.length >= limit) {
    attempts.set(key, recent);
    return { allowed: false };
  }

  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > maxTrackedKeys) {
    const oldest = attempts.keys().next().value;
    if (oldest) attempts.delete(oldest);
  }
  return { allowed: true };
}

export const tooManyAttempts = {
  message: "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.",
  success: false,
} as const;
