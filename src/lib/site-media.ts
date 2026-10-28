import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const siteMediaBucket = "site-media";
export const maximumVideoBytes = 50 * 1024 * 1024;

// Endereço público do vídeo de apresentação, ou null se não houver vídeo.
// Usa um cliente sem sessão (o dado é público) para que a página de cadastro
// possa ser gerada com antecedência e abrir na hora.
export async function getPresentationVideoUrl() {
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
