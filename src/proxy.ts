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
  const { data } = await supabase.auth.getClaims();

  // Quem já está logado não precisa criar conta: segue para /login, que
  // leva ao painel certo (criador ou equipe). Os cookies renovados vão junto.
  if (data?.claims?.sub && request.nextUrl.pathname === "/cadastro") {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  // Sem sessão, as áreas com login nem começam a carregar: vão direto para o
  // login (as páginas continuam conferindo sessão, função e conta ativa).
  const { pathname } = request.nextUrl;
  const privateArea =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/interno" ||
    pathname.startsWith("/interno/");
  if (!data?.claims?.sub && privateArea) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  return response;
}

export const config = {
  // A página inicial, o login e o cadastro também passam por aqui, para a
  // sessão continuar ativa e quem já entrou não precisar entrar de novo.
  matcher: [
    "/",
    "/login",
    "/cadastro",
    "/dashboard/:path*",
    "/interno/:path*",
    "/redefinir-senha",
    "/auth/:path*",
  ],
};
