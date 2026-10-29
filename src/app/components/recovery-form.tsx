"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import {
  recoveryAction,
  recoveryOptionsAction,
  type RecoveryOptions,
  type RecoverySendState,
} from "@/app/actions/auth";
import { recoveryCooldownSeconds, recoveryMaxSends } from "@/lib/recovery-limits";

const idle: RecoveryOptions = { status: "idle" };

export function RecoveryForm() {
  const [options, lookup, looking] = useActionState(recoveryOptionsAction, idle);
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

  return <SendStep options={options} onRestart={() => setRestart(1)} />;
}

type SendState = {
  result: RecoverySendState;
  // Envios feitos nesta tela e quando o próximo fica liberado. O servidor
  // aplica os mesmos limites; aqui é só para orientar a pessoa.
  sent: number;
  availableAt: number;
};

const firstSend: SendState = { result: { status: "idle" }, sent: 0, availableAt: 0 };

async function sendWithCount(previous: SendState, data: FormData): Promise<SendState> {
  const result = await recoveryAction(previous.result, data);
  if (result.status !== "sent") return { ...previous, result };
  return {
    result,
    sent: previous.sent + 1,
    availableAt: Date.now() + recoveryCooldownSeconds * 1000,
  };
}

function useSecondsUntil(time: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (time <= Date.now()) return;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= time) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [time]);
  return Math.max(0, Math.ceil((time - now) / 1000));
}

function formatWait(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function SendStep({
  options,
  onRestart,
}: {
  options: Extract<RecoveryOptions, { status: "options" }>;
  onRestart: () => void;
}) {
  const [state, send, sending] = useActionState(sendWithCount, firstSend);
  const wait = useSecondsUntil(state.availableAt);
  const { result, sent } = state;
  const finished = result.status === "limit" || sent >= recoveryMaxSends;
  const left = recoveryMaxSends - sent;

  return (
    <form action={send} className="auth-form">
      <div className="auth-heading">
        {/* Hífen que não quebra: "e-mail" não se parte no fim da linha. */}
        <h1>{sent > 0 ? "Confira seu e‑mail." : "Confirme o envio."}</h1>
        {sent === 0 && (
          <p>
            {options.kind === "cpf"
              ? "Se houver uma conta ativa com esse CPF, as instruções vão para o e-mail cadastrado nela."
              : "Se houver uma conta com esse e-mail, as instruções vão para ele."}
          </p>
        )}
      </div>
      <input type="hidden" name="identifier" value={options.identifier} />
      <input type="hidden" name="kind" value={options.kind} />
      <div className="recovery-options">
        <div className="recovery-option">
          <span>
            <strong>Enviar para</strong>
            {options.maskedEmail ?? "O e-mail cadastrado na conta desse CPF"}
          </span>
        </div>
      </div>
      {result.status !== "idle" && (
        <p
          className={
            result.status === "sent" ? "form-message success" : "form-message error"
          }
          role="status"
          aria-live="polite"
        >
          {result.message}
        </p>
      )}
      <div className="recovery-help">
        <strong>Não achou? Olhe a pasta Spam.</strong>
        <p>
          A maioria dos e-mails cai lá. Procure por <b>Vyrex</b>, com o assunto
          “Recupere sua senha da Vyrex”, e marque “Não é spam”. O link vale por
          1 hora.
        </p>
      </div>
      {finished ? (
        <p className="recovery-limit">
          Você já usou os {recoveryMaxSends} envios. Se o e-mail não chegar em
          alguns minutos, volte aqui daqui a 1 hora.
        </p>
      ) : (
        <>
          <button
            className="button button-dark submit-button"
            type="submit"
            disabled={sending || wait > 0}
          >
            {sending
              ? "Enviando…"
              : wait > 0
                ? `Reenviar em ${formatWait(wait)}`
                : sent > 0
                  ? "Reenviar e-mail"
                  : "Enviar para o e-mail"}
            <span aria-hidden="true">↗</span>
          </button>
          {sent > 0 && (
            <p className="recovery-remaining">
              Você pode pedir mais {left} {left === 1 ? "vez" : "vezes"}.
            </p>
          )}
        </>
      )}
      <div className="auth-links">
        <button className="link-button" type="button" onClick={onRestart}>
          Usar outro CPF ou e-mail
        </button>
        <Link href="/login">Voltar para entrar</Link>
      </div>
    </form>
  );
}
