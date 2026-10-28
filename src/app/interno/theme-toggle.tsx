"use client";

import { useState } from "react";
import styles from "./internal.module.css";

export const internalThemeCookie = "vyrex-internal-theme";

// Alterna o tema só da área da equipe. A escolha fica num cookie para o
// servidor já entregar a página no tema certo, sem piscar.
export function ThemeToggle({ initial }: { initial: "light" | "dark" }) {
  const [theme, setTheme] = useState(initial);
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      className={styles.themeToggle}
      type="button"
      aria-pressed={theme === "dark"}
      onClick={(event) => {
        document.cookie = `${internalThemeCookie}=${next}; path=/; max-age=31536000; samesite=lax`;
        const shell = event.currentTarget.closest("[data-theme]");
        if (shell instanceof HTMLElement) shell.dataset.theme = next;
        setTheme(next);
      }}
    >
      <span className={styles.themeIcon} aria-hidden="true">
        {theme === "dark" ? "☀" : "☾"}
      </span>
      {theme === "dark" ? "Modo claro" : "Modo escuro"}
    </button>
  );
}
