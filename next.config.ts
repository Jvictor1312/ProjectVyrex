import type { NextConfig } from "next";

// A política de conteúdo (CSP) com nonce é montada a cada página em
// src/proxy.ts (src/lib/security/csp.ts).
const securityHeaders = [
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
