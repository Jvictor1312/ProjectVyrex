"use client";

import { useRef, useState, useTransition } from "react";
import {
  removePresentationVideoAction,
  savePresentationVideoAction,
} from "@/app/actions/site";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { FormState } from "@/lib/validation/auth";
import styles from "./presentation-video-form.module.css";

const maximumBytes = 50 * 1024 * 1024;
const acceptedTypes = ["video/mp4", "video/webm"];

export function PresentationVideoForm({
  currentUrl,
}: {
  currentUrl: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<FormState>({ message: "", success: false });
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const busy = pending || progress !== null;

  async function upload(file: File) {
    if (!acceptedTypes.includes(file.type)) {
      setState({ message: "Envie um vídeo MP4 ou WebM.", success: false });
      return;
    }
    if (file.size > maximumBytes) {
      setState({ message: "O vídeo precisa ter até 50 MB.", success: false });
      return;
    }

    setProgress("Enviando vídeo…");
    setState({ message: "", success: false });
    const extension = file.type === "video/webm" ? "webm" : "mp4";
    const path = `presentation/${crypto.randomUUID()}.${extension}`;
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.storage
      .from("site-media")
      .upload(path, file, { contentType: file.type, cacheControl: "3600" });
    setProgress(null);
    if (error) {
      setState({
        message: "Não foi possível enviar o vídeo. Tente de novo.",
        success: false,
      });
      return;
    }
    startTransition(async () => {
      setState(await savePresentationVideoAction(path));
      if (input.current) input.current.value = "";
    });
  }

  return (
    <div className={styles.wrap}>
      {currentUrl ? (
        <video className={styles.preview} src={currentUrl} controls preload="metadata" />
      ) : (
        <p className={styles.empty}>Nenhum vídeo enviado.</p>
      )}
      <input
        ref={input}
        className={styles.fileInput}
        type="file"
        accept={acceptedTypes.join(",")}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void upload(file);
        }}
      />
      <div className={styles.actions}>
        <button
          className={styles.primary}
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {progress ?? (currentUrl ? "Trocar vídeo" : "Enviar vídeo")}
        </button>
        {currentUrl && !confirmingRemoval && (
          <button
            key="remove"
            className={styles.danger}
            type="button"
            disabled={busy}
            onClick={() => setConfirmingRemoval(true)}
          >
            Remover vídeo
          </button>
        )}
      </div>
      {currentUrl && confirmingRemoval && (
        <div className={styles.confirm} role="alert">
          <p>
            Remover o vídeo de apresentação? A tela de cadastro deixa de
            mostrá-lo até um novo vídeo ser enviado.
          </p>
          <div className={styles.actions}>
            <button
              key="confirm-remove"
              className={styles.dangerSolid}
              type="button"
              disabled={busy}
              onClick={() =>
                startTransition(async () => {
                  setState(await removePresentationVideoAction());
                  setConfirmingRemoval(false);
                })
              }
            >
              {pending ? "Removendo…" : "Confirmar remoção"}
            </button>
            <button
              key="cancel-remove"
              className={styles.secondary}
              type="button"
              disabled={busy}
              onClick={() => setConfirmingRemoval(false)}
            >
              Manter vídeo
            </button>
          </div>
        </div>
      )}
      <p className={styles.hint}>MP4 ou WebM, até 50 MB.</p>
      {state.message && (
        <p
          className={state.success ? "form-message success" : "form-message error"}
          role="status"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
