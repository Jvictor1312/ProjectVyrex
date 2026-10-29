// Política de conteúdo: o navegador só carrega imagens, vídeos e conexões do
// próprio site e do Supabase do projeto. Scripts só rodam com o nonce sorteado
// a cada página ('strict-dynamic' libera os que esses scripts carregarem):
// um script injetado por um invasor não tem o nonce e é bloqueado.
// Estilos continuam com 'unsafe-inline' porque o React grava style="..." nos
// elementos (órbitas da página inicial, espaçamentos); estilo não executa código.
// Em desenvolvimento, o Next precisa de eval e do WebSocket do hot reload.
export function contentSecurityPolicy(nonce: string, isDevelopment: boolean) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseWs = supabaseUrl.replace(/^https:/, "wss:");
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabaseUrl}`,
    `media-src 'self' blob: ${supabaseUrl}`,
    `connect-src 'self' ${supabaseUrl} ${supabaseWs}${isDevelopment ? " ws:" : ""}`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function createNonce() {
  return btoa(crypto.randomUUID());
}
