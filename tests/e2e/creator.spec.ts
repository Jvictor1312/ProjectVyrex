import { expect, test } from "@playwright/test";
import { hasAccount, storageFile } from "./accounts";

// Área do criador com a conta de teste "user". Só navega e lê: nada é salvo,
// enviado ou apagado.
test.skip(!hasAccount("user"), "Conta de teste do criador não configurada.");
test.use({ storageState: storageFile("user") });

const pages = [
  { path: "/dashboard", link: "Visão geral", heading: /Olá/ },
  { path: "/dashboard/perfil", link: "Meu cadastro", heading: /Meu cadastro/ },
  { path: "/dashboard/mensagens", link: "Mensagens", heading: /Mensagens/ },
  { path: "/dashboard/configuracoes", link: "Configurações", heading: /Configurações/ },
];

test("o menu leva a cada página e marca a atual", async ({ page }) => {
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Área do criador" });
  for (const item of pages) {
    await nav.getByRole("link", { name: item.link }).click();
    await expect(page).toHaveURL(new RegExp(`${item.path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(item.heading);
    await expect(nav.getByRole("link", { name: item.link })).toHaveAttribute("aria-current", "page");
  }
});

test("voltar e avançar do navegador funcionam", async ({ page }) => {
  await page.goto("/dashboard");
  await page.goto("/dashboard/mensagens");
  await page.goBack();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/dashboard\/mensagens$/);
});

test("a sessão continua depois de recarregar", async ({ page }) => {
  await page.goto("/dashboard/configuracoes");
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard\/configuracoes$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("criador não entra na área da equipe", async ({ page }) => {
  for (const path of ["/interno", "/interno/equipe", "/interno/configuracoes"]) {
    await page.goto(path);
    await expect(page).not.toHaveURL(new RegExp(`${path}$`));
  }
});

test("login e cadastro levam direto ao painel de quem já entrou", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto("/cadastro");
  await expect(page).toHaveURL(/\/dashboard/);
});

test("no celular o menu fica fixo embaixo", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Só no celular.");
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Área do criador" });
  const box = await nav.boundingBox();
  const height = page.viewportSize()!.height;
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeGreaterThan(height - 2);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
