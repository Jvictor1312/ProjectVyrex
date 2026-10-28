"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { uploadStoryEvidenceAction } from "@/app/actions/creator";
import type { FormState } from "@/lib/validation/auth";
import styles from "./evidence-board.module.css";

const initialState: FormState = { message: "", success: false };

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  other: "Outra rede",
};

export type EvidenceSlot = {
  position: number;
  imageUrl?: string;
  uploaded: boolean;
  statusLabel: string;
  meta?: string;
  reason?: string | null;
  needsAttention: boolean;
};

type Draft = { position: number; url: string; name: string };

export function EvidenceBoard({
  slots,
  socialAccounts,
  minimumViews,
  maxStoryAgeDays,
  canEdit,
}: {
  slots: EvidenceSlot[];
  socialAccounts: { id: string; platform: string; handle: string }[];
  minimumViews: number;
  maxStoryAgeDays: number | null;
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState(
    uploadStoryEvidenceAction,
    initialState,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const pickingFor = useRef<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState("");
  const hasAccounts = socialAccounts.length > 0;

  // Depois de salvar, a página é atualizada pelo servidor e a prévia local sai.
  useEffect(() => {
    if (state.success) {
      setDraft(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (draft) URL.revokeObjectURL(draft.url);
    };
  }, [draft]);

  function pick(position: number) {
    if (!hasAccounts) {
      setNotice("Cadastre uma rede social antes de enviar as evidências.");
      return;
    }
    setNotice("");
    pickingFor.current = position;
    fileInput.current?.click();
  }

  function cancel() {
    setDraft(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  const today = new Date().toISOString().slice(0, 10);
  const earliest =
    maxStoryAgeDays === null
      ? undefined
      : new Date(Date.now() - maxStoryAgeDays * 86_400_000)
          .toISOString()
          .slice(0, 10);

  return (
    <form action={action} className={styles.board}>
      <ol className={styles.grid} aria-label="Evidências dos Stories">
        {slots.map((slot) => {
          const isDraft = draft?.position === slot.position;
          const imageUrl = isDraft ? draft.url : slot.imageUrl;
          const content = (
            <>
              {imageUrl ? (
                <Image
                  className={styles.image}
                  src={imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 680px) 45vw, 160px"
                  unoptimized
                />
              ) : (
                <span className={styles.plus} aria-hidden="true">
                  +
                </span>
              )}
              <span className={styles.number}>{slot.position}</span>
              <span
                className={`${styles.status} ${
                  isDraft
                    ? styles.statusDraft
                    : slot.needsAttention
                      ? styles.statusAlert
                      : slot.uploaded
                        ? styles.statusDone
                        : ""
                }`}
              >
                {isDraft
                  ? pending
                    ? "Enviando…"
                    : "Não salva"
                  : slot.uploaded
                    ? slot.statusLabel
                    : canEdit
                      ? "Adicionar"
                      : "Pendente"}
              </span>
            </>
          );

          return (
            <li key={slot.position} className={styles.slot}>
              {canEdit ? (
                <button
                  type="button"
                  className={`${styles.tile} ${isDraft ? styles.tileActive : ""}`}
                  onClick={() => pick(slot.position)}
                  disabled={pending}
                  aria-label={`Story ${slot.position}: ${
                    slot.uploaded ? "trocar imagem" : "adicionar imagem"
                  }`}
                >
                  {content}
                </button>
              ) : (
                <div className={styles.tile}>{content}</div>
              )}
              {slot.meta && <span className={styles.meta}>{slot.meta}</span>}
              {slot.reason && <p className={styles.reason}>{slot.reason}</p>}
            </li>
          );
        })}
      </ol>

      <input
        ref={fileInput}
        className={styles.fileInput}
        name="evidence"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          const position = pickingFor.current;
          if (!file || position === null) return;
          setDraft({ position, url: URL.createObjectURL(file), name: file.name });
        }}
      />

      {notice && (
        <p className="form-message error" role="status">
          {notice} <a href="#redes">Ir para redes sociais</a>
        </p>
      )}

      {!canEdit && (
        <p className={styles.locked}>
          As evidências só podem ser alteradas em rascunho ou correção.
        </p>
      )}

      {draft && (
        <div className={styles.details}>
          <input type="hidden" name="position" value={draft.position} />
          <p className={styles.detailsTitle}>
            Story {draft.position}
            <span>{draft.name}</span>
          </p>
          <div className={styles.fields}>
            <label className="field">
              <span>Rede</span>
              <select
                name="socialAccountId"
                defaultValue={socialAccounts.length === 1 ? socialAccounts[0].id : ""}
                required
              >
                <option value="" disabled>
                  Selecione
                </option>
                {socialAccounts.map((account) => (
                  <option value={account.id} key={account.id}>
                    {platformLabels[account.platform] ?? account.platform} @
                    {account.handle}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Data do Story</span>
              <input
                name="storyPublishedOn"
                type="date"
                required
                defaultValue={today}
                min={earliest}
                max={today}
              />
            </label>
            <label className="field">
              <span>Visualizações</span>
              <input
                name="viewsReported"
                type="number"
                inputMode="numeric"
                min={0}
                max={2147483647}
                step={1}
                required
                placeholder={`Mínimo ${minimumViews.toLocaleString("pt-BR")}`}
              />
            </label>
          </div>
          <div className={styles.actions}>
            <button className={styles.save} type="submit" disabled={pending}>
              {pending ? "Enviando…" : "Salvar evidência"}
            </button>
            <button
              className={styles.cancel}
              type="button"
              onClick={cancel}
              disabled={pending}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {state.message && (
        <p
          className={state.success ? "form-message success" : "form-message error"}
          role="status"
          aria-live="polite"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
