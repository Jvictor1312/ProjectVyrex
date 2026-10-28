"use client";

import {
  type ReactNode,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Avatar, Badge, EmptyState, Notice, PageHeader, Stats } from "@/app/interno/ui";
import ui from "@/app/interno/ui.module.css";
import styles from "@/app/interno/team.module.css";
import { internalRoleKeys, roleLabels, type InternalRole } from "@/lib/labels";
import {
  InviteInternalUserForm,
  MemberRolesForm,
  MemberStatusForm,
} from "./team-management";

export type TeamMember = {
  id: string;
  name: string;
  email: string | null;
  roles: InternalRole[];
  active: boolean;
  createdAt: string;
  deactivatedAt: string | null;
  deactivationReason: string | null;
  lastSignInAt: string | null;
  isCurrentUser: boolean;
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const formatDate = (value: string | null) =>
  value ? dateFormat.format(new Date(value)).replace(".", "") : "—";

// Busca sem diferenciar maiúsculas nem acentos ("joao" encontra "João").
const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Dialog({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // A janela nativa já prende o foco dentro dela e fecha com Esc.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(event) => {
        // Clique fora da janela (no fundo escurecido) fecha.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open && children}
    </dialog>
  );
}

export function TeamDirectory({
  members,
  inviteConfigured,
  emailsAvailable,
  loadError,
}: {
  members: TeamMember[];
  inviteConfigured: boolean;
  emailsAvailable: boolean;
  loadError: boolean;
}) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<InternalRole | "all">("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [inviting, setInviting] = useState(false);
  const [managingId, setManagingId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const needle = normalize(deferredQuery.trim());
    return members.filter(
      (member) =>
        (role === "all" || member.roles.includes(role)) &&
        (status === "all" || (status === "active") === member.active) &&
        (!needle ||
          normalize(member.name).includes(needle) ||
          normalize(member.email ?? "").includes(needle)),
    );
  }, [members, deferredQuery, role, status]);

  const activeCount = members.filter((member) => member.active).length;
  const adminCount = members.filter((member) => member.roles.includes("admin")).length;
  const hasFilters = query !== "" || role !== "all" || status !== "all";
  const managing = members.find((member) => member.id === managingId) ?? null;

  function clearFilters() {
    setQuery("");
    setRole("all");
    setStatus("all");
  }

  return (
    <>
      <PageHeader
        title="Gestão de colaboradores"
        description="Quem trabalha na operação da Vyrex, com as funções de cada pessoa e a situação do acesso."
        actions={
          <button
            className={`${ui.button} ${ui.primary}`}
            type="button"
            onClick={() => setInviting(true)}
          >
            Cadastrar colaborador
          </button>
        }
      />

      <Stats
        label="Resumo da equipe"
        items={[
          { label: "Colaboradores", value: members.length.toLocaleString("pt-BR") },
          { label: "Com acesso ativo", value: activeCount.toLocaleString("pt-BR") },
          {
            label: "Desativados",
            value: (members.length - activeCount).toLocaleString("pt-BR"),
          },
          { label: "Administradores", value: adminCount.toLocaleString("pt-BR") },
        ]}
      />

      {loadError && (
        <div style={{ marginTop: 16 }}>
          <Notice tone="danger" role="alert">
            Não foi possível carregar a lista de colaboradores. Atualize a página;
            se o erro continuar, verifique a conexão com o banco de dados.
          </Notice>
        </div>
      )}

      <section className={ui.panel} aria-label="Lista de colaboradores">
        <div className={styles.toolbar} role="search">
          <label className={`${ui.field} ${styles.search}`}>
            <span>Buscar</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={emailsAvailable ? "Nome ou e-mail" : "Nome"}
              maxLength={80}
            />
          </label>
          <label className={ui.field}>
            <span>Função</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as InternalRole | "all")}
            >
              <option value="all">Todas as funções</option>
              {internalRoleKeys.map((key) => (
                <option value={key} key={key}>
                  {roleLabels[key]}
                </option>
              ))}
            </select>
          </label>
          <label className={ui.field}>
            <span>Situação</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "all" | "active" | "inactive")
              }
            >
              <option value="all">Todas</option>
              <option value="active">Acesso ativo</option>
              <option value="inactive">Desativados</option>
            </select>
          </label>
          {hasFilters && (
            <button className={`${ui.button} ${ui.ghost}`} type="button" onClick={clearFilters}>
              Limpar filtros
            </button>
          )}
          <span className={styles.resultCount} aria-live="polite">
            {filtered.length === members.length
              ? `${members.length} ${members.length === 1 ? "pessoa" : "pessoas"}`
              : `${filtered.length} de ${members.length}`}
          </span>
        </div>

        {!emailsAvailable && members.length > 0 && (
          <div style={{ padding: "12px 16px 0" }}>
            <Notice tone="warning">
              E-mails e último acesso aparecem quando a chave de serviço do
              Supabase estiver configurada no servidor.
            </Notice>
          </div>
        )}

        {members.length === 0 && !loadError ? (
          <EmptyState
            title="Nenhum colaborador cadastrado"
            text="Use “Cadastrar colaborador” para convidar a primeira pessoa da equipe e definir a função dela."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhum colaborador com esses filtros"
            text={
              <>
                Ajuste a busca ou{" "}
                <button
                  className={`${ui.button} ${ui.ghost} ${ui.small}`}
                  type="button"
                  onClick={clearFilters}
                >
                  limpe os filtros
                </button>{" "}
                para ver toda a equipe.
              </>
            }
          />
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Colaborador</th>
                <th scope="col">Funções</th>
                <th scope="col">Situação</th>
                <th scope="col">Na equipe desde</th>
                {emailsAvailable && <th scope="col">Último acesso</th>}
                <th scope="col">
                  <span className={ui.srOnly}>Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id}>
                  <td data-label="Colaborador">
                    <div className={styles.person}>
                      <Avatar name={member.name} muted={!member.active} />
                      <div>
                        <span className={styles.personName}>
                          {member.name}
                          {member.isCurrentUser && <span className={styles.you}>Você</span>}
                        </span>
                        {member.email && (
                          <span className={styles.personEmail} title={member.email}>
                            {member.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td data-label="Funções">
                    <div className={styles.roles}>
                      {member.roles.map((key) => (
                        <Badge plain key={key}>
                          {roleLabels[key]}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td data-label="Situação">
                    {member.active ? (
                      <Badge tone="success">Acesso ativo</Badge>
                    ) : (
                      <Badge tone="danger">Desativado</Badge>
                    )}
                  </td>
                  <td data-label="Na equipe desde">
                    <span className={styles.date}>{formatDate(member.createdAt)}</span>
                  </td>
                  {emailsAvailable && (
                    <td data-label="Último acesso">
                      <span className={styles.date}>
                        {member.lastSignInAt ? formatDate(member.lastSignInAt) : "Nunca entrou"}
                      </span>
                    </td>
                  )}
                  <td className={styles.actionsCell}>
                    <button
                      className={`${ui.button} ${ui.small}`}
                      type="button"
                      onClick={() => setManagingId(member.id)}
                      aria-label={`Gerenciar ${member.name}`}
                    >
                      Gerenciar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Dialog open={inviting} onClose={() => setInviting(false)} labelledBy="invite-title">
        <div className={styles.dialogHeader}>
          <div>
            <h2 id="invite-title">Cadastrar colaborador</h2>
            <p>A pessoa recebe um convite por e-mail e entra com a função escolhida.</p>
          </div>
          <button
            className={styles.closeButton}
            type="button"
            onClick={() => setInviting(false)}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className={styles.dialogSection}>
          <InviteInternalUserForm
            configured={inviteConfigured}
            onDone={() => setInviting(false)}
          />
        </div>
      </Dialog>

      <Dialog
        open={managing !== null}
        onClose={() => setManagingId(null)}
        labelledBy="manage-title"
      >
        {managing && (
          <>
            <div className={styles.dialogHeader}>
              <div className={styles.person}>
                <Avatar name={managing.name} muted={!managing.active} />
                <div>
                  <h2 id="manage-title">{managing.name}</h2>
                  <p>{managing.email ?? "E-mail disponível com a chave de serviço"}</p>
                </div>
              </div>
              <button
                className={styles.closeButton}
                type="button"
                onClick={() => setManagingId(null)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className={styles.dialogBody}>
              <section className={styles.dialogSection}>
                <dl className={styles.facts}>
                  <div>
                    <dt>Situação</dt>
                    <dd>
                      {managing.active ? (
                        <Badge tone="success">Acesso ativo</Badge>
                      ) : (
                        <Badge tone="danger">Desativado</Badge>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Na equipe desde</dt>
                    <dd>{formatDate(managing.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Último acesso</dt>
                    <dd>
                      {emailsAvailable
                        ? managing.lastSignInAt
                          ? formatDate(managing.lastSignInAt)
                          : "Nunca entrou"
                        : "Indisponível"}
                    </dd>
                  </div>
                </dl>
                {!managing.active && managing.deactivationReason && (
                  <p className={styles.hint}>
                    Desativado em {formatDate(managing.deactivatedAt)}. Motivo:{" "}
                    {managing.deactivationReason}
                  </p>
                )}
              </section>
              <section className={styles.dialogSection} aria-labelledby="roles-title">
                <h3 id="roles-title">Funções</h3>
                <MemberRolesForm
                  userId={managing.id}
                  current={managing.roles}
                  isSelf={managing.isCurrentUser}
                />
              </section>
              <section className={styles.dialogSection} aria-labelledby="status-title">
                <h3 id="status-title">Acesso à plataforma</h3>
                <MemberStatusForm
                  userId={managing.id}
                  name={managing.name}
                  active={managing.active}
                  isSelf={managing.isCurrentUser}
                />
              </section>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}
