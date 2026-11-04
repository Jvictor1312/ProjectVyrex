"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  disconnectInstagram,
  syncInstagramMetrics,
  type SyncOutcome,
} from "@/lib/instagram/service";
import {
  detectRecordingType,
  maximumRecordingBytes,
  maximumRecordingSeconds,
  minimumRecordingSeconds,
  readRecordingDuration,
  recordingBucket,
  recordingPathPattern,
} from "@/lib/recordings/video";
import type { FormState } from "@/lib/validation/auth";

const syncMessages: Record<SyncOutcome, FormState> = {
  synced: { message: "Métricas atualizadas pela API do Instagram.", success: true },
  not_configured: {
    message: "A conexão com o Instagram ainda não está disponível na Vyrex.",
    success: false,
  },
  not_connected: { message: "Nenhuma conta do Instagram conectada.", success: false },
  reconnect_required: {
    message:
      "O acesso ao Instagram venceu ou foi removido. Conecte a conta de novo para atualizar as métricas.",
    success: false,
  },
  too_soon: {
    message: "As métricas foram consultadas há poucos minutos. Tente de novo daqui a pouco.",
    success: false,
  },
  rate_limited: {
    message: "O Instagram limitou as consultas por agora. Tente de novo mais tarde.",
    success: false,
  },
  failed: {
    message: "Não foi possível consultar o Instagram agora. Tente de novo mais tarde.",
    success: false,
  },
};

function refreshCreatorScreens(creatorId: string) {
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard");
  revalidatePath(`/interno/${creatorId}`);
}

const inactiveAccount: FormState = {
  message: "Sua conta está desativada. Fale com a equipe da Vyrex.",
  success: false,
};

// O serviço grava com a chave de serviço, que ignora as regras do banco;
// por isso a conta ativa é conferida aqui, com a sessão do próprio usuário.
async function requireActiveSession() {
  const session = await requireSession();
  const { data: active } = await session.supabase.rpc("account_is_active");
  return { ...session, active: active === true };
}

// O criador atualiza as próprias métricas.
export async function refreshOwnInstagramMetricsAction(): Promise<FormState> {
  const { user, active } = await requireActiveSession();
  if (!active) return inactiveAccount;
  const outcome = await syncInstagramMetrics(user.id, user.id);
  refreshCreatorScreens(user.id);
  return syncMessages[outcome];
}

// A equipe de validação atualiza as métricas de um criador que pode acessar.
export async function refreshCreatorInstagramMetricsAction(
  creatorId: string,
): Promise<FormState> {
  if (!z.uuid().safeParse(creatorId).success) {
    return { message: "Criador inválido.", success: false };
  }
  const { supabase, user } = await requireSession();
  const [{ data: canReview }, { data: canAccess }] = await Promise.all([
    supabase.rpc("has_permission", { permission_name: "creators.validation.review" }),
    supabase.rpc("can_access_creator", { target_creator: creatorId }),
  ]);
  if (!canReview || !canAccess) {
    return { message: "Você não tem permissão para esta ação.", success: false };
  }
  const outcome = await syncInstagramMetrics(creatorId, user.id);
  refreshCreatorScreens(creatorId);
  return syncMessages[outcome];
}

export async function disconnectInstagramAction(): Promise<FormState> {
  const { user, active } = await requireActiveSession();
  if (!active) return inactiveAccount;
  const done = await disconnectInstagram(user.id);
  refreshCreatorScreens(user.id);
  return done
    ? {
        message:
          "Instagram desconectado. Para tirar também o acesso do lado da Meta, remova a Vyrex em Configurações > Apps e sites no Instagram.",
        success: true,
      }
    : { message: "Nenhuma conta do Instagram conectada.", success: false };
}

