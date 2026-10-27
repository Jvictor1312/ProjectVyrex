"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  saveCreatorProfileAction,
  saveSocialAccountAction,
  submitCreatorApplicationAction,
  uploadStoryEvidenceAction,
} from "@/app/actions/creator";
import { categoriesList, socialPlatforms } from "@/lib/validation/creator";
import type { FormState } from "@/lib/validation/auth";

const initialState: FormState = { message: "", success: false };
const categoryLabels: Record<string, string> = {
  games: "Games",
  beleza: "Beleza",
  tecnologia: "Tecnologia",
  humor: "Humor",
  lifestyle: "Lifestyle",
  esportes: "Esportes",
  alimentacao: "Alimentação",
  moda: "Moda",
  viagens: "Viagens",
  educacao: "Educação",
  musica: "Música",
  outros: "Outros",
};
const platformLabels: Record<(typeof socialPlatforms)[number], string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  other: "Outra rede",
};

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

  return (
    <div className="creator-wizard" data-active-step={activeStep}>
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
                  onClick={() => setActiveStep(index)}
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
          onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
        >
          Etapa anterior
        </button>
        <span aria-live="polite">
          Etapa {activeStep + 1} de {steps.length}
        </span>
        <button
          className="button button-dark"
          type="button"
          disabled={activeStep >= steps.length - 1}
          onClick={() =>
            setActiveStep((step) => Math.min(steps.length - 1, step + 1))
          }
        >
          Continuar
        </button>
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
    "saved" | "waiting" | "saving" | "error"
  >("saved");

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
      <p className="field-hint" aria-live="polite">
        {pending || saveStatus === "saving"
          ? "Salvando alterações..."
          : saveStatus === "waiting"
            ? "Salvamento automático em instantes..."
            : saveStatus === "error"
              ? state.message || "Não foi possível salvar. Tente novamente."
              : state.message || "Alterações salvas no servidor."}
      </p>
      <ActionMessage state={state} />
      <button className="button button-dark" type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar agora"}
      </button>
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
        <span>URL pública do perfil</span>
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
      <p className="field-hint">
        Não há mínimo obrigatório de seguidores. A audiência é considerada em
        conjunto com nicho, localização e compatibilidade da campanha; a equipe
        confere as métricas manualmente.
      </p>
      <ActionMessage state={state} />
      <button className="button button-dark" type="submit" disabled={pending}>
        {pending
          ? "Salvando..."
          : initialAccount
            ? "Salvar alterações"
            : "Adicionar rede"}
      </button>
    </form>
  );
}

export function EvidenceUploadForm({
  socialAccounts,
  existingPositions,
  minimumViews,
  maxStoryAgeDays,
}: {
  socialAccounts: { id: string; platform: string; handle: string }[];
  existingPositions: number[];
  minimumViews: number;
  maxStoryAgeDays: number | null;
}) {
  const [state, action, pending] = useActionState(
    uploadStoryEvidenceAction,
    initialState,
  );
  const evidenceInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(
    null,
  );

  useEffect(() => {
    if (state.success) {
      setPreview(null);
      if (evidenceInput.current) evidenceInput.current.value = "";
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  return (
    <form action={action} className="editor-form">
      <div className="field-row">
        <label className="field">
          <span>Posição da evidência</span>
          <select name="position" defaultValue="" required>
            {[1, 2, 3, 4, 5].map((position) => (
              <option key={position} value={position}>
                {position}. Story{" "}
                {existingPositions.includes(position)
                  ? "(substituir)"
                  : "(vazio)"}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Rede relacionada</span>
          <select
            name="socialAccountId"
            defaultValue=""
            required
            disabled={socialAccounts.length === 0}
          >
            <option value="" disabled>
              Selecione uma rede
            </option>
            {socialAccounts.map((account) => (
              <option value={account.id} key={account.id}>
                {platformLabels[
                  account.platform as keyof typeof platformLabels
                ] ?? account.platform}{" "}
                · @{account.handle}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          <span>Data aproximada da publicação</span>
          <input
            name="storyPublishedOn"
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
          />
        </label>
        <label className="field">
          <span>Visualizações informadas</span>
          <input
            name="viewsReported"
            type="number"
            inputMode="numeric"
            min={0}
            max={2147483647}
            step={1}
            required
          />
        </label>
      </div>
      <label className="field">
        <span>Imagem da evidência</span>
        <input
          ref={evidenceInput}
          name="evidence"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          onChange={(event) => {
            const file = event.currentTarget.files?.[0] ?? null;
            setPreview(file ? { file, url: URL.createObjectURL(file) } : null);
          }}
        />
      </label>
      {preview && (
        <div className="evidence-preview">
          <Image
            src={preview.url}
            alt="Prévia da imagem selecionada"
            width={96}
            height={128}
            unoptimized
          />
          <div>
            <strong>{preview.file.name}</strong>
            <span>{(preview.file.size / (1024 * 1024)).toFixed(1)} MB</span>
            <button
              className="quiet-button"
              type="button"
              onClick={() => {
                setPreview(null);
                if (evidenceInput.current) evidenceInput.current.value = "";
              }}
            >
              Remover imagem
            </button>
          </div>
        </div>
      )}
      <p className="field-hint">
        JPEG, PNG ou WebP, até 8 MB. Informe pelo menos{" "}
        {minimumViews.toLocaleString("pt-BR")} visualizações.{" "}
        {maxStoryAgeDays === null
          ? "Não há limite de idade configurado."
          : `As evidências devem ter até ${maxStoryAgeDays} dias.`}{" "}
        A equipe confere os dados manualmente; uma imagem não é validação
        automática.
      </p>
      <label className="field">
        <span>Observações (opcional)</span>
        <textarea name="creatorNotes" rows={2} maxLength={500} />
      </label>
      <ActionMessage state={state} />
      <button
        className="button button-dark"
        type="submit"
        disabled={pending || socialAccounts.length === 0}
      >
        {pending ? "Enviando..." : "Salvar evidência"}
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
        {pending ? "Enviando..." : "Enviar para análise manual"}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
