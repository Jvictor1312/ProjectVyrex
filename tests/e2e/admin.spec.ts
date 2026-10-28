import { expect, test } from "@playwright/test";
import { hasAccount, storageFile } from "./accounts";

// Área da equipe com a conta de teste "admin". Só navega, filtra e lê: nada de
// convidar, mudar funções, desativar, salvar critérios ou decidir cadastros.
test.skip(!hasAccount("admin"), "Conta de teste do administrador não configurada.");
test.use({ storageState: storageFile("admin") });

test("visão geral lista cadastros e aceita filtros", async ({ page }) => {
  await page.goto("/interno");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cadastros de criadores" })).toBeVisible();
  await page.getByLabel("Situação").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page).toHaveURL(/status=/);
});

test("menu da equipe navega entre as páginas de administração", async ({ page }) => {
  await page.goto("/interno");
  const nav = page.getByRole("navigation", { name: "Área da equipe" });
  for (const [name, path] of [
    ["Colaboradores", "/interno/equipe"],
    ["Configurações", "/interno/configuracoes"],
    ["Pedidos de privacidade", "/interno/privacidade"],
    ["Visão geral", "/interno"],
  ] as const) {
    await nav.getByRole("link", { name }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(nav.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
  }
});

test("histórico administrativo começa recolhido e abre com um clique", async ({ page }) => {
  await page.goto("/interno/equipe");
  const history = page.locator("details", { hasText: "Histórico administrativo" }).first();
  await expect(history).not.toHaveAttribute("open", "");
  await history.locator("summary").first().click();
  await expect(history).toHaveAttribute("open", "");
});

test("configurações mostram critérios e o vídeo de apresentação", async ({ page }) => {
  await page.goto("/interno/configuracoes");
  await expect(page.getByText("Critérios de elegibilidade").first()).toBeVisible();
  await expect(page.getByText("Vídeo de apresentação").first()).toBeVisible();
});

test("ficha de cadastro inexistente não quebra a página", async ({ page }) => {
  const response = await page.goto("/interno/00000000-0000-4000-8000-000000000000");
  expect(response?.status()).toBeLessThan(500);
});
