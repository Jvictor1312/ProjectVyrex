import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const allowedHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function isLoopbackSupabaseUrl(value) {
  try {
    return allowedHosts.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.",
    );
  }
  if (!isLoopbackSupabaseUrl(supabaseUrl)) {
    throw new Error(
      "Por segurança, as contas de teste só podem ser criadas em Supabase local (localhost/loopback).",
    );
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Este comando não pode ser executado em produção.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: listedUsers, error: listError } =
    await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw new Error("Não foi possível consultar usuários locais.");

  async function prepareUser(email, fullName) {
    const password = randomBytes(24).toString("base64url");
    const existing = listedUsers.users.find(
      (user) => user.email?.toLowerCase() === email,
    );
    const result = existing
      ? await supabase.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        })
      : await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

    if (result.error || !result.data.user) {
      throw new Error(`Não foi possível preparar a conta local ${email}.`);
    }
    return { email, password, userId: result.data.user.id };
  }

  const adminUser = await prepareUser(
    "admin.teste@vyrex.local",
    "Administrador de Teste",
  );
  const creatorUser = await prepareUser(
    "criador.teste@vyrex.local",
    "Criador de Teste",
  );

  async function ensureRole(userId, roleKey, assignedBy) {
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("key", roleKey)
      .single();
    if (roleError || !role) {
      throw new Error("Aplique as migrations locais antes de criar as contas.");
    }

    const { data: existing, error: existingError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("user_id", userId)
      .eq("role_id", role.id)
      .is("revoked_at", null)
      .maybeSingle();
    if (existingError) {
      throw new Error("Não foi possível consultar as funções locais.");
    }
    if (existing) return;

    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role_id: role.id,
      assigned_by: assignedBy,
    });
    if (error)
      throw new Error(`Não foi possível atribuir a função ${roleKey}.`);
  }

  await ensureRole(adminUser.userId, "admin", adminUser.userId);
  await ensureRole(creatorUser.userId, "influencer", adminUser.userId);

  const credentials = [
    "VYREX - CONTAS DE TESTE LOCAIS",
    "Uso exclusivo no Supabase local. Senhas regeneradas a cada execução.",
    "Não compartilhe nem versione este arquivo.",
    "",
    `Administrador\nE-mail: ${adminUser.email}\nSenha: ${adminUser.password}`,
    "",
    `Criador\nE-mail: ${creatorUser.email}\nSenha: ${creatorUser.password}`,
    "",
  ].join("\n");
  await writeFile(
    fileURLToPath(new URL("../logins.txt", import.meta.url)),
    credentials,
    { encoding: "utf8", mode: 0o600 },
  );
  console.log("Contas locais preparadas; credenciais gravadas em logins.txt.");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
