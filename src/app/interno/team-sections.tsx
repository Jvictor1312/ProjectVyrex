import { internalRoleKeys, roleDescriptions, roleLabels, type InternalRole } from "@/lib/labels";
import { groupAuditEntries } from "@/lib/audit-groups";
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
  // Em quem a alteração foi feita: chave para agrupar e nome para mostrar.
  target: string;
  targetName: string;
  createdAt: string;
};

function auditTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  return (
    <span className={styles.auditRow}>
      <span className={styles.auditMain}>
        <strong>{entry.action}</strong>
        <span className={styles.muted}>
          {entry.targetName}
          {entry.details ? ` · ${entry.details}` : ""}
        </span>
      </span>
      <span className={styles.auditMeta}>
        <span>{entry.actor}</span>
        <time dateTime={entry.createdAt}>{auditTime(entry.createdAt)}</time>
      </span>
    </span>
  );
}

// Histórico administrativo, sempre recolhido: só abre quando for preciso.
// Alterações no mesmo alvo com até 10 minutos entre elas aparecem como
// subalterações da primeira (veja groupAuditEntries).
export function AuditHistory({
  title = "Histórico administrativo",
  entries,
  loadError,
  emptyText = "Convites, mudanças de função e desativações aparecem aqui assim que acontecerem.",
}: {
  title?: string;
  entries: AuditEntry[];
  loadError: boolean;
  emptyText?: string;
}) {
  const groups = groupAuditEntries(entries);
  const latest = groups[0]?.lastAt;
  return (
    <details className={styles.auditPanel}>
      <summary>
        <span className={styles.auditTitle}>
          <strong>{title}</strong>
          <small>
            {loadError
              ? "Não foi possível carregar"
              : entries.length === 0
                ? "Nenhuma alteração registrada"
                : `${groups.length} ${groups.length === 1 ? "alteração" : "alterações"} (${entries.length} no total) · última em ${auditTime(latest!)}`}
          </small>
        </span>
        <span className={styles.auditToggle} aria-hidden="true" />
      </summary>
      {loadError ? (
        <div style={{ padding: 16 }}>
          <Notice tone="danger" role="alert">
            Não foi possível carregar o histórico agora. Atualize a página para
            tentar de novo.
          </Notice>
        </div>
      ) : entries.length === 0 ? (
        <EmptyState title="Nenhuma alteração registrada ainda" text={emptyText} />
      ) : (
        <ol className={styles.auditList}>
          {groups.map((group) => (
            <li key={group.primary.id}>
              {group.children.length === 0 ? (
                <AuditRow entry={group.primary} />
              ) : (
                <details className={styles.auditGroup}>
                  <summary>
                    <AuditRow entry={group.primary} />
                    <span className={styles.auditMore}>
                      + {group.children.length}{" "}
                      {group.children.length === 1
                        ? "alteração em seguida"
                        : "alterações em seguida"}
                    </span>
                  </summary>
                  <ol className={styles.auditChildren}>
                    {group.children.map((child) => (
                      <li key={child.id}>
                        <AuditRow entry={child} />
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}