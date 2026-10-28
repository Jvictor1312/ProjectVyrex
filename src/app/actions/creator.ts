"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
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

  const { supabase, user } = await requireUser();
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
        "Não foi possível salvar o perfil. Verifique se o banco já foi configurado.",
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

  const { supabase, user } = await requireUser();
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
  if (
    !parsed.success ||
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > maximumEvidenceBytes
  ) {
    return {
      message:
        "Selecione uma imagem JPEG, PNG ou WebP de até 8 MB e confira os campos.",
      success: false,
    };
  }

  const { supabase, user } = await requireUser();
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
  } catch {
    return {
      message:
        "Não foi possível ler essa imagem. Tente enviar outro arquivo válido.",
      success: false,
    };
  }
}

export async function submitCreatorApplicationAction(
  _state: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _state;
  void _formData;
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("submit_creator_application");

  return error
    ? {
        message:
          "Confira o nome público, informe pelo menos uma rede social e envie as evidências obrigatórias com as visualizações mínimas, em ordem cronológica e dentro do prazo.",
        success: false,
      }
    : {
        message: "Cadastro encaminhado. A equipe fará a validação manual.",
        success: true,
      };
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

  const { supabase, user } = await requireUser();
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
