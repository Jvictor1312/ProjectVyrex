import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import styles from "./internal.module.css";
import { ThemeToggle } from "./theme-toggle";

type Section = "painel" | "equipe" | "criterios" | "privacidade";

const links: { key: Section; href: string; label: string; adminOnly: boolean }[] =
  [
    { key: "painel", href: "/interno", label: "Painel", adminOnly: false },
    { key: "equipe", href: "/interno/equipe", label: "Equipe", adminOnly: true },
    {
      key: "criterios",
      href: "/interno/configuracoes",
      label: "Configurações",
      adminOnly: true,
    },
    {
      key: "privacidade",
      href: "/interno/privacidade",
      label: "Privacidade",
      adminOnly: true,
    },
  ];

// Layout único da área da equipe: menu lateral, tema claro/escuro e saída.
export async function InternalShell({
  active,
  isAdmin,
  roles = [],
  email,
  children,
}: {
  active: Section | null;
  isAdmin: boolean;
  roles?: string[];
  email?: string | null;
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const theme =
    cookieStore.get("vyrex-internal-theme")?.value === "dark" ? "dark" : "light";

  return (
    <main className={styles.shell} data-theme={theme}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/interno">
          <span className={styles.brandMark}>V</span>
          <span>VYREX</span>
          <span className={styles.brandTag}>Equipe</span>
        </Link>
        <nav className={styles.sideGroup} aria-label="Área da equipe">
          {links
            .filter((link) => isAdmin || !link.adminOnly)
            .map((link) => (
              <Link
                key={link.key}
                className={
                  active === link.key ? styles.sideLinkActive : styles.sideLink
                }
                aria-current={active === link.key ? "page" : undefined}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          <Link className={styles.sideLink} href="/dashboard">
            Área do criador
          </Link>
        </nav>
        {roles.length > 0 && (
          <div className={styles.sideRoles}>
            {roles.map((role) => (
              <span key={role}>{role}</span>
            ))}
          </div>
        )}
        <div className={styles.sideFooter}>
          <ThemeToggle initial={theme} />
          {email && <span className={styles.sideUser}>{email}</span>}
          <form action={logoutAction} className={styles.logoutForm}>
            <button type="submit">Sair</button>
          </form>
        </div>
      </aside>
      {children}
    </main>
  );
}
