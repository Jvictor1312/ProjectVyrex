import "server-only";
import { headers } from "next/headers";

// Limite de tentativas por endereço de rede, em memória (vale por instância
// do servidor). Protege login, cadastro e recuperação contra tentativas em
// massa. Numa hospedagem com várias instâncias, cada uma tem o seu contador;
// o Supabase mantém os próprios limites como segunda camada.
const attempts = new Map<string, number[]>();
const maxTrackedKeys = 10_000;

async function clientAddress() {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || list.get("x-real-ip") || "local";
}

export async function rateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
  extraKey = "",
) {
  const key = `${bucket}:${await clientAddress()}:${extraKey.toLowerCase()}`;
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
