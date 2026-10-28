import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Renova a sessão do Supabase antes das telas com login. Sem isso, o token
// vencido seria renovado dentro das páginas, que não conseguem gravar o cookie
// novo, e a rotação de tokens poderia derrubar a sessão.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Confere o token localmente e, se vencido, renova e grava o cookie novo.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/interno/:path*",
    "/redefinir-senha",
    "/auth/:path*",
  ],
};
