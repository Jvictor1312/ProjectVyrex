"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  disconnectInstagramAction,
  refreshCreatorInstagramMetricsAction,
  refreshOwnInstagramMetricsAction,
  reviewMetricRecordingAction,
  saveMetricRecordingAction,
} from "@/app/actions/instagram";
import {
  connectionNotices,
  connectionStatusLabels,
  formatDuration,
  recordingStatusLabels,
  syncErrorLabels,
} from "@/lib/instagram/labels";
import type { MetricVerificationData } from "@/lib/instagram/view-data";
import {
  maximumRecordingBytes,
  maximumRecordingSeconds,
  minimumRecordingSeconds,
  recordingBucket,
  recordingExtension,
  type RecordingType,
} from "@/lib/recordings/video";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { FormState } from "@/lib/validation/auth";
import { InstagramMetricsSummary } from "./instagram-metrics-summary";
import styles from "./metric-verification.module.css";

const emptyState: FormState = { message: "", success: false };

function Message({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      className={state.success ? "form-message success" : "form-message error"}
      role={state.success ? "status" : "alert"}
    >
      {state.message}
    </p>
  );
}

// Atualiza as métricas pela API (o criador as próprias; a equipe, de quem
// ela pode acessar).
export function InstagramRefreshButton({ creatorId }: { creatorId?: string }) {
  const [state, setState] = useState<FormState>(emptyState);
  const [pending, startTransition] = useTransition();
  return (
    <div className={styles.inline}>
      <button
        type="button"
        className="quiet-button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setState(
              creatorId
                ? await refreshCreatorInstagramMetricsAction(creatorId)
                : await refreshOwnInstagramMetricsAction(),
            );
          })
        }
      >
        {pending ? "Consultando o Instagram…" : "Atualizar métricas"}
      </button>
      <Message state={state} />
    </div>
  );
}

function DisconnectInstagramButton() {
  const [state, setState] = useState<FormState>(emptyState);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <div className={styles.inline}>
      {confirming ? (
        <div className={styles.confirm} role="alert">
          <p>
            Desconectar o Instagram? As métricas já consultadas continuam no
            cadastro, mas não poderão ser atualizadas.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className="button button-dark"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setState(await disconnectInstagramAction());
                  setConfirming(false);
                })
              }
            >
              {pending ? "Desconectando…" : "Confirmar"}
            </button>
            <button
              type="button"
              className="quiet-button"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Manter conectado
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="quiet-button" onClick={() => setConfirming(true)}>
          Desconectar
        </button>
      )}
      <Message state={state} />
    </div>
  );
}

function typeOf(file: File): RecordingType | null {
  if (file.type === "video/mp4" || file.type === "video/quicktime") return file.type;
  // Alguns celulares não informam o tipo; a extensão serve de pista (o
  // servidor confere o conteúdo de verdade).
  const name = file.name.toLowerCase();
  if (name.endsWith(".mp4")) return "video/mp4";
  if (name.endsWith(".mov")) return "video/quicktime";
  return null;
}

