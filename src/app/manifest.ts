import type { MetadataRoute } from "next";

// Permite "Adicionar à tela inicial" no celular: o site abre como aplicativo,
// em tela cheia, com o ícone da Vyrex.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vyrex",
    short_name: "Vyrex",
    description: "Cadastro e acompanhamento de criadores da Vyrex.",
    lang: "pt-BR",
    start_url: "/login",
    display: "standalone",
    background_color: "#f5f5f3",
    theme_color: "#f5f5f3",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
