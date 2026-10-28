import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "Vyrex | Sua presença, novas possibilidades",
    template: "%s | Vyrex",
  },
  description:
    "A VYREX aproxima marcas e criadores com estratégia de marketing de influência, tecnologia própria e gestão de campanhas.",
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
