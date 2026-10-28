import Link from "next/link";
import { notFound } from "next/navigation";
import { InternalShell } from "../../interno/internal-shell";
import styles from "../../interno/internal.module.css";

const demoCreators = [
  {
    name: "Marina Costa",
    network: "Instagram · 18,4 mil",
    status: "Em análise",
  },
  {
    name: "Rafael Lima",
    network: "TikTok · 42 mil",
    status: "Aguardando triagem",
  },
  {
    name: "Bia Nunes",
    network: "Instagram · 7,2 mil",
    status: "Correção solicitada",
  },
  {
    name: "Lucas Prado",
    network: "YouTube · 31 mil",
    status: "Aguardando validação",
  },
];

const demoMetrics = [
  ["Cadastros", "128"],
  ["Aguardando triagem", "16"],
  ["Em validação", "9"],
  ["Correções pendentes", "7"],
  ["Elegíveis", "54"],
];

export default async function TeamDashboardPreview() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <InternalShell
      active="painel"
      isAdmin
      roles={["Administrador", "Recrutamento", "Validação"]}
      email="equipe.demo@vyrex.local"
    >
      <section className={styles.main}>
        <header className={styles.pageHeader}>
          <div>
            <h1>Visão geral</h1>
          </div>
        </header>
        <div className={styles.summary}>
          {demoMetrics.map(([label, value]) => (
            <article className={styles.metric} key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
        <form className={styles.filters}>
          <label>
            <span>Buscar criador</span>
            <input placeholder="Nome público" disabled />
          </label>
          <label>
            <span>Status</span>
            <select defaultValue="all" disabled>
              <option value="all">Todos os status</option>
            </select>
          </label>
          <button type="button" disabled>
            Aplicar filtros
          </button>
        </form>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Criador</th>
                <th>Rede declarada</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {demoCreators.map((creator) => (
                <tr key={creator.name}>
                  <td>
                    <strong>{creator.name}</strong>
                  </td>
                  <td>{creator.network}</td>
                  <td>
                    <span className={styles.status}>{creator.status}</span>
                  </td>
                  <td>
                    <Link href="/preview/criador">Abrir cadastro</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className={styles.pagination}>
          <span>4 registros fictícios</span>
          <Link href="/preview/criador">Ver painel do criador</Link>
        </footer>
      </section>
    </InternalShell>
  );
}