// Registra a gravação de tela que o navegador já enviou ao Storage. O
// servidor baixa o arquivo, confere que é mesmo um vídeo MP4/MOV, o tamanho
// e a duração; se algo não bater, o arquivo enviado é removido. Só então a
// gravação é registrada, por uma função do banco que apenas o servidor
// executa, para o criador da sessão (nunca um id vindo do navegador).
export async function saveMetricRecordingAction(path: unknown): Promise<FormState> {
  const { supabase, user, active } = await requireActiveSession();
  if (!active) return inactiveAccount;
  const match = typeof path === "string" ? recordingPathPattern.exec(path) : null;
  if (typeof path !== "string" || !match || match[1] !== user.id) {
    return { message: "Arquivo de gravação inválido.", success: false };
  }
  const discard = async (message: string): Promise<FormState> => {
    await supabase.storage.from(recordingBucket).remove([path]);
    return { message, success: false };
  };

  // Sem a chave de serviço não há como registrar: o arquivo que o navegador
  // já enviou é removido para não ficar abandonado no Storage.
  const admin = createSupabaseAdminClient();
  if (!admin) return discard("O envio de gravações ainda não está disponível.");

  const { data: file, error: downloadError } = await supabase.storage
    .from(recordingBucket)
    .download(path);
  if (downloadError || !file) {
    return { message: "Não encontramos a gravação enviada. Tente enviar de novo.", success: false };
  }
  if (file.size === 0 || file.size > maximumRecordingBytes) {
    return discard("A gravação precisa ter até 50 MB.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  // MP4 e MOV têm a mesma estrutura; basta ser um dos dois de verdade.
  const expected = match[3] === "mov" ? "video/quicktime" : "video/mp4";
  if (!detectRecordingType(bytes)) {
    return discard("Envie a gravação em MP4 ou MOV (o formato padrão do celular).");
  }
  const duration = readRecordingDuration(bytes);
  if (duration === null) {
    return discard("Não foi possível ler a duração do vídeo. Grave de novo e envie o arquivo original.");
  }
  if (duration < minimumRecordingSeconds || duration > maximumRecordingSeconds) {
    return discard(
      `A gravação precisa ter entre ${minimumRecordingSeconds} segundos e ${maximumRecordingSeconds / 60} minutos.`,
    );
  }

  const { data: previous, error } = await admin.rpc("save_creator_metric_recording", {
    target_creator: user.id,
    recording_path: path,
    recording_content_type: expected,
    recording_size: file.size,
    recording_duration: Math.round(duration * 10) / 10,
  });
  if (error) {
    return discard(
      error.message.includes("not editable")
        ? "A gravação só pode ser trocada enquanto o cadastro está em edição."
        : "Não foi possível salvar a gravação. Tente de novo.",
    );
  }
  if (typeof previous === "string" && previous) {
    await supabase.storage.from(recordingBucket).remove([previous]);
  }
  refreshCreatorScreens(user.id);
  return { message: "Gravação salva. A equipe vai conferir junto com o cadastro.", success: true };
}

export async function reviewMetricRecordingAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({
      recordingId: z.uuid(),
      creatorId: z.uuid(),
      decision: z.enum(["approved", "rejected"]),
      reason: z.string().trim().max(2000),
    })
    .safeParse({
      recordingId: formData.get("recordingId"),
      creatorId: formData.get("creatorId"),
      decision: formData.get("decision"),
      reason: formData.get("reason") ?? "",
    });
  if (!parsed.success) return { message: "Confira os dados e tente novamente.", success: false };
  if (parsed.data.decision === "rejected" && !parsed.data.reason) {
    return { message: "Informe o motivo para recusar a gravação.", success: false };
  }

  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("review_metric_recording", {
    target_recording: parsed.data.recordingId,
    decision: parsed.data.decision,
    reason: parsed.data.reason,
  });
  if (error) {
    return {
      message:
        "Você não tem permissão para esta ação, ou ela não se aplica à situação atual do cadastro.",
      success: false,
    };
  }
  revalidatePath("/interno");
  revalidatePath(`/interno/${parsed.data.creatorId}`);
  return {
    message: parsed.data.decision === "approved" ? "Gravação aprovada." : "Gravação recusada.",
    success: true,
  };
}
