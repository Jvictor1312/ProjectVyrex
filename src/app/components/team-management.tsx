"use client";

import { useActionState, useState } from "react";
import {
  inviteInternalUserAction,
  manageInternalRoleAction,
  setInternalUserActiveAction,
  updateEligibilitySettingsAction,
} from "@/app/actions/internal";
import type { FormState } from "@/lib/validation/auth";
import styles from "@/app/interno/team-management.module.css";

const emptyState: FormState = { message: "", success: false };
const roles = [
  { key: "admin", label: "Administrador" },
  { key: "recruiter", label: "Recrutador" },
  { key: "relationship_manager", label: "Relacionamento" },
  { key: "validator", label: "Validação" },
] as const;

function Feedback({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      className={state.success ? styles.success : styles.error}
      role="status"
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}

export function InviteInternalUserForm({
  configured,
}: {
  configured: boolean;
}) {
  const [state, action, pending] = useActionState(
    inviteInternalUserAction,
    emptyState,
  );
  return (
    <form action={action} className={styles.inviteForm}>
      <div className={styles.formFields}>
        <label>
          <span>Nome completo</span>
          <input name="fullName" required minLength={2} maxLength={120} />
        </label>
        <label>
          <span>E-mail corporativo</span>
          <input name="email" type="email" required maxLength={254} />
        </label>
        <label>
          <span>Função inicial</span>
          <select name="role" defaultValue="recruiter">
            {roles.map((role) => (
              <option value={role.key} key={role.key}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!configured && (
        <p className={styles.warning}>
          Convites por e-mail exigem SUPABASE_SERVICE_ROLE_KEY somente no
          servidor.
        </p>
      )}
      <Feedback state={state} />
      <button type="submit" disabled={pending || !configured}>
        {pending ? "Enviando convite..." : "Convidar pessoa"}
      </button>
    </form>
  );
}

export function UserRoleForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(
    manageInternalRoleAction,
    emptyState,
  );
  return (
    <form action={action} className={styles.inlineForm}>
      <input type="hidden" name="targetUser" value={userId} />
      <select name="role" defaultValue="recruiter" aria-label="Função interna">
        {roles.map((role) => (
          <option value={role.key} key={role.key}>
            {role.label}
          </option>
        ))}
      </select>
      <select name="enabled" defaultValue="true" aria-label="Ação da função">
        <option value="true">Atribuir</option>
        <option value="false">Remover</option>
      </select>
      <button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Aplicar"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function UserActiveForm({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  const [state, action, pending] = useActionState(
    setInternalUserActiveAction,
    emptyState,
  );
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={action} className={styles.activeForm}>
      <input type="hidden" name="targetUser" value={userId} />
      <input type="hidden" name="enabled" value={String(!active)} />
      {active && (
        <label>
          <span>Motivo da desativação</span>
          <input name="reason" required maxLength={2000} />
        </label>
      )}
      {!active && <input type="hidden" name="reason" value="" />}
      {active && !confirming ? (
        <button
          className={styles.dangerButton}
          type="button"
          onClick={(event) => {
            if (event.currentTarget.form?.reportValidity()) setConfirming(true);
          }}
        >
          Desativar conta
        </button>
      ) : (
        <span className={styles.confirmRow}>
          {active && <span>Bloquear o acesso desta conta?</span>}
          <button
            className={active ? styles.dangerButton : styles.secondaryButton}
            type="submit"
            disabled={pending}
          >
            {pending
              ? "Atualizando..."
              : active
                ? "Confirmar"
                : "Reativar conta"}
          </button>
          {active && (
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </button>
          )}
        </span>
      )}
      <Feedback state={state} />
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
    <form action={action} className={styles.inviteForm}>
      <div className={styles.formFields}>
        <label>
          <span>Referência para priorização (não eliminatória)</span>
          <input
            name="minimumFollowers"
            type="number"
            min={0}
            max={2147483647}
            step={1}
            required
            defaultValue={minimumFollowers}
          />
        </label>
        <label>
          <span>Evidências obrigatórias (de 1 a 5)</span>
          <input
            name="requiredEvidence"
            type="number"
            min={1}
            max={5}
            required
            defaultValue={requiredEvidence}
          />
        </label>
        <label>
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
        </label>
        <label>
          <span>Idade máxima da evidência (dias)</span>
          <input
            name="maxStoryAgeDays"
            type="number"
            min={1}
            max={365}
            step={1}
            defaultValue={maxStoryAgeDays ?? ""}
            placeholder="Sem limite configurado"
          />
        </label>
      </div>
      <p className={styles.warning}>
        Esta referência não elimina nem bloqueia criadores. Seguidores são
        considerados junto com nicho, localização e compatibilidade da campanha.
      </p>
      <Feedback state={state} />
      <button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar critérios"}
      </button>
    </form>
  );
}
