import Link from "next/link";
import {
  creatorStatusKeys,
  creatorStatusLabel,
  creatorStatusLabels,
  creatorStatusTone,
} from "@/lib/labels";
import styles from "./internal.module.css";
import { Badge, EmptyState, Notice, ui } from "./ui";

// Lista de cadastros de criadores com busca, filtro de situação e paginação.
// Usada pela visão geral real e pela prévia, para as duas ficarem iguais.

export type QueueRow = {
  id: string;
  name: string;
  status: string;
  submittedAt: string | null;
  updatedAt: string;
  href: string;
};

const shortDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("pt-BR") : "—";

export function CreatorQueue({
  rows,
  total,
  search,
  status,
  statusOptions = [...creatorStatusKeys],
  page,
  totalPages,
  pageHref,
  loadError,
  title,
}: {
  rows: QueueRow[];
  total: number | null;
  search: string;
  status: string;
  statusOptions?: string[];
  page: number;
  totalPages: number;
  pageHref: (page: number) => string;
  loadError: boolean;
  title: string;
}) {
  const filtered = search !== "" || status !== "all";

  return (
    <section className={ui.panel} aria-label={title}>
      <div className={ui.panelHeader}>
        <div>
          <h2>{title}</h2>
          <p>
            {total === null
              ? "Contagem indisponível"
              : `${total.toLocaleString("pt-BR")} ${total === 1 ? "cadastro" : "cadastros"}${filtered ? " com os filtros atuais" : ""}`}
          </p>
        </div>
      </div>

      <form className={styles.queueFilters} method="get" role="search">
        <label className={ui.field}>
          <span>Buscar criador</span>
          <input
            name="q"
            type="search"
            maxLength={80}
            defaultValue={search}
            placeholder="Nome público"
          />
        </label>
        <label className={ui.field}>
          <span>Situação</span>
          <select name="status" defaultValue={status}>
            <option value="all">Todas as situações</option>
            {statusOptions.map((key) => (
              <option value={key} key={key}>
                {creatorStatusLabels[key as keyof typeof creatorStatusLabels] ?? key}
              </option>
            ))}
          </select>
        </label>
        <button className={`${ui.button} ${ui.primary}`} type="submit">
          Filtrar
        </button>
        {filtered && (
          <Link className={`${ui.button} ${ui.ghost}`} href="?">
            Limpar filtros
          </Link>
        )}
      </form>

      {loadError && (
        <div className={styles.queueNotice}>
          <Notice tone="danger" role="alert">
            Não foi possível carregar os cadastros agora. Atualize a página; se
            o erro continuar, verifique a conexão com o banco de dados.
          </Notice>
        </div>
      )}

      {!loadError && rows.length === 0 ? (
        <EmptyState
          title={filtered ? "Nenhum cadastro com esses filtros" : "Nenhum cadastro por aqui"}
          text={
            filtered
              ? "Ajuste a busca ou escolha outra situação para ver mais cadastros."
              : "Quando um criador enviar o cadastro para a sua fila, ele aparece nesta lista."
          }
        />
      ) : (
        rows.length > 0 && (
          <div className={styles.queueTable}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Criador</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Enviado em</th>
                  <th scope="col">Última atualização</th>
                  <th scope="col">
                    <span className={ui.srOnly}>Ação</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Criador">
                      <strong>{row.name}</strong>
                    </td>
                    <td data-label="Situação">
                      <Badge tone={creatorStatusTone(row.status)}>
                        {creatorStatusLabel(row.status)}
                      </Badge>
                    </td>
                    <td data-label="Enviado em">{shortDate(row.submittedAt)}</td>
                    <td data-label="Última atualização">{shortDate(row.updatedAt)}</td>
                    <td className={styles.rowAction}>
                      <Link href={row.href} aria-label={`Abrir ficha de ${row.name}`}>
                        Abrir ficha
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {totalPages > 1 && (
        <footer className={styles.pagination}>
          <span>
            Página {page} de {totalPages}
          </span>
          <div>
            <Link aria-disabled={page <= 1} href={pageHref(Math.max(1, page - 1))}>
              Anterior
            </Link>
            <Link
              aria-disabled={page >= totalPages}
              href={pageHref(Math.min(totalPages, page + 1))}
            >
              Próxima
            </Link>
          </div>
        </footer>
      )}
    </section>
  );
}
