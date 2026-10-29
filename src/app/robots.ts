import type { MetadataRoute } from "next";

// Buscadores só indexam as páginas públicas. As áreas com login, as prévias e
// os retornos de autenticação ficam de fora (também levam X-Robots-Tag no
// next.config.ts).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/interno", "/preview", "/auth", "/redefinir-senha", "/acesso-negado"],
    },
  };
}
