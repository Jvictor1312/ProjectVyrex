import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseWs = supabaseUrl.replace(/^https:/, "wss:");

// Política de conteúdo: o navegador só carrega scripts, imagens, vídeos e
// conexões do próprio site e do Supabase do projeto. Isso limita o estrago de
// uma eventual injeção de código. Em desenvolvimento, o Next precisa de eval.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
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

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Impede que outro site mostre o Vyrex dentro de uma moldura (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // O navegador não "adivinha" o tipo dos arquivos.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Outros sites não recebem o endereço completo das páginas internas.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Recursos do aparelho que o site não usa ficam bloqueados.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Força HTTPS por dois anos depois da primeira visita (só vale em HTTPS).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // O servidor de testes (porta 3001, banco de testes) usa outra pasta de
  // build para rodar ao lado do servidor normal (veja scripts/dev-test.ps1).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    // Áreas com login e prévias: nunca indexadas por buscadores.
    const noIndex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/dashboard/:path*", headers: noIndex },
      { source: "/dashboard", headers: noIndex },
      { source: "/interno/:path*", headers: noIndex },
      { source: "/interno", headers: noIndex },
      { source: "/preview/:path*", headers: noIndex },
      { source: "/auth/:path*", headers: noIndex },
      { source: "/redefinir-senha", headers: noIndex },
    ];
  },
};

export default nextConfig;
