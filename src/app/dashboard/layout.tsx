import type { ReactNode } from "react";
import { CreatorShell } from "./creator-shell";

// Moldura da área do criador (logo, menu e Sair) montada uma vez: ao trocar
// de página, o menu continua na tela e só o conteúdo muda; enquanto a página
// nova carrega, loading.tsx aparece dentro da moldura. A conferência de login
// continua em cada página (o layout não roda de novo a cada navegação).
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <CreatorShell>{children}</CreatorShell>;
}
