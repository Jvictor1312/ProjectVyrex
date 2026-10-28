"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./creator-nav.module.css";

// Ícones só aparecem no celular, onde o menu vira uma barra fixa embaixo.
const icons = {
  home: <path d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" />,
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5" />
    </>
  ),
  messages: <path d="M4 5h16v11H9l-5 4z" />,
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
};

const items = [
  { href: "/dashboard", label: "Visão geral", icon: icons.home },
  { href: "/dashboard/perfil", label: "Meu cadastro", icon: icons.profile },
  { href: "/dashboard/mensagens", label: "Mensagens", icon: icons.messages },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: icons.settings },
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
                <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
                  {item.icon}
                </svg>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
