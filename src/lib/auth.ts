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
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

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

export async function requireUserWithRoles() {
  const { supabase, user, roles } = await authenticate(true);
  return { supabase, user, roleKeys: roles.keys, rolesError: roles.error };
}
