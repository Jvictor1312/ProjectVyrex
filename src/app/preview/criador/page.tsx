import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../dashboard/dashboard.module.css";

const demoMessages = [
  "Recebemos seu cadastro e a equipe está conferindo as informações enviadas.",
  "As métricas informadas serão verificadas manualmente.",
];

export default function CreatorDashboardPreview() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="brand" href="/">
          <span className="brand-mark">V</span>
          <span>VYREX</span>
        </Link>
        <Link className="quiet-button" href="/login">
          Entrar na conta
        </Link>
      </header>
      <section className="dashboard-content">
        <p className={styles.demoNotice} role="note">
          DEMONSTRAÇÃO LOCAL. Perfil, mensagens e números abaixo são fictícios;
          esta visualização não grava nem altera dados.
        </p>
        <p className="eyebrow">
          <span /> ÁREA DO CRIADOR
        </p>
        <h1>Olá, Marina.</h1>
        <p className="dashboard-email">
          marina.demo@vyrex.local · perfil fictício
        </p>
        <div className="status-panel">
          <div>
            <span className="status-kicker">STATUS DO CADASTRO</span>
            <h2>Correção solicitada</h2>
          </div>
          <span className="status-dot status-rejected" aria-hidden="true" />
        </div>
        <p className={styles.statusDescription}>
          A equipe pediu um ajuste em uma das evidências. Atualize o arquivo
          indicado para continuar a análise.
        </p>
        <div className="dashboard-next">
          <span className="principle-number">PRÓXIMO PASSO</span>
          <h2>Revise sua evidência 03</h2>
          <p>
            A imagem enviada não mostra a métrica completa. Envie uma captura
            legível para que a equipe possa concluir a análise.
          </p>
          <Link className="button button-dark" href="/login">
            Entrar para atualizar <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className={styles.activityGrid}>
          <section className={styles.activitySection}>
            <h2>Mensagens da equipe</h2>
            {demoMessages.map((message) => (
              <article className={styles.activityItem} key={message}>
                <p>{message}</p>
                <time>Exemplo demonstrativo</time>
              </article>
            ))}
          </section>
          <section className={styles.activitySection}>
            <h2>Seu progresso</h2>
            <article className={styles.activityItem}>
              <strong>Perfil e rede social</strong>
              <p>Concluídos no exemplo</p>
            </article>
            <article className={styles.activityItem}>
              <strong>Evidências</strong>
              <p>4 de 5 analisadas no exemplo</p>
            </article>
          </section>
        </div>
        <p className="dashboard-disclaimer">
          Aprovação representa elegibilidade para oportunidades futuras, não
          promessa de campanha, contratação ou pagamento.
        </p>
      </section>
    </main>
  );
}
