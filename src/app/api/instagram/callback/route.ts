import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { connectInstagramAccount } from "@/lib/instagram/service";
import { instagramStateCookie } from "@/lib/instagram/state";

const back = "/dashboard/perfil";

function sameValue(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// Retorno da autorização do Instagram. Só aceita o retorno da mesma pessoa
// que começou a conexão, nos últimos 10 minutos.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const cookieStore = await cookies();
  const saved = cookieStore.get(instagramStateCookie)?.value ?? "";
  cookieStore.delete({ name: instagramStateCookie, path: "/api/instagram" });

  const { supabase, user } = await requireSession();
  const [savedState, savedUser] = saved.split(".");
  const state = params.get("state") ?? "";
  if (!savedState || savedUser !== user.id || !sameValue(savedState, state)) {
    redirect(`${back}?instagram=expirado#redes`);
  }

  // A pessoa cancelou na tela do Instagram.
  if (params.get("error")) redirect(`${back}?instagram=cancelado#redes`);

  // O Instagram acrescenta "#_" ao fim do código; o navegador não envia a
  // parte depois do "#", mas o código é limpo por garantia.
  const code = (params.get("code") ?? "").replace(/#_$/, "");
  if (!code || code.length > 2000) redirect(`${back}?instagram=falhou#redes`);

  // A conexão é gravada com a chave de serviço; a conta ativa e o cadastro
  // em edição são conferidos de novo com a sessão (a regra do banco só
  // devolve o cadastro de contas ativas).
  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile || !["incomplete", "changes_requested"].includes(profile.status)) {
    redirect(`${back}?instagram=bloqueado#redes`);
  }

  const outcome = await connectInstagramAccount(user.id, code);
  revalidatePath(back);
  revalidatePath("/dashboard");
  const results: Record<typeof outcome, string> = {
    connected: "conectado",
    already_linked: "em-uso",
    not_configured: "indisponivel",
    failed: "falhou",
  };
  redirect(`${back}?instagram=${results[outcome]}#redes`);
}
