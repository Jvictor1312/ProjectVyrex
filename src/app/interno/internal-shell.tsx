import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import { VyrexLogo } from "@/app/components/vyrex-logo";
import styles from "./internal.module.css";
import { ThemeToggle } from "./theme-toggle";
import { Avatar } from "./ui";

type Section = "painel" | "equipe" | "criterios" | "privacidade";

type NavLink = { key: Section; href: string; label: string };

// Operação é para toda a equipe; Administração só aparece para administradores.
const operationLinks: NavLink[] = [
  { key: "painel", href: "/interno", label: "Visão geral" },
];
const adminLinks: NavLink[] = [
  { key: "equipe", href: "/interno/equipe", label: "Colaboradores" },
  { key: "criterios", href: "/interno/configuracoes", label: "Configurações" },
  { key: "privacidade", href: "/interno/privacidade", label: "Pedidos de privacidade" },
];

function NavGroup({
  title,
  links,
  active,
}: {
  title: string;
  links: NavLink[];
  active: Section | null;
}) {
  return (
    <div className={styles.sideGroup}>
      <p className={styles.sideHeading}>{title}</p>
      {links.map((link) => (
        <Link
          key={link.key}
          className={active === link.key ? styles.sideLinkActive : styles.sideLink}
          aria-current={active === link.key ? "page" : undefined}
          href={link.href}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

// Layout único da área da equipe: logo, menu lateral, tema claro/escuro e saída.
export async function InternalShell({
  active,
  isAdmin,
  roles = [],
  email,
  name,
  logoutHref,
  children,
}: {
  active: Section | null;
  isAdmin: boolean;
  roles?: string[];
  email?: string | null;
  // Nome de quem está logado (user_metadata.full_name); sem ele, usa o e-mail.
  name?: string | null;
  // Nas prévias não há sessão: o botão vira um link para o login.
  logoutHref?: string;
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const theme =
    cookieStore.get("vyrex-internal-theme")?.value === "dark" ? "dark" : "light";
  const who = name?.trim() || email || "Conta da equipe";
  const avatarName = name?.trim() || who.split("@")[0].replace(/[._+-]+/g, " ");

  return (
    <main className={styles.shell} data-theme={theme}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/interno">
          <VyrexLogo className={styles.brandLogo} />
          <span className={styles.brandTag}>Equipe</span>
        </Link>
        <nav className={styles.sideNav} aria-label="Área da equipe">
          <NavGroup title="Operação" links={operationLinks} active={active} />
          {isAdmin && (
            <NavGroup title="Administração" links={adminLinks} active={active} />
          )}
        </nav>
        <div className={styles.sideFooter}>
          <div className={styles.sideUserBlock}>
            <Avatar name={avatarName} />
            <div>
              <span className={styles.sideUser} title={email ?? who}>
                {who}
              </span>
              {roles.length > 0 && (
                <span className={styles.sideRoles} title={roles.join(", ")}>
                  {roles.join(" · ")}
                </span>
              )}
            </div>
          </div>
          <div className={styles.sideActions}>
            <ThemeToggle initial={theme} />
            {logoutHref ? (
              <Link className={styles.logoutLink} href={logoutHref}>
                Sair
              </Link>
            ) : (
              <form action={logoutAction} className={styles.logoutForm}>
                <button type="submit">Sair</button>
              </form>
            )}
          </div>
        </div>
      </aside>
      {children}
    </main>
  );
}