// Duração lida pelo próprio navegador, antes de enviar. Se não der para
// ler, o servidor confere depois.
function readDuration(file: File) {
  return new Promise<number | null>((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () =>
      done(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => done(null);
    video.src = url;
  });
}

function uploadWithProgress(
  path: string,
  file: File,
  type: RecordingType,
  accessToken: string,
  onProgress: (percent: number) => void,
) {
  return new Promise<boolean>((resolve) => {
    const request = new XMLHttpRequest();
    request.open(
      "POST",
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${recordingBucket}/${path}`,
    );
    request.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    request.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
    request.setRequestHeader("Content-Type", type);
    request.setRequestHeader("x-upsert", "false");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => resolve(request.status >= 200 && request.status < 300);
    request.onerror = () => resolve(false);
    request.send(file);
  });
}

function RecordingUpload({ userId, hasRecording }: { userId: string; hasRecording: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<FormState>(emptyState);
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = pending || progress !== null;

  useEffect(() => {
    if (progress === null) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [progress]);

  async function upload(file: File) {
    const type = typeOf(file);
    if (!type) {
      setState({ message: "Envie a gravação em MP4 ou MOV (o formato padrão do celular).", success: false });
      return;
    }
    if (file.size > maximumRecordingBytes) {
      setState({
        message: "A gravação precisa ter até 50 MB. Grave um vídeo mais curto, só com o necessário.",
        success: false,
      });
      return;
    }
    const duration = await readDuration(file);
    if (duration !== null && (duration < minimumRecordingSeconds || duration > maximumRecordingSeconds)) {
      setState({
        message: `A gravação precisa ter entre ${minimumRecordingSeconds} segundos e ${maximumRecordingSeconds / 60} minutos. Esta tem ${formatDuration(duration)}.`,
        success: false,
      });
      return;
    }

    setState(emptyState);
    setProgress(0);
    const path = `${userId}/${crypto.randomUUID()}.${recordingExtension(type)}`;
    const { data } = await createSupabaseBrowserClient().auth.getSession();
    const uploaded = data.session
      ? await uploadWithProgress(path, file, type, data.session.access_token, setProgress)
      : false;
    setProgress(null);
    if (!uploaded) {
      setState({
        message: "Não foi possível enviar a gravação. Confira a conexão e tente de novo.",
        success: false,
      });
      return;
    }
    startTransition(async () => {
      setState(await saveMetricRecordingAction(path));
      if (input.current) input.current.value = "";
    });
  }

  return (
    <div className={styles.upload}>
      <input
        ref={input}
        className={styles.fileInput}
        type="file"
        accept="video/mp4,video/quicktime,.mp4,.mov"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void upload(file);
        }}
      />
      <button
        type="button"
        className="button button-dark"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {progress !== null
          ? `Enviando… ${progress}%`
          : pending
            ? "Conferindo o vídeo…"
            : hasRecording
              ? "Trocar gravação"
              : "Enviar gravação"}
      </button>
      {progress !== null && (
        <div className={styles.progress}>
          <progress max={100} value={progress} aria-label="Envio da gravação" />
          <span>{progress}% enviado. Mantenha esta página aberta até terminar.</span>
        </div>
      )}
      <Message state={state} />
    </div>
  );
}

export function CreatorMetricVerification({
  configured,
  data,
  canEdit,
  userId,
  declaredHandle,
  declaredFollowers,
  notice,
}: {
  configured: boolean;
  data: MetricVerificationData;
  canEdit: boolean;
  userId: string;
  declaredHandle: string | null;
  declaredFollowers: number | null;
  notice?: string;
}) {
  const { connection, snapshot, recording } = data;
  const live = connection && ["active", "reconnect_required"].includes(connection.status);
  const noticeState = notice ? connectionNotices[notice] : undefined;

  return (
    <div className={styles.block} id="metricas">
      <h3>Comprovar suas métricas do Instagram</h3>
      <p className="field-hint">
        Opcional, mas ajuda a equipe a confirmar seus números. Escolha um dos
        dois jeitos. Os números que você informou continuam valendo; a equipe
        vê a diferença entre o que foi informado, o que veio do Instagram e o
        que aparece na gravação.
      </p>
      {noticeState && <Message state={noticeState} />}
      {data.loadError && (
        <p className="form-message error" role="alert">
          Não foi possível carregar a verificação. Recarregue a página.
        </p>
      )}

      <div className={styles.options}>
        <article className={styles.option}>
          <h4>1. Conectar o Instagram</h4>
          <p className={styles.hint}>
            Para contas profissionais (comercial ou de criador de conteúdo). Você
            entra na tela oficial do Instagram; a Vyrex nunca vê sua senha. Lemos
            seguidores, visualizações e alcance da conta e dos Stories no ar.
          </p>
          {!configured ? (
            <p className={styles.unavailable}>
              A conexão com o Instagram ainda não está disponível na Vyrex. Use a
              gravação de tela.
            </p>
          ) : live ? (
            <>
              <p className={styles.status}>
                <strong>{connectionStatusLabels[connection.status]}</strong>
                {" · "}@{connection.username}
              </p>
              {connection.status === "reconnect_required" && (
                <p className={styles.warning} role="note">
                  O acesso venceu ou foi removido. As métricas abaixo são da última
                  consulta; conecte de novo para atualizar.
                </p>
              )}
              {connection.lastSyncError && connection.status === "active" && (
                <p className={styles.hint}>
                  {syncErrorLabels[connection.lastSyncError] ?? syncErrorLabels.error}
                </p>
              )}
              <div className={styles.actions}>
                {connection.status === "active" ? (
                  <InstagramRefreshButton />
                ) : (
                  canEdit && (
                    <a className="button button-dark" href="/api/instagram/connect">
                      Conectar de novo
                    </a>
                  )
                )}
                <DisconnectInstagramButton />
              </div>
            </>
          ) : canEdit ? (
            <>
              {connection && (
                <p className={styles.hint}>
                  {connectionStatusLabels[connection.status] ?? connection.status}.
                </p>
              )}
              <a className="button button-dark" href="/api/instagram/connect">
                Conectar com o Instagram
              </a>
            </>
          ) : (
            <p className={styles.hint}>A conexão só pode ser feita com o cadastro em edição.</p>
          )}
          {snapshot && (
            <InstagramMetricsSummary
              snapshot={snapshot}
              accountType={connection?.accountType ?? null}
              declaredHandle={declaredHandle}
              declaredFollowers={declaredFollowers}
            />
          )}
        </article>

        <article className={styles.option}>
          <h4>2. Enviar uma gravação de tela</h4>
          <p className={styles.hint}>
            Serve para qualquer conta, inclusive pessoal. Grave a tela do
            celular, sem cortes, mostrando:
          </p>
          <ol className={styles.steps}>
            <li>seu perfil, com o @ e o número de seguidores;</li>
            <li>os Stories que você enviou como evidência;</li>
            <li>
              as estatísticas (Insights) de cada um, com as visualizações. Em
              conta pessoal, mostre a lista de quem viu.
            </li>
          </ol>
          <p className={styles.hint}>
            MP4 ou MOV, de {minimumRecordingSeconds} segundos a{" "}
            {maximumRecordingSeconds / 60} minutos, até 50 MB. Só você e a equipe
            da Vyrex que analisa o cadastro podem assistir.
          </p>
          {recording && (
            <div className={styles.recording}>
              {recording.url && (
                <video
                  className={styles.video}
                  src={recording.url}
                  controls
                  preload="metadata"
                  playsInline
                />
              )}
              <p className={styles.status}>
                <strong>{recordingStatusLabels[recording.status] ?? recording.status}</strong>
                {" · "}
                {formatDuration(recording.durationSeconds)} · enviada em{" "}
                {new Date(recording.createdAt).toLocaleDateString("pt-BR")}
              </p>
              {recording.reason && <p className="decision-reason">{recording.reason}</p>}
            </div>
          )}
          {canEdit ? (
            <RecordingUpload userId={userId} hasRecording={Boolean(recording)} />
          ) : (
            !recording && (
              <p className={styles.hint}>A gravação só pode ser enviada com o cadastro em edição.</p>
            )
          )}
        </article>
      </div>
    </div>
  );
}

export function RecordingReviewForm({
  recordingId,
  creatorId,
}: {
  recordingId: string;
  creatorId: string;
}) {
  const [state, action, pending] = useActionState(reviewMetricRecordingAction, emptyState);
  return (
    <form action={action} className={styles.reviewForm}>
      <input type="hidden" name="recordingId" value={recordingId} />
      <input type="hidden" name="creatorId" value={creatorId} />
      <select name="decision" defaultValue="approved" aria-label="Resultado da gravação">
        <option value="approved">Aprovar gravação</option>
        <option value="rejected">Recusar gravação</option>
      </select>
      <input
        name="reason"
        maxLength={2000}
        placeholder="Motivo se recusada"
        aria-label="Motivo da conferência da gravação"
      />
      <button type="submit" disabled={pending}>
        {pending ? "Registrando…" : "Registrar resultado"}
      </button>
      <Message state={state} />
    </form>
  );
}
