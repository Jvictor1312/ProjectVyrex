// Agrupa o histórico administrativo: alterações feitas no mesmo alvo (a mesma
// pessoa, ou os critérios) com até 10 minutos entre uma e outra viram
// subalterações da primeira. Assim uma sequência de ajustes aparece como um
// item só, que pode ser aberto para ver cada passo.

export const auditGroupWindowMs = 10 * 60 * 1000;

export type AuditItem = {
  id: string;
  target: string;
  createdAt: string;
};

export type AuditGroup<T extends AuditItem> = {
  primary: T;
  // Alterações seguintes, da mais antiga para a mais recente.
  children: T[];
  lastAt: string;
};

// Recebe os registros em qualquer ordem e devolve os grupos do mais recente
// para o mais antigo.
export function groupAuditEntries<T extends AuditItem>(
  entries: readonly T[],
  windowMs = auditGroupWindowMs,
): AuditGroup<T>[] {
  const ascending = [...entries].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
  const groups: AuditGroup<T>[] = [];
  const openByTarget = new Map<string, AuditGroup<T>>();

  for (const entry of ascending) {
    const open = openByTarget.get(entry.target);
    if (open && Date.parse(entry.createdAt) - Date.parse(open.lastAt) <= windowMs) {
      open.children.push(entry);
      open.lastAt = entry.createdAt;
      continue;
    }
    const group = { primary: entry, children: [], lastAt: entry.createdAt };
    groups.push(group);
    openByTarget.set(entry.target, group);
  }

  return groups.sort((a, b) => Date.parse(b.lastAt) - Date.parse(a.lastAt));
}
