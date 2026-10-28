"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  removePresentationVideoAction,
  savePresentationVideoAction,
} from "@/app/actions/site";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { FormState } from "@/lib/validation/auth";
import styles from "./presentation-video-form.module.css";

const maximumBytes = 50 * 1024 * 1024;
const acceptedTypes = ["video/mp4", "video/webm"];

// Envia o arquivo direto ao Storage informando o progresso (o cliente do
// Supabase não informa). Mesmo endereço e mesmas regras de acesso do
// supabase.storage.upload, com a sessão de quem está logado.
function uploadWithProgress(
  path: string,
  file: File,
  accessToken: string,
  onProgress: (percent: number) => void,
) {
  return new Promise<boolean>((resolve) => {
    const request = new XMLHttpRequest();
    request.open(
      "POST",
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/site-media/${path}`,
    );
    request.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    request.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
    request.setRequestHeader("Content-Type", file.type);
    request.setRequestHeader("Cache-Control", "max-age=3600");
    request.setRequestHeader("x-upsert", "false");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => resolve(request.status >= 200 && request.status < 300);
    request.onerror = () => resolve(false);
    request.send(file);
  });
}

export function PresentationVideoForm({
  currentUrl,
}: {
  currentUrl: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<FormState>({ message: "", success: false });
  // Porcentagem enviada (null quando não há envio em andamento).
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const busy = pending || progress !== null;

  // Durante o envio, avisa antes de fechar ou recarregar a página.
  useEffect(() => {
    if (progress === null) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [progress]);

  async function upload(file: File) {
    if (!acceptedTypes.includes(file.type)) {
      setState({ message: "Envie um vídeo MP4 ou WebM.", success: false });
      return;
    }
    if (file.size > maximumBytes) {
      setState({ message: "O vídeo precisa ter até 50 MB.", success: false });
      return;
    }

    setProgress(0);
    setState({ message: "", success: false });
    const extension = file.type === "video/webm" ? "webm" : "mp4";
    const path = `presentation/${crypto.randomUUID()}.${extension}`;
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const uploaded = data.session
      ? await uploadWithProgress(path, file, data.session.access_token, setProgress)
      : false;
    setProgress(null);
    if (!uploaded) {
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
          {progress !== null
            ? `Enviando… ${progress}%`
            : pending
              ? "Salvando…"
              : currentUrl
                ? "Trocar vídeo"
                : "Enviar vídeo"}
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
      {progress !== null && (
        <div className={styles.progress}>
          <progress max={100} value={progress} aria-label="Envio do vídeo" />
          <span>
            {progress}% enviado. Mantenha esta página aberta até terminar.
          </span>
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
