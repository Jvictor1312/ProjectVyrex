import type { Metadata } from "next";
import Link from "next/link";
import styles from "../status-page.module.css";

export const metadata: Metadata = { title: "Acesso negado" };

export default function AccessDeniedPage() {
  return (
    <main className={styles.page}>
      <p className={styles.code}>ERRO 403</p>
      <h1>Você não tem acesso a esta área</h1>
      <p>
        Sua conta não tem permissão para abrir esta página. Se você faz parte
        da equipe e acredita que isso é um engano, peça a um administrador para
        revisar suas funções.
      </p>
      <div className={styles.actions}>
        <Link className="button button-dark" href="/dashboard">
          Ir para a minha conta
        </Link>
        <Link className="button" href="/">
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
