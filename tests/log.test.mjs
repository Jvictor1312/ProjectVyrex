import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { loggedFetch, logServerError } from "../src/lib/log.ts";

const realFetch = globalThis.fetch;
const realError = console.error;
const realWarn = console.warn;
let lines;

beforeEach(() => {
  lines = [];
  console.error = (line) => lines.push(JSON.parse(line));
  console.warn = (line) => lines.push(JSON.parse(line));
});

afterEach(() => {
  globalThis.fetch = realFetch;
  console.error = realError;
  console.warn = realWarn;
});

function answer(status, body) {
  globalThis.fetch = async () =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

test("resposta certa do banco não gera registro", async () => {
  answer(200, [{ id: 1 }]);
  const response = await loggedFetch("https://x.supabase.co/rest/v1/profiles?select=id");
  assert.deepEqual(await response.json(), [{ id: 1 }]);
  assert.equal(lines.length, 0);
});

test("recusa prevista do banco vira aviso e a resposta chega intacta", async () => {
  answer(403, { code: "42501", message: "permission denied", details: "Key (cpf)=(12345678909)" });
  const response = await loggedFetch("https://x.supabase.co/rest/v1/rpc/set_user_role?x=1", { method: "POST" });
  assert.equal((await response.json()).code, "42501");
  assert.equal(lines.length, 1);
  assert.equal(lines[0].nivel, "aviso");
  assert.equal(lines[0].onde, "supabase POST /rest/v1/rpc/set_user_role");
  assert.equal(lines[0].codigo, "42501");
  // Detalhes (podem trazer valores) e parâmetros do endereço ficam de fora.
  assert.ok(!JSON.stringify(lines[0]).includes("12345678909"));
  assert.ok(!JSON.stringify(lines[0]).includes("x=1"));
});

test("falha inesperada do banco vira erro", async () => {
  answer(500, { code: "XX000", message: "internal" });
  await loggedFetch("https://x.supabase.co/rest/v1/creator_profiles");
  assert.equal(lines[0].nivel, "erro");
  assert.equal(lines[0].status, 500);
});

test("senha errada no login não é registrada; queda do Auth é", async () => {
  answer(400, { error: "invalid_grant" });
  await loggedFetch("https://x.supabase.co/auth/v1/token?grant_type=password", { method: "POST" });
  assert.equal(lines.length, 0);
  answer(503, { error: "unavailable" });
  await loggedFetch("https://x.supabase.co/auth/v1/token", { method: "POST" });
  assert.equal(lines.length, 1);
});

test("caminho do Storage não registra o id do usuário nem o arquivo", async () => {
  answer(400, { statusCode: "403", error: "Unauthorized", message: "quota" });
  await loggedFetch("https://x.supabase.co/storage/v1/object/story-evidence/user-123/foto.webp", { method: "POST" });
  assert.equal(lines[0].onde, "supabase POST /storage/v1/object/story-evidence");
});

test("logServerError guarda tipo, mensagem e digest, e corta textos longos", () => {
  const error = Object.assign(new Error("a".repeat(500)), { digest: "abc" });
  logServerError("render GET /dashboard", error);
  assert.equal(lines[0].tipo, "Error");
  assert.equal(lines[0].digest, "abc");
  assert.ok(lines[0].mensagem.length <= 301);
});
