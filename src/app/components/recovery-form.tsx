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
          <p>Informe o e-mail da sua conta.</p>
        </div>
        <label className="field">
          <span>E-mail</span>
          <input
            autoComplete="email"
            name="email"
            type="email"
            required
            maxLength={254}
            defaultValue={options.status === "options" ? options.email : ""}
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
          {looking ? "Aguarde..." : "Continuar"}
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
        <p>Escolha como quer recuperar sua senha.</p>
      </div>
      <input type="hidden" name="email" value={options.email} />
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
        {sending ? "Enviando..." : state.success ? "Enviado" : "Enviar"}
        <span aria-hidden="true">↗</span>
      </button>
      <div className="auth-links">
        <button className="link-button" type="button" onClick={() => setRestart(1)}>
          Usar outro e-mail
        </button>
      </div>
    </form>
  );
}
