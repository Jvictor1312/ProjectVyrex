import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { buildAuthorizeUrl } from "@/lib/instagram/graph";
import { getInstagramConfig } from "@/lib/instagram/service";
import { instagramStateCookie } from "@/lib/instagram/state";

const back = "/dashboard/perfil";

// Começa a conexão: confere a sessão e manda para a tela oficial de
// autorização do Instagram. A senha do Instagram é digitada só lá, nunca
// passa pela Vyrex. O `state` aleatório impede que outra pessoa ligue uma
// conta dela ao cadastro de alguém.
export async function GET() {
  const config = getInstagramConfig();
  if (!config) redirect(`${back}?instagram=indisponivel#redes`);

  const { supabase, user } = await requireSession();
  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile || !["incomplete", "changes_requested"].includes(profile.status)) {
    redirect(`${back}?instagram=bloqueado#redes`);
  }

  const state = randomBytes(32).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(instagramStateCookie, `${state}.${user.id}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/instagram",
    maxAge: 10 * 60,
  });
  redirect(
    buildAuthorizeUrl({ appId: config.appId, redirectUri: config.redirectUri, state }),
  );
}
