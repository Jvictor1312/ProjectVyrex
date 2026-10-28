import { internalRoleKeys, roleDescriptions, roleLabels, type InternalRole } from "@/lib/labels";
import styles from "./team.module.css";
import { EmptyState, Notice, Panel } from "./ui";

// Blocos da gestão de colaboradores que não precisam de interação.

export function RoleLegend({ counts }: { counts: Record<InternalRole, number> }) {
  return (
    <Panel
      title="Funções e permissões"
      description="Uma pessoa pode acumular funções. O acesso de cada uma é conferido no servidor e no banco de dados."
      flush
    >
      <dl className={styles.roleLegend}>
        {internalRoleKeys.map((key) => (
          <div key={key}>
            <dt>
              {roleLabels[key]}
              <span>
                {counts[key]} {counts[key] === 1 ? "pessoa" : "pessoas"}
              </span>
            </dt>
            <dd>{roleDescriptions[key]}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

export type AuditEntry = {
  id: string;
  action: string;
  details: string | null;
  actor: string;
  createdAt: string;
};

export function AuditTable({
  entries,
  loadError,
}: {
  entries: AuditEntry[];
  loadError: boolean;
}) {
  return (
    <Panel
      title="Histórico administrativo"
      description="As 30 ações mais recentes: convites, mudanças de função e de acesso, critérios."
      flush
    >
      {loadError ? (
        <div style={{ padding: 16 }}>
          <Notice tone="danger" role="alert">
            Não foi possível carregar o histórico agora. Atualize a página para
            tentar de novo.
          </Notice>
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          title="Nenhuma ação registrada ainda"
          text="Convites, mudanças de função e desativações aparecem aqui assim que acontecerem."
        />
      ) : (
        <table className={`${styles.table} ${styles.auditTable}`}>
          <thead>
            <tr>
              <th scope="col">Ação</th>
              <th scope="col">Detalhes</th>
              <th scope="col">Responsável</th>
              <th scope="col">Data</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td data-label="Ação">{entry.action}</td>
                <td data-label="Detalhes">
                  <span className={styles.muted}>{entry.details ?? "—"}</span>
                </td>
                <td data-label="Responsável">{entry.actor}</td>
                <td data-label="Data">
                  <span className={styles.date}>
                    {new Date(entry.createdAt).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
