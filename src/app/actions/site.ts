"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { siteMediaBucket } from "@/lib/site-media";
import type { FormState } from "@/lib/validation/auth";

const videoPathPattern = /^presentation\/[0-9a-f-]{36}\.(mp4|webm)$/;

async function currentVideoPath() {
  const { supabase, user } = await requireSession();
  const { data: allowed } = await supabase.rpc("has_permission", {
    permission_name: "creators.configure_eligibility",
  });
  const { data } = await supabase
    .from("site_settings")
    .select("presentation_video_path")
    .eq("singleton", true)
    .maybeSingle();
  return {
    supabase,
    user,
    allowed: Boolean(allowed),
    path: data?.presentation_video_path ?? null,
  };
}

// Registra o vídeo que o navegador do administrador já enviou ao Storage.
export async function savePresentationVideoAction(
  path: string,
): Promise<FormState> {
  if (!videoPathPattern.test(path)) {
    return { message: "Arquivo de vídeo inválido.", success: false };
  }
  const { supabase, user, allowed, path: previous } = await currentVideoPath();
  if (!allowed) return { message: "Você não tem permissão para alterar o vídeo de apresentação.", success: false };

  const { error } = await supabase
    .from("site_settings")
    .update({
      presentation_video_path: path,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("singleton", true);
  if (error) {
    await supabase.storage.from(siteMediaBucket).remove([path]);
    return { message: "Não foi possível salvar o vídeo.", success: false };
  }

  if (previous && previous !== path) {
    await supabase.storage.from(siteMediaBucket).remove([previous]);
  }
  revalidatePath("/cadastro");
  revalidatePath("/login");
  revalidatePath("/interno/configuracoes");
  return { message: "Vídeo de apresentação atualizado.", success: true };
}

export async function removePresentationVideoAction(): Promise<FormState> {
  const { supabase, user, allowed, path } = await currentVideoPath();
  if (!allowed) return { message: "Você não tem permissão para alterar o vídeo de apresentação.", success: false };
  if (!path) return { message: "Não há vídeo para remover.", success: false };

  const { error } = await supabase
    .from("site_settings")
    .update({
      presentation_video_path: null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("singleton", true);
  if (error) {
    return { message: "Não foi possível remover o vídeo.", success: false };
  }
  await supabase.storage.from(siteMediaBucket).remove([path]);
  revalidatePath("/cadastro");
  revalidatePath("/login");
  revalidatePath("/interno/configuracoes");
  return { message: "Vídeo removido.", success: true };
}
