import { createHmac, timingSafeEqual } from "node:crypto";

// Avisos da Meta (remoção do app e pedido de exclusão de dados) chegam com um
// `signed_request`: assinatura HMAC-SHA256 com a chave secreta do app, um
// ponto e o conteúdo em JSON, ambos em base64url. Sem assinatura válida, o
// aviso é ignorado.
export function parseSignedRequest(
  signedRequest: string,
  appSecret: string,
): { user_id?: string; algorithm?: string } | null {
  const [signature, payload] = signedRequest.split(".");
  if (!signature || !payload) return null;

  const expected = createHmac("sha256", appSecret).update(payload).digest();
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data !== "object" || data === null) return null;
    if (data.algorithm && String(data.algorithm).toUpperCase() !== "HMAC-SHA256") {
      return null;
    }
    return {
      algorithm: data.algorithm,
      user_id: data.user_id === undefined ? undefined : String(data.user_id),
    };
  } catch {
    return null;
  }
}
