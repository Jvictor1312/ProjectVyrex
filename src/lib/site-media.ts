import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const siteMediaBucket = "site-media";
export const maximumVideoBytes = 50 * 1024 * 1024;
export const presentationVideoTag = "presentation-video";

// Endereço público do vídeo de apresentação, ou null se não houver vídeo.
// Usa um cliente sem sessão (o dado é público).
async function readPresentationVideoUrl() {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data } = await supabase
    .from("site_settings")
    .select("presentation_video_path")
    .eq("singleton", true)
    .maybeSingle();
  const path = data?.presentation_video_path;
  if (!path) return null;
  return supabase.storage.from(siteMediaBucket).getPublicUrl(path).data
    .publicUrl;
}

// Com a política de nonce, /cadastro é montada a cada visita (layout raiz
// com connection()). O endereço do vídeo fica guardado por até 5 min, para a
// visita não consultar o banco toda vez; quando o administrador troca o
// vídeo, actions/site.ts invalida o cache na hora (revalidateTag).
export const getPresentationVideoUrl = unstable_cache(
  readPresentationVideoUrl,
  [presentationVideoTag],
  { revalidate: 300, tags: [presentationVideoTag] },
);
