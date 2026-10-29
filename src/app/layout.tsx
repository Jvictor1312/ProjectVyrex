import type { Metadata, Viewport } from "next";
import { Figtree, Gelasio } from "next/font/google";
import "./globals.css";

// Fontes servidas pelo próprio site (aparecem iguais em qualquer aparelho).
// Figtree: texto e marca. Gelasio: substituta da Georgia, com as mesmas
// medidas, para aparelhos sem Georgia (Android, Linux); só é baixada se usada.
const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const serif = Gelasio({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  preload: false,
});

const description =
  "Agência de marketing de influência. Crie seu perfil de criador, envie os resultados dos seus Stories e, depois da análise da equipe, faça parte da base de criadores considerada nas campanhas da Vyrex.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Vyrex | Marketing de influência para criadores e marcas",
    template: "%s | Vyrex",
  },
  description,
  applicationName: "Vyrex",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Vyrex",
    title: "Vyrex | Marketing de influência para criadores e marcas",
    description,
  },
};

// Celular: a página ocupa a tela toda (inclusive ao redor do "risco" do
// iPhone, compensado com safe-area no CSS) e a barra do navegador fica na cor
// do site. O zoom com os dedos continua liberado (acessibilidade).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f5f3",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${sans.variable} ${serif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
