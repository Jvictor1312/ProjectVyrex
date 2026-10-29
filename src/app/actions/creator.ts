"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { logServerError } from "@/lib/log";
import {
  maximumEvidenceBytes,
  normalizeEvidenceImage,
} from "@/lib/evidence/normalize";
import type { FormState } from "@/lib/validation/auth";
import {
  creatorProfileDraftSchema,
  evidenceMetadataSchema,
  socialAccountSchema,
} from "@/lib/validation/creator";

const errorState: FormState = {
  message: "Não foi possível salvar. Confira os dados e tente novamente.",
  success: false,
};
export async function saveCreatorProfileAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = creatorProfileDraftSchema.safeParse({
    publicName: formData.get("publicName") ?? "",
    city: formData.get("city") || undefined,
    region: formData.get("region") || undefined,
    biography: formData.get("biography") || undefined,
    categories: formData.getAll("categories"),
  });
  if (!parsed.success)
    return {
      message: parsed.error.issues[0]?.message ?? errorState.message,
      success: false,
    };

  const { supabase, user } = await requireSession();
  const { data, error } = await supabase
    .from("creator_profiles")
    .update({
      public_name: parsed.data.publicName,
      city: parsed.data.city || null,
      region: parsed.data.region || null,
      biography: parsed.data.biography || null,
      categories: parsed.data.categories,
    })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();

  if (error || !data) {
    return {
      message:
        "Não conseguimos salvar o perfil agora. Tente novamente em alguns minutos.",
      success: false,
    };
  }

  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard");
  return { message: "Rascunho salvo automaticamente.", success: true };
}

export async function saveSocialAccountAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const followers = Number(formData.get("followersReported"));
  const parsed = socialAccountSchema.safeParse({
    accountId: formData.get("accountId") || undefined,
    platform: formData.get("platform"),
    handle: formData.get("handle"),
    profileUrl: formData.get("profileUrl"),
    followersReported: followers,
  });
  if (!parsed.success)
    return {
      message: parsed.error.issues[0]?.message ?? errorState.message,
      success: false,
    };

  const { supabase, user } = await requireSession();
  const account = {
    platform: parsed.data.platform,
    handle: parsed.data.handle,
    profile_url: parsed.data.profileUrl,
    followers_reported: parsed.data.followersReported,
    followers_reported_at: new Date().toISOString(),
  };

  const result = parsed.data.accountId
    ? await supabase
        .from("social_accounts")
        .update(account)
        .eq("id", parsed.data.accountId)
        .eq("creator_id", user.id)
        .select("id")
        .maybeSingle()
    : await supabase
        .from("social_accounts")
        .insert({ ...account, creator_id: user.id })
        .select("id")
        .single();

  if (result.error || !result.data) {
    return {
      message:
        "Não foi possível salvar a rede social. Verifique os dados e tente novamente.",
      success: false,
    };
  }

  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard");
  return {
    message: "Rede social salva. A equipe vai conferir os números.",
    success: true,
  };
}

export async function uploadStoryEvidenceAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const file = formData.get("evidence");
  const parsed = evidenceMetadataSchema.safeParse({
    socialAccountId: formData.get("socialAccountId"),
    position: Number(formData.get("position")),
    storyPublishedOn: formData.get("storyPublishedOn"),
    viewsReported: Number(formData.get("viewsReported")),
    creatorNotes: formData.get("creatorNotes") || undefined,
  });
  // Mensagens separadas para arquivo e dados, para a pessoa saber o que corrigir.
  if (!(file instanceof File) || file.size === 0 || file.size > maximumEvidenceBytes) {
    return {
      message: "Use uma imagem JPEG, PNG ou WebP de até 8 MB.",
      success: false,
    };
  }
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const messages: Record<string, string> = {
      socialAccountId: "Escolha a rede social em que o Story foi publicado.",
      position: "Quadro de evidência inválido. Recarregue a página e tente de novo.",
      storyPublishedOn: "Informe a data em que o Story foi publicado.",
      viewsReported: "Informe as visualizações com números inteiros.",
      creatorNotes: "A observação pode ter até 500 caracteres.",
    };
    return {
      message:
        (typeof field === "string" && messages[field]) ||
        "Confira os dados do Story e tente de novo.",
      success: false,
    };
  }

  const { supabase, user } = await requireSession();
  const existing = await supabase
    .from("metric_evidence")
    .select("id, storage_path")
    .eq("creator_id", user.id)
    .eq("position", parsed.data.position)
    .maybeSingle();
  if (existing.error) return errorState;

  const storagePath = `${user.id}/${randomUUID()}.webp`;

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const converted = await normalizeEvidenceImage(input);

    const { error: uploadError } = await supabase.storage
      .from("story-evidence")
      .upload(storagePath, converted, {
        contentType: "image/webp",
        cacheControl: "3600",
        upsert: true,
      });
    if (uploadError)
      return {
        message: "Não foi possível armazenar a imagem com segurança.",
        success: false,
      };

    const evidence = {
      social_account_id: parsed.data.socialAccountId,
      position: parsed.data.position,
      storage_path: storagePath,
      content_type: "image/webp",
      size_bytes: converted.byteLength,
      story_published_on: parsed.data.storyPublishedOn,
      views_reported: parsed.data.viewsReported,
      creator_notes: parsed.data.creatorNotes || null,
    };

    const result = existing.data
      ? await supabase
          .from("metric_evidence")
          .update(evidence)
          .eq("id", existing.data.id)
          .eq("creator_id", user.id)
          .select("id")
          .maybeSingle()
      : await supabase
          .from("metric_evidence")
          // O id é gerado pelo banco: o usuário não tem permissão para defini-lo.
          .insert({ ...evidence, creator_id: user.id })
          .select("id")
          .single();

    if (result.error || !result.data) {
      await supabase.storage.from("story-evidence").remove([storagePath]);
      return {
        message:
          "A imagem foi recebida, mas os dados não puderam ser salvos. Tente novamente.",
        success: false,
      };
    }

    if (existing.data && existing.data.storage_path !== storagePath) {
      await supabase.storage
        .from("story-evidence")
        .remove([existing.data.storage_path]);
    }

    revalidatePath("/dashboard/perfil");
    revalidatePath("/dashboard");
    return {
      message: `Evidência ${parsed.data.position} salva.`,
      success: true,
    };
  } catch (error) {
    // Quase sempre é um arquivo que não é imagem de verdade (aviso), mas
    // também pega falhas de rede no envio.
    logServerError("uploadStoryEvidenceAction", error, "aviso");
    return {
      message:
        "Não foi possível ler essa imagem. Tente enviar outro arquivo válido.",
      success: false,
    };
  }
}

