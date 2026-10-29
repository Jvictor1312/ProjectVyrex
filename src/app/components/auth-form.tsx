"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import {
  loginAction,
  passwordUpdateAction,
  signupAction,
} from "@/app/actions/auth";
import { FormFeedback } from "@/app/components/form-feedback";
import type { FormState } from "@/lib/validation/auth";

type AuthMode = "login" | "signup" | "reset";

const initialState: FormState = { message: "", success: false };
const passwordRequirements =
  "Mínimo de 11 caracteres, com maiúscula, minúscula, número e símbolo.";

export function PasswordField({
  name,
  label,
  autoComplete,
  minLength,
  description,
}: {
  name: string;
  label: string;
  autoComplete: string;
  minLength?: number;
  description?: string;
}) {
  const [visible, setVisible] = useState(false);
  const descriptionId = `${name}-password-help`;

  return (
    <label className="field">
      <span>{label}</span>
      <span className="password-input-wrap">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          maxLength={128}
          aria-describedby={description ? descriptionId : undefined}
        />
        <button
          className="password-visibility-toggle"
          type="button"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
            <circle cx="12" cy="12" r="2.7" />
            {visible && <path d="m4 4 16 16" />}
          </svg>
          <span className="password-toggle-tooltip" aria-hidden="true">
            {visible ? "Ocultar senha" : "Mostrar senha"}
          </span>
        </button>
      </span>
      {description && <small id={descriptionId}>{description}</small>}
    </label>
  );
}

// Telefone opcional: começa como um convite com seta e só vira campo se a
// pessoa quiser informar o número.
function OptionalPhoneField() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        className="phone-reveal"
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
      >
        Quer recuperar sua senha também pelo celular? Adicione seu número
        <span aria-hidden="true">→</span>
      </button>
    );
  }

  return (
    <label className="field">
      <span>Celular (opcional)</span>
      <input
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="(11) 98765-4321"
        maxLength={32}
        autoFocus
      />
    </label>
  );
}

const content: Record<
  AuthMode,
  { title: string; description: string; submit: string }
> = {
  login: {
    title: "Que bom ver você de novo.",
    description: "Entre na sua conta Vyrex.",
    submit: "Entrar",
  },
  signup: {
    title: "Vamos começar.",
    description: "Crie sua conta gratuita. Depois, você completa o perfil, informa sua rede social e envia 3 prints de Stories para a análise da equipe.",
    submit: "Criar minha conta",
  },
  reset: {
    title: "Escolha uma nova senha.",
    description: passwordRequirements,
    submit: "Atualizar senha",
  },
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const action =
    mode === "login"
      ? loginAction
      : mode === "signup"
        ? signupAction
        : passwordUpdateAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const copy = content[mode];

  return (
    <form
      action={formAction}
      // Envio pelo onSubmit: o React só limpa o formulário quando o envio vem
      // do atributo action. Assim, se o servidor recusar (senha errada, senhas
      // diferentes), o que a pessoa digitou continua nos campos. Sem
      // JavaScript, o action acima envia normalmente.
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
      className={mode === "signup" ? "auth-form signup-auth-form" : "auth-form"}
    >
      <div className="auth-heading">
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </div>

      {mode === "signup" && (
        <label className="field">
          <span>Nome completo</span>
          <input autoComplete="name" name="fullName" required maxLength={120} />
        </label>
      )}

      {mode !== "reset" && (
        <label className="field">
          <span>E-mail</span>
          <input
            autoComplete="email"
            name="email"
            type="email"
            required
            maxLength={254}
          />
        </label>
      )}

      {mode !== "reset" && (
        <PasswordField
          name="password"
          label="Senha"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "signup" ? 11 : undefined}
          description={mode === "signup" ? passwordRequirements : undefined}
        />
      )}

      {mode === "reset" && (
        <>
          <PasswordField
            name="password"
            label="Nova senha"
            autoComplete="new-password"
            minLength={11}
            description={passwordRequirements}
          />
          <PasswordField
            name="passwordConfirmation"
            label="Confirme sua nova senha"
            autoComplete="new-password"
            minLength={11}
          />
        </>
      )}

      {mode === "signup" && (
        <>
          <PasswordField
            name="passwordConfirmation"
            label="Confirme sua senha"
            autoComplete="new-password"
            minLength={11}
          />
          <OptionalPhoneField />
          <label className="check-field">
            <input name="termsAccepted" type="checkbox" required />
            <span>
              Li e aceito os <Link href="/termos">termos de uso</Link> e a
              <Link href="/privacidade"> política de privacidade</Link>.
            </span>
          </label>
        </>
      )}

      <FormFeedback state={state} />

      <button
        className="button button-dark submit-button"
        type="submit"
        disabled={pending}
      >
        {pending ? "Aguarde…" : copy.submit}
        <span aria-hidden="true">↗</span>
      </button>

      {mode !== "signup" && (
        <div className="auth-links">
          {mode === "login" && (
            <Link href="/recuperar-senha">Esqueci minha senha</Link>
          )}
          {mode === "login" && (
            <span>
              Ainda não tem conta? <Link href="/cadastro">Criar conta</Link>
            </span>
          )}
          {mode === "reset" && (
            <Link href="/recuperar-senha">Solicitar outro link</Link>
          )}
        </div>
      )}
    </form>
  );
}
