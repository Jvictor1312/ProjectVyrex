import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import { CreatorNav } from "@/app/components/creator-nav";

// Layout único da área do criador: marca, saída e menu iguais em todas as telas.
export function CreatorShell({ children }: { children: ReactNode }) {
  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">V</span>
          <span>VYREX</span>
        </Link>
        <form action={logoutAction}>
          <button className="quiet-button" type="submit">
            Sair
          </button>
        </form>
      </header>
      <CreatorNav />
      {children}
    </main>
  );
}
