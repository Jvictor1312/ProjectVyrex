import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export const siteMediaBucket = "site-media";
export const maximumVideoBytes = 50 * 1024 * 1024;

// Endereço público do vídeo de apresentação, ou null se não houver vídeo.
export async function getPresentationVideoUrl() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
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
