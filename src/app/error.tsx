"use client";

import Link from "next/link";
import styles from "./status-page.module.css";

export default function GlobalRouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Detalhes técnicos não são exibidos ao usuário; o servidor mantém os registros.
  return (
    <main className={styles.page} role="alert">
      <p className={styles.code}>ERRO INESPERADO</p>
      <h1>Não foi possível concluir a operação</h1>
      <p>
        Ocorreu um problema ao carregar esta página. Tente novamente; se
        persistir, volte mais tarde ou fale com a equipe Vyrex.
      </p>
      <div className={styles.actions}>
        <button className="button button-dark" type="button" onClick={reset}>
          Tentar novamente
        </button>
        <Link className="button" href="/">
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
