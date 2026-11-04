import "server-only";
import { createClient } from "@supabase/supabase-js";
import { loggedFetch } from "@/lib/log";
import type { Database } from "./database.types";

// As telas usam para não oferecer ações que dependem da chave de serviço
// quando ela não está configurada (o envio falharia só no fim).
export function isSupabaseAdminConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    global: { fetch: loggedFetch },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
