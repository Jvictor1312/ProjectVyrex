import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { hasAccount, storageFile, type AccountName } from "./accounts";

// Acessibilidade automática (axe-core, regras WCAG 2.0, 2.1 e 2.2 níveis A e
// AA) em todas as telas principais, no computador e no celular. Só abre as
// páginas e lê: nada é salvo. Falha em problema "sério" ou "crítico"; os
// demais aparecem no relatório como anexo.
const wcag = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function checkPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(wcag).analyze();
  await test.info().attach(`axe ${path}`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: "application/json",
  });
  const serious = results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
  expect(serious, `Problemas de acessibilidade em ${path}`).toEqual([]);
}

test.describe("telas públicas", () => {
  for (const path of ["/", "/login", "/cadastro", "/recuperar-senha", "/termos", "/privacidade", "/nao-existe"]) {
    test(`acessibilidade de ${path}`, async ({ page }) => {
      await checkPage(page, path);
    });
  }
});

const areas: [AccountName, string[]][] = [
  ["user", ["/dashboard", "/dashboard/perfil", "/dashboard/mensagens", "/dashboard/configuracoes"]],
  ["admin", ["/interno", "/interno/equipe", "/interno/configuracoes", "/interno/privacidade"]],
];

for (const [account, paths] of areas) {
  test.describe(`telas com login (${account})`, () => {
    test.skip(!hasAccount(account), "Conta de teste não configurada.");
    test.use({ storageState: storageFile(account) });
    for (const path of paths) {
      test(`acessibilidade de ${path}`, async ({ page }) => {
        await checkPage(page, path);
      });
    }
  });
}
