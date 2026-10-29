import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { loggedFetch } from "@/lib/log";
import type { Database } from "./database.types";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Configure as variáveis do Supabase para habilitar esta função.",
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    // Recusas e falhas do banco ficam registradas no log do servidor.
    global: { fetch: loggedFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot mutate cookies; Server Actions and Route Handlers can.
        }
      },
    },
  });
}
