"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  recoveryAction,
  recoveryOptionsAction,
  type RecoveryOptions,
} from "@/app/actions/auth";
import type { FormState } from "@/lib/validation/auth";

const idle: RecoveryOptions = { status: "idle" };
const initialState: FormState = { message: "", success: false };

export function RecoveryForm() {
  const [options, lookup, looking] = useActionState(recoveryOptionsAction, idle);
  const [state, send, sending] = useActionState(recoveryAction, initialState);
  const [restart, setRestart] = useState(0);
  const choosing = options.status === "options" && restart === 0;

  if (!choosing) {
    return (
      <form action={(data) => { setRestart(0); lookup(data); }} className="auth-form">
        <div className="auth-heading">
          <h1>Recupere seu acesso.</h1>
          <p>Informe o e-mail da sua conta ou o CPF salvo em Configurações.</p>
        </div>
        <label className="field">
          <span>CPF ou e-mail</span>
          <input
            autoComplete="username"
            name="identifier"
            type="text"
            inputMode="email"
            required
            maxLength={254}
            placeholder="000.000.000-00 ou nome@email.com"
            defaultValue={
              options.status === "options" && options.kind === "email"
                ? options.identifier
                : options.status === "error"
                  ? (options.identifier ?? "")
                  : ""
            }
          />
        </label>
        {options.status === "error" && (
          <p className="form-message error" role="status">
            {options.message}
          </p>
        )}
        <button
          className="button button-dark submit-button"
          type="submit"
          disabled={looking}
        >
          {looking ? "Aguarde…" : "Continuar"}
          <span aria-hidden="true">↗</span>
        </button>
        <div className="auth-links">
          <Link href="/login">Voltar para entrar</Link>
        </div>
      </form>
    );
  }

  return (
    <form action={send} className="auth-form">
      <div className="auth-heading">
        <h1>Para onde enviamos?</h1>
        <p>
          {options.kind === "cpf"
            ? "Encontramos a conta ligada a esse CPF. As instruções vão para o e-mail abaixo."
            : "Escolha como quer recuperar sua senha."}
        </p>
      </div>
      <input type="hidden" name="identifier" value={options.identifier} />
      <input type="hidden" name="kind" value={options.kind} />
      <fieldset className="recovery-options">
        <legend className="sr-only">Canal de recuperação</legend>
        <label className="recovery-option">
          <input type="radio" name="channel" value="email" defaultChecked />
          <span>
            <strong>E-mail</strong>
            {options.maskedEmail}
          </span>
        </label>
        {options.phoneHint && (
          <label className="recovery-option recovery-option--disabled">
            <input type="radio" name="channel" value="phone" disabled />
            <span>
              <strong>Celular · em breve</strong>
              (••) •••••-{options.phoneHint}
            </span>
          </label>
        )}
      </fieldset>
      {state.message && (
        <p
          className={state.success ? "form-message success" : "form-message error"}
          role="status"
          aria-live="polite"
        >
          {state.message}
        </p>
      )}
      <button
        className="button button-dark submit-button"
        type="submit"
        disabled={sending || state.success}
      >
        {sending ? "Enviando…" : state.success ? "Enviado" : "Enviar para o e-mail"}
        <span aria-hidden="true">↗</span>
      </button>
      <div className="auth-links">
        <button className="link-button" type="button" onClick={() => setRestart(1)}>
          Usar outro CPF ou e-mail
        </button>
      </div>
    </form>
  );
}
