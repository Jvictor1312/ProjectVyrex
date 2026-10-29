// Prepara as contas do projeto Supabase de TESTES ("Vyrex Testes").
// - Só roda contra o projeto de testes (trava pelo endereço): nunca no banco real.
// - Cria (ou redefine a senha de) admin, recrutador, gestor, analista e dois
//   criadores, com e-mails fictícios @vyrex.test e senhas aleatórias.
// - Grava e-mails e senhas em .env.test.local (fora do git); nada é impresso.
// Uso: node scripts/seed-test-project.mjs
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

export const testProjectRef = "ukwnnrrqmrvfwtbjjrbi";
const realProjectRef = "zofxrohoilwjtzbcruse";
const envFile = new URL("../.env.test.local", import.meta.url);

export function isTestProjectUrl(value) {
  try {
    const host = new URL(value).hostname;
    return host === `${testProjectRef}.supabase.co` && !host.startsWith(realProjectRef);
  } catch {
    return false;
  }
}

function parseEnv(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
  );
}

const people = [
  { key: "ADMIN", email: "admin@vyrex.test", name: "Ana Admin (teste)", role: "admin" },
  { key: "RECRUTADOR", email: "recrutador@vyrex.test", name: "Rui Recrutador (teste)", role: "recruiter" },
  { key: "GESTOR", email: "gestor@vyrex.test", name: "Gabi Gestora (teste)", role: "relationship_manager" },
  { key: "ANALISTA", email: "analista@vyrex.test", name: "Alex Analista (teste)", role: "validator" },
  { key: "CRIADOR_A", email: "criador.a@vyrex.test", name: "Carla Criadora (teste)", role: null },
  { key: "CRIADOR_B", email: "criador.b@vyrex.test", name: "Caio Criador (teste)", role: null },
];

async function main() {
  const text = await readFile(envFile, "utf8");
  const env = parseEnv(text);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!isTestProjectUrl(url) || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Recusado: .env.test.local não aponta para o projeto de testes.");
  }

  const supabase = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw new Error("Não foi possível listar os usuários do projeto de testes.");

  const ids = {};
  const lines = {};
  for (const person of people) {
    const password = `${randomBytes(18).toString("base64url")}aA1!`;
    const existing = listed.users.find((user) => user.email === person.email);
    const result = existing
      ? await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true })
      : await supabase.auth.admin.createUser({
          email: person.email,
          password,
          email_confirm: true,
          user_metadata: { full_name: person.name },
        });
    if (result.error || !result.data.user) throw new Error(`Falha ao preparar ${person.email}.`);
    ids[person.key] = result.data.user.id;
    lines[`VYREX_E2E_${person.key}_EMAIL`] = person.email;
    lines[`VYREX_E2E_${person.key}_PASSWORD`] = password;
  }

  const { data: roles } = await supabase.from("roles").select("id, key");
  const roleId = Object.fromEntries((roles ?? []).map((role) => [role.key, role.id]));
  for (const person of people.filter((item) => item.role)) {
    const { data: current } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("user_id", ids[person.key])
      .eq("role_id", roleId[person.role])
      .is("revoked_at", null)
      .maybeSingle();
    if (current) continue;
    const { error } = await supabase.from("user_roles").insert({
      user_id: ids[person.key],
      role_id: roleId[person.role],
      assigned_by: ids.ADMIN,
    });
    if (error) throw new Error(`Falha ao dar a função ${person.role}.`);
  }

  // A criadora A fica na carteira do recrutador e da gestora de teste.
  for (const [table, column, staff] of [
    ["recruiter_assignments", "recruiter_id", "RECRUTADOR"],
    ["relationship_assignments", "manager_id", "GESTOR"],
  ]) {
    const { data: current } = await supabase
      .from(table)
      .select("id")
      .eq("creator_id", ids.CRIADOR_A)
      .is("ended_at", null)
      .maybeSingle();
    if (current) continue;
    const { error } = await supabase
      .from(table)
      .insert({ creator_id: ids.CRIADOR_A, [column]: ids[staff], assigned_by: ids.ADMIN });
    if (error) throw new Error(`Falha ao atribuir a criadora A (${table}).`);
  }

  // Regrava o arquivo mantendo as chaves e trocando só as contas.
  const kept = text
    .split(/\r?\n/)
    .filter((line) => !line.startsWith("VYREX_E2E_") && !line.startsWith("# Contas de teste"));
  while (kept.length && kept.at(-1) === "") kept.pop();
  const output = [
    ...kept,
    "",
    "# Contas de teste (geradas por scripts/seed-test-project.mjs)",
    ...Object.entries(lines).map(([key, value]) => `${key}=${value}`),
    "",
  ].join("\n");
  await writeFile(envFile, output, { encoding: "utf8", mode: 0o600 });
  console.log(`Projeto de testes preparado: ${people.length} contas, funções e atribuições.`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
