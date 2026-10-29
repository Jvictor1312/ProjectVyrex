import fs from "node:fs";
import path from "node:path";
import { expect, type Browser, type Page } from "@playwright/test";

// Contas e chaves do projeto Supabase de TESTES, lidas de .env.test.local
// (gerado por scripts/seed-test-project.mjs, fora do git).
export const testProjectRef = "ukwnnrrqmrvfwtbjjrbi";

const env: Record<string, string> = Object.fromEntries(
  fs
    .readFileSync(path.join(process.cwd(), ".env.test.local"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);

export type Person = "ADMIN" | "RECRUTADOR" | "GESTOR" | "ANALISTA" | "CRIADOR_A" | "CRIADOR_B";

export function credentials(person: Person) {
  const email = env[`VYREX_E2E_${person}_EMAIL`];
  const password = env[`VYREX_E2E_${person}_PASSWORD`];
  if (!email || !password) throw new Error(`Rode scripts/seed-test-project.mjs (falta ${person}).`);
  return { email, password };
}

// Trava de segurança: o site precisa estar ligado ao projeto de testes.
export async function assertTestDatabase(page: Page) {
  const response = await page.goto("/login");
  const csp = response?.headers()["content-security-policy"] ?? "";
  if (!csp.includes(testProjectRef)) {
    throw new Error("Recusado: o servidor não está ligado ao Supabase de testes.");
  }
}

// Cria uma conta de criador direto no projeto de TESTES (chave de serviço), sem
// passar pela tela de cadastro, que tem limite de 5 cadastros por hora.
export async function createTestCreator(email: string, password: string, fullName: string) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (new URL(url).hostname !== `${testProjectRef}.supabase.co`) {
    throw new Error("Recusado: chave de serviço não é do projeto de testes.");
  }
  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    }),
  });
  if (!response.ok) throw new Error(`Não foi possível criar o criador de teste (${response.status}).`);
}

export async function login(page: Page, email: string, password: string, home: RegExp) {
  await page.goto("/login");
  await page.locator("input[name=email]").fill(email);
  await page.locator("input[name=password]").fill(password);
  await page.getByRole("button", { name: /Entrar/ }).click();
  await expect(page).toHaveURL(home, { timeout: 60_000 });
}

export async function loginAs(browser: Browser, person: Person, home: RegExp) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const { email, password } = credentials(person);
  await login(page, email, password, home);
  return { context, page };
}
