"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  inviteInternalUserAction,
  manageInternalRoleAction,
  setInternalUserActiveAction,
  updateEligibilitySettingsAction,
} from "@/app/actions/internal";
import ui from "@/app/interno/ui.module.css";
import styles from "@/app/interno/team.module.css";
import {
  internalRoleKeys,
  roleDescriptions,
  roleLabels,
  type InternalRole,
} from "@/lib/labels";
import type { FormState } from "@/lib/validation/auth";

const emptyState: FormState = { message: "", success: false };

function Feedback({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      className={`${ui.notice} ${state.success ? ui.success : ui.danger}`}
      role="status"
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}

export function InviteInternalUserForm({
  configured,
  onDone,
}: {
  configured: boolean;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(
    inviteInternalUserAction,
    emptyState,
  );
  const [role, setRole] = useState<InternalRole>("recruiter");
  const form = useRef<HTMLFormElement>(null);

  // Convite enviado: o formulário volta ao início para o próximo cadastro.
  useEffect(() => {
    if (state.success) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className={styles.form}>
      {!configured && (
        <p className={`${ui.notice} ${ui.warning}`}>
          O envio de convites ainda não está disponível neste ambiente: falta
          configurar a chave de serviço do Supabase no servidor.
        </p>
      )}
      <fieldset className={styles.fieldset} disabled={!configured || pending}>
        <legend>Dados de acesso</legend>
        <div className={styles.grid2}>
          <label className={ui.field}>
            <span>Nome completo</span>
            <input
              name="fullName"
              required
              minLength={2}
              maxLength={120}
              autoComplete="off"
            />
          </label>
          <label className={ui.field}>
            <span>E-mail</span>
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="off"
            />
            <small>O convite chega neste endereço com o link para criar a senha.</small>
          </label>
        </div>
      </fieldset>
      <fieldset className={styles.fieldset} disabled={!configured || pending}>
        <legend>Função inicial</legend>
        <div className={styles.roleChoices}>
          {internalRoleKeys.map((key) => (
            <label className={styles.roleChoice} key={key}>
              <input
                type="radio"
                name="role"
                value={key}
                checked={role === key}
                onChange={() => setRole(key)}
              />
              <span>
                <strong>{roleLabels[key]}</strong>
                <small>{roleDescriptions[key]}</small>
              </span>
            </label>
          ))}
        </div>
        <p className={styles.hint}>
          Outras funções podem ser somadas depois, em Gerenciar.
        </p>
      </fieldset>
      <Feedback state={state} />
      <div className={styles.formActions}>
        <button
          className={`${ui.button} ${ui.primary}`}
          type="submit"
          disabled={pending || !configured}
        >
          {pending ? "Enviando convite…" : "Enviar convite"}
        </button>
        {onDone && (
          <button
            className={ui.button}
            type="button"
            onClick={onDone}
            disabled={pending}
          >
            {state.success ? "Concluir" : "Cancelar"}
          </button>
        )}
      </div>
    </form>
  );
}

// Funções da pessoa: caixas de marcar. Ao salvar, só as diferenças são
// enviadas, uma por vez, e cada uma fica registrada na auditoria. Depois de
// salvar, a seleção já coincide com as funções que o servidor devolve.
export function MemberRolesForm({
  userId,
  current,
  isSelf,
}: {
  userId: string;
  current: InternalRole[];
  isSelf: boolean;
}) {
  const [selected, setSelected] = useState<Set<InternalRole>>(new Set(current));
  const [result, setResult] = useState<FormState>(emptyState);
  const [pending, startTransition] = useTransition();

  const changes = internalRoleKeys.filter(
    (key) => selected.has(key) !== current.includes(key),
  );
  const noneSelected = selected.size === 0;

  function toggle(key: InternalRole) {
    setResult(emptyState);
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      const failed: string[] = [];
      for (const key of changes) {
        const body = new FormData();
        body.set("targetUser", userId);
        body.set("role", key);
        body.set("enabled", String(selected.has(key)));
        try {
          const response = await manageInternalRoleAction(emptyState, body);
          if (!response.success) failed.push(roleLabels[key]);
        } catch {
          failed.push(roleLabels[key]);
        }
      }
      setResult(
        failed.length
          ? {
              message: `Não foi possível alterar: ${failed.join(", ")}. Confira sua permissão e tente de novo.`,
              success: false,
            }
          : { message: "Funções atualizadas.", success: true },
      );
    });
  }

  return (
    <div className={styles.form}>
      <div className={styles.roleChoices}>
        {internalRoleKeys.map((key) => {
          const lockOwnAdmin = isSelf && key === "admin" && current.includes("admin");
          return (
            <label className={styles.roleChoice} key={key}>
              <input
                type="checkbox"
                checked={selected.has(key)}
                onChange={() => toggle(key)}
                disabled={pending || lockOwnAdmin}
              />
              <span>
                <strong>{roleLabels[key]}</strong>
                <small>
                  {lockOwnAdmin
                    ? "Você não pode remover a sua própria função de administrador."
                    : roleDescriptions[key]}
                </small>
              </span>
            </label>
          );
        })}
      </div>
      {noneSelected && (
        <p className={`${ui.notice} ${ui.warning}`}>
          Mantenha ao menos uma função. Para bloquear o acesso da pessoa, use
          &quot;Desativar conta&quot;.
        </p>
      )}
      <Feedback state={result} />
      <div className={styles.formActions}>
        <button
          className={`${ui.button} ${ui.primary}`}
          type="button"
          onClick={save}
          disabled={pending || changes.length === 0 || noneSelected}
        >
          {pending ? "Salvando…" : "Salvar funções"}
        </button>
        {changes.length > 0 && !pending && (
          <span className={styles.hint}>
            {changes.length === 1 ? "1 alteração" : `${changes.length} alterações`}{" "}
            não salva{changes.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </div>
  );
}

export function MemberStatusForm({
  userId,
  name,
  active,
  isSelf,
}: {
  userId: string;
  name: string;
  active: boolean;
  isSelf: boolean;
}) {
  const [state, action, pending] = useActionState(
    setInternalUserActiveAction,
    emptyState,
  );
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (state.success) {
      setConfirming(false);
      setReason("");
    }
  }, [state]);

  if (isSelf) {
    return (
      <p className={styles.hint}>
        Você não pode desativar a própria conta. Peça a outro administrador.
      </p>
    );
  }

  if (!active) {
    return (
      <form action={action} className={styles.form}>
        <input type="hidden" name="targetUser" value={userId} />
        <input type="hidden" name="enabled" value="true" />
        <input type="hidden" name="reason" value="" />
        <p className={styles.hint}>
          A conta está desativada: a pessoa não consegue entrar na plataforma.
        </p>
        <Feedback state={state} />
        <div className={styles.formActions}>
          <button className={`${ui.button} ${ui.primary}`} type="submit" disabled={pending}>
            {pending ? "Reativando…" : "Reativar conta"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="targetUser" value={userId} />
      <input type="hidden" name="enabled" value="false" />
      <label className={ui.field}>
        <span>Motivo da desativação</span>
        <textarea
          name="reason"
          required
          maxLength={2000}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Ex.: encerramento do contrato em 30/10."
          disabled={pending}
        />
        <small>Fica registrado no histórico administrativo.</small>
      </label>
      {confirming && (
        <p className={`${ui.notice} ${ui.danger}`} role="alert">
          Desativar o acesso de <strong>{name}</strong>? A pessoa não conseguirá
          entrar até ser reativada. As funções e o histórico são mantidos.
        </p>
      )}
      <Feedback state={state} />
      {/* As chaves (key) fazem o React trocar o botão inteiro. Sem elas, o mesmo
          botão mudaria de "button" para "submit" durante o clique e o
          navegador enviaria o formulário sem passar pela confirmação. */}
      <div className={styles.formActions}>
        {confirming ? (
          <>
            <button
              key="confirm"
              className={`${ui.button} ${ui.dangerSolid}`}
              type="submit"
              disabled={pending}
            >
              {pending ? "Desativando…" : "Confirmar desativação"}
            </button>
            <button
              key="back"
              className={ui.button}
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              Voltar
            </button>
          </>
        ) : (
          <button
            key="start"
            className={`${ui.button} ${ui.dangerOutline}`}
            type="button"
            onClick={(event) => {
              if (event.currentTarget.form?.reportValidity()) setConfirming(true);
            }}
          >
            Desativar conta
          </button>
        )}
      </div>
    </form>
  );
}

export function EligibilitySettingsForm({
  minimumFollowers,
  requiredEvidence,
  minimumViews,
  maxStoryAgeDays,
}: {
  minimumFollowers: number;
  requiredEvidence: number;
  minimumViews: number;
  maxStoryAgeDays: number | null;
}) {
  const [state, action, pending] = useActionState(
    updateEligibilitySettingsAction,
    emptyState,
  );

  return (
    <form action={action} className={styles.form}>
      <div className={styles.grid4}>
        <label className={ui.field}>
          <span>Seguidores de referência</span>
          <input
            name="minimumFollowers"
            type="number"
            min={0}
            max={2147483647}
            step={1}
            required
            defaultValue={minimumFollowers}
          />
          <small>Só orienta a prioridade; não elimina ninguém.</small>
        </label>
        <label className={ui.field}>
          <span>Evidências obrigatórias</span>
          <input
            name="requiredEvidence"
            type="number"
            min={1}
            max={5}
            required
            defaultValue={requiredEvidence}
          />
          <small>De 1 a 5 Stories.</small>
        </label>
        <label className={ui.field}>
          <span>Visualizações mínimas</span>
          <input
            name="minimumViews"
            type="number"
            min={0}
            max={2147483647}
            step={1}
            required
            defaultValue={minimumViews}
          />
          <small>Por Story enviado.</small>
        </label>
        <label className={ui.field}>
          <span>
            Idade máxima do Story <em>(opcional)</em>
          </span>
          <input
            name="maxStoryAgeDays"
            type="number"
            min={1}
            max={365}
            step={1}
            defaultValue={maxStoryAgeDays ?? ""}
            placeholder="Sem limite"
          />
          <small>Em dias, contados da publicação.</small>
        </label>
      </div>
      <Feedback state={state} />
      <div className={styles.formActions}>
        <button className={`${ui.button} ${ui.primary}`} type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar critérios"}
        </button>
      </div>
    </form>
  );
}
