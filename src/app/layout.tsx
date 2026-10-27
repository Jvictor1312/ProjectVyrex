import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
