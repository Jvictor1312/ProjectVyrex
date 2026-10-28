"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  saveCreatorProfileAction,
  saveSocialAccountAction,
  submitCreatorApplicationAction,
} from "@/app/actions/creator";
import { categoriesList, socialPlatforms } from "@/lib/validation/creator";
import type { FormState } from "@/lib/validation/auth";
import { categoryLabels, platformLabels } from "@/lib/labels";

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

export function CreatorWizard({
  steps,
  children,
}: {
  steps: {
    title: string;
    complete: boolean;
    help: string;
    panelId: string;
  }[];
  children: ReactNode;
}) {
  const firstIncomplete = steps.findIndex((step) => !step.complete);
  const [activeStep, setActiveStep] = useState(
    firstIncomplete < 0 ? 0 : firstIncomplete,
  );
  const wizardRef = useRef<HTMLDivElement>(null);
  const changedByUser = useRef(false);

  // Ao trocar de etapa, leva a pessoa ao começo da etapa nova.
  useEffect(() => {
    if (!changedByUser.current) return;
    wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeStep]);

  function goTo(step: number) {
    changedByUser.current = true;
    setActiveStep(Math.min(steps.length - 1, Math.max(0, step)));
  }

  return (
    <div
      className="creator-wizard"
      data-active-step={activeStep}
      ref={wizardRef}
    >
      <nav aria-label="Etapas do cadastro">
        <ol className="creator-wizard-steps">
          {steps.map((step, index) => (
            <li key={step.title}>
              <div className="wizard-step-group">
                <button
                  type="button"
                  className={
                    index === activeStep ? "wizard-step active" : "wizard-step"
                  }
                  aria-current={index === activeStep ? "step" : undefined}
                  aria-controls={step.panelId}
                  aria-label={`Etapa ${index + 1}: ${step.title}, ${step.complete ? "concluída" : "pendente"}`}
                  onClick={() => goTo(index)}
                >
                  <span className="wizard-step-number" aria-hidden="true">
                    {step.complete ? "✓" : `0${index + 1}`}
                  </span>
                  <span>{step.title}</span>
                </button>
                <details className="wizard-step-help">
                  <summary
                    aria-label={`Ajuda para a etapa ${step.title}`}
                    title={`Ajuda: ${step.title}`}
                  >
                    <span aria-hidden="true">i</span>
                  </summary>
                  <p>{step.help}</p>
                </details>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      <div className="creator-wizard-panels">{children}</div>

      <nav
        className="creator-wizard-navigation"
        aria-label="Navegação do cadastro"
      >
        <button
          className="quiet-button"
          type="button"
          disabled={activeStep === 0}
          onClick={() => goTo(activeStep - 1)}
        >
          Etapa anterior
        </button>
        <span aria-live="polite">
          Etapa {activeStep + 1} de {steps.length}
        </span>
{activeStep < steps.length - 1 ? (
          <button
            className="button button-dark"
            type="button"
            onClick={() => goTo(activeStep + 1)}
          >
            Continuar
          </button>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}

export function CreatorProfileForm({
  initial,
}: {
  initial: {
    publicName: string;
    city: string;
    region: string;
    biography: string;
    categories: string[];
  };
}) {
  const [state, action, pending] = useActionState(
    saveCreatorProfileAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saved" | "waiting" | "saving" | "error"
  >("idle");

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!pending && state.message) {
      setSaveStatus(state.success ? "saved" : "error");
    }
  }, [pending, state]);

  function scheduleSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("waiting");
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      setSaveStatus("saving");
      formRef.current?.requestSubmit();
    }, 700);
  }

  function submitImmediately() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    setSaveStatus("saving");
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="editor-form"
      onChange={scheduleSave}
      onSubmit={submitImmediately}
    >
      <label className="field">
        <span>Nome público</span>
        <input
          name="publicName"
          maxLength={100}
          defaultValue={initial.publicName}
        />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Cidade</span>
          <input name="city" maxLength={100} defaultValue={initial.city} />
        </label>
        <label className="field">
          <span>Estado</span>
          <input
            name="region"
            maxLength={2}
            placeholder="SP"
            defaultValue={initial.region}
          />
        </label>
      </div>
      <label className="field">
        <span>Sobre seu conteúdo</span>
        <textarea
          name="biography"
          rows={4}
          maxLength={1000}
          defaultValue={initial.biography}
        />
      </label>
      <fieldset className="category-fieldset">
        <legend>Categorias de conteúdo</legend>
        <div className="category-grid">
          {categoriesList.map((category) => (
            <label className="category-option" key={category}>
              <input
                type="checkbox"
                name="categories"
                value={category}
                defaultChecked={initial.categories.includes(category)}
              />
              <span>{categoryLabels[category] ?? category}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="autosave-row">
        <button className="button button-dark" type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <p
          className={`autosave-status autosave-${saveStatus}`}
          aria-live="polite"
        >
          {pending || saveStatus === "saving" || saveStatus === "waiting"
            ? "Salvando…"
            : saveStatus === "error"
              ? state.message || "Não foi possível salvar. Tente de novo."
              : saveStatus === "saved"
                ? "Salvo"
                : ""}
        </p>
      </div>
    </form>
  );
}

export function SocialAccountForm({
  initialAccount,
}: {
  initialAccount?: {
    id: string;
    platform: string;
    handle: string;
    profileUrl: string;
    followersReported: number;
  };
}) {
  const [state, action, pending] = useActionState(
    saveSocialAccountAction,
    initialState,
  );
  return (
    <form action={action} className="editor-form">
      {initialAccount && (
        <input type="hidden" name="accountId" value={initialAccount.id} />
      )}
      <div className="field-row">
        <label className="field">
          <span>Rede social</span>
          <select
            name="platform"
            defaultValue={initialAccount?.platform ?? "instagram"}
            required
          >
            {socialPlatforms.map((platform) => (
              <option value={platform} key={platform}>
                {platformLabels[platform]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Usuário</span>
          <input
            name="handle"
            placeholder="@seuusuario"
            required
            maxLength={101}
            defaultValue={initialAccount?.handle ?? ""}
          />
        </label>
      </div>
      <label className="field">
        <span>Link do perfil</span>
        <input
          name="profileUrl"
          type="url"
          placeholder="https://www.instagram.com/seuusuario"
          required
          maxLength={2048}
          defaultValue={initialAccount?.profileUrl ?? ""}
        />
      </label>
      <label className="field">
        <span>Seguidores informados</span>
        <input
          name="followersReported"
          type="number"
          inputMode="numeric"
          min={0}
          max={2147483647}
          step={1}
          required
          defaultValue={initialAccount?.followersReported ?? ""}
        />
      </label>
      <p className="field-hint">Não há mínimo de seguidores.</p>
      <ActionMessage state={state} />
      <button className="button button-dark" type="submit" disabled={pending}>
        {pending
          ? "Salvando…"
          : initialAccount
            ? "Salvar alterações"
            : "Adicionar rede"}
      </button>
    </form>
  );
}

export function SubmitApplicationButton() {
  const [state, action, pending] = useActionState(
    submitCreatorApplicationAction,
    initialState,
  );
  return (
    <form action={action} className="submit-application">
      <ActionMessage state={state} />
      <button className="button button-dark" type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar para análise"}
      </button>
    </form>
  );
}
