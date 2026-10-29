import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import { assertTestDatabase } from "./test-env";

// Cadastro pela tela, no banco de testes (contas confirmadas na hora, sem
// e-mail). Usa 1 dos 5 cadastros por hora permitidos por endereço de rede.
test("visitante cria a conta pela tela e cai no painel", async ({ page }) => {
  await assertTestDatabase(page);
  const stamp = Date.now();
  const password = `${randomBytes(12).toString("base64url")}aA1!`;
  await page.goto("/cadastro");
  await page.locator("input[name=fullName]").fill(`Cadastro Tela ${stamp}`);
  await page.locator("input[name=email]").fill(`cadastro.tela.${stamp}@vyrex.test`);
  await page.locator("input[name=password]").fill(password);
  await page.locator("input[name=passwordConfirmation]").fill(password);
  await page.locator("input[name=termsAccepted]").check();
  await page.getByRole("button", { name: /Criar minha conta/ }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
  await expect(page.getByText("Cadastro incompleto").first()).toBeVisible();
});