// Erro de função ausente: a migration 202610280005 ainda não foi aplicada.
const featurePending = (code?: string, message?: string) =>
  code === "PGRST202" || /could not find the function/i.test(message ?? "");
const pendingMessage =
  "Este recurso ainda não está disponível: falta aplicar uma atualização no banco de dados.";

// Apaga uma evidência salva. O banco só permite no rascunho (antes do envio).
export async function deleteDraftEvidenceAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const position = Number(formData.get("position"));
  if (!Number.isInteger(position) || position < 1 || position > 5) {
    return { message: "Quadro de evidência inválido.", success: false };
  }

  const { supabase } = await requireSession();
  const { data, error } = await supabase.rpc("delete_own_draft_evidence", {
    target_position: position,
  });
  if (error) {
    if (featurePending(error.code, error.message))
      return { message: pendingMessage, success: false };
    return {
      message: /before the application is sent/i.test(error.message)
        ? "Depois do envio, as evidências não podem mais ser apagadas."
        : "Não foi possível apagar a evidência. Tente de novo.",
      success: false,
    };
  }

  // O registro já saiu do banco; o arquivo é removido em seguida.
  if (typeof data === "string" && data) {
    await supabase.storage.from("story-evidence").remove([data]);
  }
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard");
  return { message: `Evidência ${position} apagada.`, success: true };
}

// Retira o cadastro enviado, só enquanto a equipe não começou a análise.
export async function withdrawCreatorApplicationAction(
  _state: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _state;
  void _formData;
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("withdraw_creator_application");
  if (error) {
    if (featurePending(error.code, error.message))
      return { message: pendingMessage, success: false };
    return {
      message: /already started|awaiting review/i.test(error.message)
        ? "A equipe já começou a analisar seu cadastro; o envio não pode mais ser desfeito. Fale com a equipe pelas mensagens."
        : "Não foi possível desfazer o envio. Tente de novo.",
      success: false,
    };
  }

  revalidatePath("/dashboard", "layout");
  return {
    message: "Envio desfeito. Seu cadastro voltou para rascunho e pode ser editado.",
    success: true,
  };
}

export async function submitCreatorApplicationAction(
  _state: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _state;
  void _formData;
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("submit_creator_application");

  if (error) {
    return {
      message:
        "Confira o nome público, a rede social e as evidências obrigatórias (visualizações mínimas, ordem e prazo).",
      success: false,
    };
  }

  // Depois de enviar, a pessoa vai para a visão geral, que mostra a análise.
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function markNotificationReadAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({ notificationId: z.uuid() })
    .safeParse({ notificationId: formData.get("notificationId") });
  if (!parsed.success) {
    return { message: "Notificação inválida.", success: false };
  }

  const { supabase, user } = await requireSession();
  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data.notificationId)
    .eq("user_id", user.id)
    .is("read_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      message: "Não foi possível atualizar a notificação. Tente novamente.",
      success: false,
    };
  }

  if (!data) {
    const { data: existing, error: lookupError } = await supabase
      .from("notifications")
      .select("read_at")
      .eq("id", parsed.data.notificationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (lookupError || !existing?.read_at) {
      return {
        message: "Não foi possível localizar essa notificação.",
        success: false,
      };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notificacoes");
  return { message: "Notificação marcada como lida.", success: true };
}
