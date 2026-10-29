import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy, createNonce } from "@/lib/security/csp";

// Telas que dependem da sessão: o proxy renova o login antes delas.
function needsSession(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname === "/redefinir-senha" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/interno" ||
    pathname.startsWith("/interno/") ||
    pathname.startsWith("/auth/")
  );
}

// Toda página recebe uma política de conteúdo com nonce novo. O Next lê o
// nonce do cabeçalho da requisição e o aplica nos próprios scripts.
export async function proxy(request: NextRequest) {
  const policy = contentSecurityPolicy(
    createNonce(),
    process.env.NODE_ENV === "development",
  );
  request.headers.set("Content-Security-Policy", policy);
  const response = await sessionProxy(request);
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

// Renova a sessão do Supabase antes das telas com login. Sem isso, o token
// vencido seria renovado dentro das páginas, que não conseguem gravar o cookie
// novo, e a rotação de tokens poderia derrubar a sessão.
async function sessionProxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!needsSession(request.nextUrl.pathname)) return response;
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
  // Todas as páginas (para a política de conteúdo), menos os arquivos
  // estáticos: scripts do Next, imagens, vídeos e ícones não precisam dela.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|mp4|webm|txt|xml|woff2?)$).*)",
  ],
};
