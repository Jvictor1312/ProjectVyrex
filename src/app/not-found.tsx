import type { Metadata } from "next";
import Link from "next/link";
import styles from "./status-page.module.css";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <main className={styles.page}>
      <p className={styles.code}>ERRO 404</p>
      <h1>Página não encontrada</h1>
      <p>
        O endereço pode ter mudado ou não existe. Volte ao início ou acesse sua
        conta.
      </p>
      <div className={styles.actions}>
        <Link className="button button-dark" href="/">
          Ir para o início
        </Link>
        <Link className="button" href="/login">
          Entrar
        </Link>
      </div>
    </main>
  );
}
