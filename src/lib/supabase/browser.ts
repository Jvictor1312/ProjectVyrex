"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// Cliente do navegador, com a sessão do usuário logado. Usado só para enviar
// arquivos grandes direto ao Storage; as regras de acesso valem do mesmo jeito.
export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Configure as variáveis do Supabase.");
  }
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
