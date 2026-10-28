import fs from "node:fs";
import { expect, test as setup } from "@playwright/test";
import { accounts, hasAccount, storageFile, type AccountName } from "./accounts";

// Entra uma vez em cada conta de teste e guarda a sessão para os outros
// testes (evita logins repetidos, que esbarrariam no limite de tentativas).
// Sessões com menos de 30 minutos são reaproveitadas.
for (const name of Object.keys(accounts) as AccountName[]) {
  setup(`entrar como ${name}`, async ({ page }) => {
    setup.skip(!hasAccount(name), `Defina as variáveis da conta "${name}" (scripts/set-test-credentials.ps1).`);
    const file = storageFile(name);
    if (fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 30 * 60 * 1000) return;

    await page.goto("/login");
    await page.locator("input[name=email]").fill(accounts[name].email!);
    await page.locator("input[name=password]").fill(accounts[name].password!);
    await page.getByRole("button", { name: /Entrar/ }).click();
    await expect(page).toHaveURL(accounts[name].home, { timeout: 30_000 });
    await page.context().storageState({ path: file });
  });
}
