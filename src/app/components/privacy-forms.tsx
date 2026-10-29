"use client";

import { useActionState } from "react";
import { PasswordField } from "@/app/components/auth-form";
import {
  changePasswordAction,
  createDataRequestAction,
  resolveDataRequestAction,
  updateAccountSettingsAction,
} from "@/app/actions/privacy";
import type { FormState } from "@/lib/validation/auth";
import {
  dataRequestKindLabels,
  dataRequestKinds,
} from "@/lib/validation/privacy";

const initialState: FormState = { message: "", success: false };

function ActionMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      className={state.success ? "form-message success" : "form-message error"}
      role="status"
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}

export function DataRequestForm() {
  const [state, action, pending] = useActionState(
    createDataRequestAction,
    initialState,
  );
  return (
    <form action={action} className="editor-form">
      <label className="field">
        <span>Tipo de solicitação</span>
        <select name="kind" defaultValue="access" required>
          {dataRequestKinds.map((kind) => (
            <option value={kind} key={kind}>
              {dataRequestKindLabels[kind]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Detalhes (opcional)</span>
        <textarea name="details" rows={3} maxLength={2000} />
      </label>
      <ActionMessage state={state} />
      <button className="button button-dark" type="submit" disabled={pending}>
        {pending ? "Registrando…" : "Registrar solicitação"}
      </button>
    </form>
  );
}

export function ResolveDataRequestForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(
    resolveDataRequestAction,
    initialState,
  );
  return (
    <form action={action} className="editor-form">
      <input type="hidden" name="requestId" value={requestId} />
      <label className="field">
        <span>Atualizar para</span>
        <select name="status" defaultValue="in_progress" required>
          <option value="in_progress">Em andamento</option>
          <option value="resolved">Concluída</option>
          <option value="rejected">Não atendida</option>
        </select>
      </label>
      <label className="field">
        <span>Resposta ao titular (obrigatória ao concluir ou recusar)</span>
        <textarea name="note" rows={3} maxLength={2000} />
      </label>
      <ActionMessage state={state} />
      <button className="button button-dark" type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Atualizar solicitação"}
      </button>
    </form>
  );
}

export function AccountSettingsForm({
  initial,
}: {
  initial: { fullName: string; phone: string; cpf: string };
}) {
  const [state, action, pending] = useActionState(
    updateAccountSettingsAction,
    initialState,
  );
  return (
    <form action={action} className="editor-form">
      <label className="field">
        <span>Nome completo</span>
        <input
          name="fullName"
          required
          minLength={2}
          maxLength={120}
          defaultValue={initial.fullName}
          autoComplete="name"
        />
      </label>
      <label className="field">
        <span>Telefone (opcional)</span>
        <input
          name="phone"
          type="tel"
          maxLength={32}
          defaultValue={initial.phone}
          autoComplete="tel"
        />
      </label>
      <label className="field">
        <span>CPF (opcional)</span>
        <input
          name="cpf"
          inputMode="numeric"
          maxLength={14}
          placeholder="000.000.000-00"
          defaultValue={initial.cpf}
          autoComplete="off"
        />
        <small className="field-hint">
          Com o CPF salvo, você também pode recuperar a senha informando o CPF.
          Só você vê este dado. Deixe vazio para removê-lo.
        </small>
      </label>
      <ActionMessage state={state} />
      <button className="button button-dark" type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar dados"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(
    changePasswordAction,
    initialState,
  );
  return (
    <form action={action} className="editor-form">
      <PasswordField
        name="currentPassword"
        label="Senha atual"
        autoComplete="current-password"
      />
      <PasswordField
        name="password"
        label="Nova senha"
        autoComplete="new-password"
        minLength={11}
        description="Mínimo de 11 caracteres, com maiúscula, minúscula, número e símbolo."
      />
      <PasswordField
        name="passwordConfirmation"
        label="Confirmar nova senha"
        autoComplete="new-password"
        minLength={11}
      />
      <ActionMessage state={state} />
      <button className="button button-dark" type="submit" disabled={pending}>
        {pending ? "Alterando…" : "Alterar senha"}
      </button>
    </form>
  );
}
