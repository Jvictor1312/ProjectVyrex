"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./creator-nav.module.css";

const items = [
  { href: "/dashboard", label: "Visão geral" },
  { href: "/dashboard/perfil", label: "Meu cadastro" },
  { href: "/dashboard/mensagens", label: "Mensagens" },
  { href: "/dashboard/configuracoes", label: "Configurações" },
];

export function CreatorNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Área do criador">
      <ul>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={active ? styles.active : undefined}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
