import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

// Chaves das funções ativas do usuário, em uma única consulta.
export async function fetchActiveRoleKeys(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(key)")
    .eq("user_id", userId)
    .is("revoked_at", null);
  const keys = (data ?? [])
    .map((row: { roles: { key: string } | { key: string }[] | null }) =>
      Array.isArray(row.roles) ? row.roles[0]?.key : row.roles?.key,
    )
    .filter((key): key is string => Boolean(key));
  return { keys, error };
}

async function authenticate(withRoles: boolean) {
  if (!isSupabaseConfigured()) {
    await cookies();
    redirect("/login?configuracao=supabase");
  }

  const supabase = await createSupabaseServerClient();
  // getClaims confere a assinatura do token localmente (chaves ES256 do
  // projeto), sem ir ao servidor de autenticação a cada página.
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (error || !claims?.sub) {
    redirect("/login");
  }
  const data = {
    user: { id: claims.sub, email: claims.email ?? null },
  };

  // O perfil e as funções são buscados juntos para economizar uma ida ao banco.
  const [profile, roles] = await Promise.all([
    supabase
      .from("profiles")
      .select("is_active")
      .eq("id", data.user.id)
      .maybeSingle(),
    withRoles
      ? fetchActiveRoleKeys(supabase, data.user.id)
      : Promise.resolve({ keys: [] as string[], error: null }),
  ]);
  if (profile.error) redirect("/login?configuracao=banco");
  if (!profile.data?.is_active) {
    await supabase.auth.signOut();
    redirect("/login?conta-desativada=1");
  }

  return { supabase, user: data.user, roles };
}

export async function requireUser() {
  const { supabase, user } = await authenticate(false);
  return { supabase, user };
}

// Para telas: confere o login localmente e devolve na hora. A checagem de
// conta ativa é feita junto com as consultas da tela (uma rodada só até o
// banco); a tela chama `ensureActive` com o resultado. Os dados de contas
// desativadas já são bloqueados pelas regras do banco (RLS).
export async function requireUserFast() {
  if (!isSupabaseConfigured()) {
    await cookies();
    redirect("/login?configuracao=supabase");
  }
  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (error || !claims?.sub) redirect("/login");

  const user = { id: claims.sub, email: claims.email ?? null };
  const activeCheck = supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .maybeSingle();

  async function ensureActive(
    result: Awaited<typeof activeCheck>,
  ): Promise<void> {
    if (result.error) redirect("/login?configuracao=banco");
    if (!result.data?.is_active) {
      await supabase.auth.signOut();
      redirect("/login?conta-desativada=1");
    }
  }

  return { supabase, user, activeCheck, ensureActive };
}

export async function requireUserWithRoles() {
  const { supabase, user, roles } = await authenticate(true);
  return { supabase, user, roleKeys: roles.keys, rolesError: roles.error };
}

// Para ações (botões de salvar): só confere o login, localmente. As funções e
// regras do banco já exigem conta ativa (has_permission e RLS verificam
// profiles.is_active), então a consulta extra ao perfil não é necessária.
export async function requireSession() {
  if (!isSupabaseConfigured()) {
    await cookies();
    redirect("/login?configuracao=supabase");
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) redirect("/login");
  return { supabase, user: { id: claims.sub, email: claims.email ?? null } };
}
