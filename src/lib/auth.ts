import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export async function requireUser() {
  if (!isSupabaseConfigured()) {
    await cookies();
    redirect("/login?configuracao=supabase");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const profile = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profile.error) redirect("/login?configuracao=banco");
  if (!profile.data?.is_active) {
    await supabase.auth.signOut();
    redirect("/login?conta-desativada=1");
  }

  return { supabase, user: data.user };
}
