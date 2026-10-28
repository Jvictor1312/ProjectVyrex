"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  deleteDraftEvidenceAction,
  uploadStoryEvidenceAction,
} from "@/app/actions/creator";
import { platformLabels } from "@/lib/labels";
import type { FormState } from "@/lib/validation/auth";
import styles from "./evidence-board.module.css";

const initialState: FormState = { message: "", success: false };
// Mesmo limite do servidor (src/lib/evidence/normalize.ts).
const maximumBytes = 8 * 1024 * 1024;
const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

export type EvidenceSlot = {
  position: number;
  imageUrl?: string;
  uploaded: boolean;
  statusLabel: string;
  meta?: string;
  reason?: string | null;
  needsAttention: boolean;
};

type Draft = { position: number; file: File; url: string };

const listPositions = (positions: number[]) =>
  positions.length === 1
    ? `Story ${positions[0]}`
    : `Stories ${positions.slice(0, -1).join(", ")} e ${positions.at(-1)}`;

export function EvidenceBoard({
  slots,
  socialAccounts,
  minimumViews,
  maxStoryAgeDays,
  canEdit,
  requiredCount = 3,
  canDelete = false,
}: {
  slots: EvidenceSlot[];
  requiredCount?: number;
  // Apagar evidência salva: só no rascunho, antes do envio (o banco confere).
  canDelete?: boolean;
  socialAccounts: { id: string; platform: string; handle: string }[];
  minimumViews: number;
  maxStoryAgeDays: number | null;
  canEdit: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const pickingFor = useRef<number | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);

  function deleteSaved(position: number) {
    startTransition(async () => {
      const body = new FormData();
      body.set("position", String(position));
      try {
        setResult(await deleteDraftEvidenceAction(initialState, body));
      } catch {
        setResult({ message: "Falha de conexão. Tente apagar de novo.", success: false });
      }
      setConfirmingDelete(null);
    });
  }
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<FormState>(initialState);
  // Stories que o servidor recusou ou que perderam a conexão no último envio.
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const forgetFailed = (positions: number[]) =>
    setFailed((current) => {
      const next = new Set(current);
      positions.forEach((position) => next.delete(position));
      return next;
    });
  const [progress, setProgress] = useState("");
  const [pending, startTransition] = useTransition();
  const hasAccounts = socialAccounts.length > 0;
  const singleAccount = socialAccounts.length === 1 ? socialAccounts[0] : null;

  // As prévias locais ocupam memória: são liberadas quando a tela fecha.
  const draftsRef = useRef(drafts);
  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);
  useEffect(
    () => () => draftsRef.current.forEach((draft) => URL.revokeObjectURL(draft.url)),
    [],
  );

  function pick(position: number | null) {
    if (!hasAccounts) {
      setNotice("Cadastre uma rede social antes de enviar as evidências.");
      return;
    }
    setNotice("");
    pickingFor.current = position;
    fileInput.current?.click();
  }

  function removeDraft(position: number) {
    setDrafts((current) => {
      current
        .filter((draft) => draft.position === position)
        .forEach((draft) => URL.revokeObjectURL(draft.url));
      return current.filter((draft) => draft.position !== position);
    });
    forgetFailed([position]);
  }

  function cancelAll() {
    drafts.forEach((draft) => URL.revokeObjectURL(draft.url));
    setDrafts([]);
    setFailed(new Set());
    setResult(initialState);
  }

  // Os arquivos escolhidos vão para o quadro tocado e, em seguida, para os
  // quadros vazios, em ordem. Assim dá para escolher vários prints de uma vez.
  function receiveFiles(files: File[]) {
    const valid = files.filter(
      (file) => acceptedTypes.includes(file.type) && file.size <= maximumBytes,
    );
    const skipped = files.length - valid.length;
    const taken = new Set(drafts.map((draft) => draft.position));
    const free = slots
      .filter((slot) => !slot.uploaded && !taken.has(slot.position))
      .map((slot) => slot.position);
    const first = pickingFor.current;
    const targets =
      first === null ? free : [first, ...free.filter((p) => p !== first)];

    const added: Draft[] = valid
      .slice(0, targets.length)
      .map((file, index) => ({
        position: targets[index],
        file,
        url: URL.createObjectURL(file),
      }));
    const leftOut = valid.length - added.length;

    setDrafts((current) => {
      const replaced = new Set(added.map((draft) => draft.position));
      current
        .filter((draft) => replaced.has(draft.position))
        .forEach((draft) => URL.revokeObjectURL(draft.url));
      return [...current.filter((draft) => !replaced.has(draft.position)), ...added]
        .sort((a, b) => a.position - b.position);
    });
    // Um print novo no lugar de um que falhou recomeça sem a marca de erro.
    forgetFailed(added.map((draft) => draft.position));
    setResult(initialState);

    const warnings = [];
    if (skipped > 0)
      warnings.push(
        `${skipped} arquivo(s) ignorado(s): use JPEG, PNG ou WebP de até 8 MB.`,
      );
    if (leftOut > 0)
      warnings.push(`Não há quadro livre para ${leftOut} arquivo(s).`);
    setNotice(warnings.join(" "));
  }

  // Um clique salva todos os Stories. Cada um vai em um envio próprio (o
  // servidor aceita até 10 MB por envio) e, se algum falhar, os outros ficam
  // salvos e o que falhou continua na tela para corrigir.
  function saveAll(form: HTMLFormElement) {
    const data = new FormData(form);
    const queue = [...drafts];
    startTransition(async () => {
      const saved: number[] = [];
      const failed: string[] = [];
      const failedPositions: number[] = [];
      for (const [index, draft] of queue.entries()) {
        setProgress(`Enviando ${index + 1} de ${queue.length}…`);
        const body = new FormData();
        body.set("evidence", draft.file);
        body.set("position", String(draft.position));
        body.set(
          "socialAccountId",
          String(data.get(`socialAccountId-${draft.position}`) ?? ""),
        );
        body.set(
          "storyPublishedOn",
          String(data.get(`storyPublishedOn-${draft.position}`) ?? ""),
        );
        body.set(
          "viewsReported",
          String(data.get(`viewsReported-${draft.position}`) ?? ""),
        );
        try {
          const response = await uploadStoryEvidenceAction(initialState, body);
          if (response.success) saved.push(draft.position);
          else {
            failed.push(`Story ${draft.position}: ${response.message}`);
            failedPositions.push(draft.position);
          }
        } catch {
          failed.push(
            `Story ${draft.position}: falha de conexão. Tente de novo.`,
          );
          failedPositions.push(draft.position);
        }
      }

      setProgress("");
      setFailed(new Set(failedPositions));
      const savedSet = new Set(saved);
      setDrafts((current) => {
        current
          .filter((draft) => savedSet.has(draft.position))
          .forEach((draft) => URL.revokeObjectURL(draft.url));
        return current.filter((draft) => !savedSet.has(draft.position));
      });
      if (fileInput.current) fileInput.current.value = "";

      const parts = [];
      if (saved.length)
        parts.push(
          `${listPositions(saved)} ${saved.length === 1 ? "salvo" : "salvos"}.`,
        );
      parts.push(...failed);
      setResult({ message: parts.join(" "), success: failed.length === 0 });
    });
  }

  // Datas no fuso de quem está usando (toISOString usaria o horário UTC e,
  // à noite no Brasil, já mostraria o dia seguinte).
  const localDate = (time: number) => {
    const date = new Date(time);
    return new Date(time - date.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 10);
  };
  const today = localDate(Date.now());
  const earliest =
    maxStoryAgeDays === null
      ? undefined
      : localDate(Date.now() - maxStoryAgeDays * 86_400_000);
  const draftByPosition = new Map(drafts.map((draft) => [draft.position, draft]));
  const freeCount = slots.filter(
    (slot) => !slot.uploaded && !draftByPosition.has(slot.position),
  ).length;

  return (
    <form
      className={styles.board}
      onSubmit={(event) => {
        event.preventDefault();
        if (!pending && drafts.length) saveAll(event.currentTarget);
      }}
    >
      <ol className={styles.grid} aria-label="Evidências dos Stories">
        {slots.map((slot) => {
          const draft = draftByPosition.get(slot.position);
          const imageUrl = draft ? draft.url : slot.imageUrl;
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
              {slot.position <= requiredCount && (
                <span className={styles.required} title="Obrigatória">
                  *<span className={styles.srOnly}> obrigatória</span>
                </span>
              )}
              <span
                className={`${styles.status} ${
                  draft && failed.has(slot.position) && !pending
                    ? styles.statusAlert
                    : draft
                    ? styles.statusDraft
                    : slot.needsAttention
                      ? styles.statusAlert
                      : slot.uploaded
                        ? styles.statusDone
                        : ""
                }`}
              >
                {draft
                  ? pending
                    ? "Enviando…"
                    : failed.has(slot.position)
                      ? "Não foi salvo"
                      : "Falta salvar"
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
                  className={`${styles.tile} ${draft ? styles.tileActive : ""}`}
                  onClick={() => pick(slot.position)}
                  disabled={pending}
                  aria-label={`Story ${slot.position}: ${
                    slot.uploaded || draft ? "trocar imagem" : "adicionar imagem"
                  }`}
                >
                  {content}
                </button>
              ) : (
                <div className={styles.tile}>{content}</div>
              )}
              {slot.meta && !draft && (
                <span className={styles.meta}>{slot.meta}</span>
              )}
              {slot.reason && !draft && (
                <p className={styles.reason}>{slot.reason}</p>
              )}
              {canDelete && slot.uploaded && !draft &&
                (confirmingDelete === slot.position ? (
                  <div className={styles.deleteConfirm} role="alert">
                    <span>Apagar o Story {slot.position}?</span>
                    <button
                      key="confirm-delete"
                      type="button"
                      className={styles.deleteYes}
                      onClick={() => deleteSaved(slot.position)}
                      disabled={pending}
                    >
                      {pending ? "Apagando…" : "Apagar"}
                    </button>
                    <button
                      key="cancel-delete"
                      type="button"
                      className={styles.deleteNo}
                      onClick={() => setConfirmingDelete(null)}
                      disabled={pending}
                    >
                      Manter
                    </button>
                  </div>
                ) : (
                  <button
                    key="start-delete"
                    type="button"
                    className={styles.deleteLink}
                    onClick={() => setConfirmingDelete(slot.position)}
                    disabled={pending}
                    aria-label={`Apagar a evidência do Story ${slot.position}`}
                  >
                    Apagar
                  </button>
                ))}
            </li>
          );
        })}
      </ol>

      {canEdit && freeCount > 1 && (
        <button
          type="button"
          className={styles.addMany}
          onClick={() => pick(null)}
          disabled={pending}
        >
          Escolher vários prints de uma vez
        </button>
      )}

      <input
        ref={fileInput}
        className={styles.fileInput}
        type="file"
        accept={acceptedTypes.join(",")}
        multiple
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = "";
          if (files.length) receiveFiles(files);
        }}
      />

      {notice && (
        <p className="form-message error" role="status">
          {notice}{" "}
          {!hasAccounts && <a href="#redes">Ir para redes sociais</a>}
        </p>
      )}

      {!canEdit && (
        <p className={styles.locked}>
          As evidências só podem ser alteradas em rascunho ou correção.
        </p>
      )}

      {drafts.length > 0 && (
        <div className={styles.details}>
          <div>
            <p className={styles.detailsTitle}>Dados de cada Story</p>
            <p className={styles.detailsHint}>
              Preencha a data e as visualizações que aparecem em cada print
              {minimumViews > 0 &&
                ` (mínimo de ${minimumViews.toLocaleString("pt-BR")})`}
              . Tudo é salvo de uma vez.
            </p>
          </div>

          <ul className={styles.rows}>
            {drafts.map((draft) => (
              <li key={draft.position} className={styles.row}>
                <div className={styles.rowHead}>
                  <span className={styles.rowNumber}>{draft.position}</span>
                  <span className={styles.rowName}>
                    Story {draft.position}
                    <span>{draft.file.name}</span>
                  </span>
                </div>
                <div className={styles.fields}>
                  {singleAccount ? (
                    <input
                      type="hidden"
                      name={`socialAccountId-${draft.position}`}
                      value={singleAccount.id}
                    />
                  ) : (
                    <label className="field">
                      <span>Rede</span>
                      <select
                        name={`socialAccountId-${draft.position}`}
                        defaultValue=""
                        required
                      >
                        <option value="" disabled>
                          Selecione
                        </option>
                        {socialAccounts.map((account) => (
                          <option value={account.id} key={account.id}>
                            {platformLabels[account.platform] ?? account.platform}{" "}
                            @{account.handle}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="field">
                    <span>Data do Story</span>
                    <input
                      name={`storyPublishedOn-${draft.position}`}
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
                      name={`viewsReported-${draft.position}`}
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
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => removeDraft(draft.position)}
                  disabled={pending}
                  aria-label={`Remover o Story ${draft.position}`}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>

          {singleAccount && (
            <p className={styles.detailsHint}>
              Rede: {platformLabels[singleAccount.platform] ?? singleAccount.platform}{" "}
              @{singleAccount.handle}
            </p>
          )}

          <div className={styles.actions}>
            <button className={styles.save} type="submit" disabled={pending}>
              {pending
                ? progress || "Enviando…"
                : failed.size > 0
                  ? drafts.length === 1
                    ? "Tentar enviar de novo"
                    : `Tentar enviar de novo (${drafts.length})`
                  : drafts.length === 1
                  ? "Salvar evidência"
                  : `Salvar ${drafts.length} evidências`}
            </button>
            <button
              className={styles.cancel}
              type="button"
              onClick={cancelAll}
              disabled={pending}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {result.message && (
        <p
          className={result.success ? "form-message success" : "form-message error"}
          role="status"
          aria-live="polite"
        >
          {result.message}
        </p>
      )}
    </form>
  );
}
