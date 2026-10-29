import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { assertTestDatabase, createTestCreator, loginAs, login } from "./test-env";

// Fluxo completo de um cadastro, do zero até a aprovação, com as funções reais
// de cada pessoa da equipe. Cada execução cria um criador novo (e-mail
// fictício), então pode rodar quantas vezes quiser.
test.describe.configure({ mode: "serial" });

const stamp = Date.now();
const creator = {
  name: `Teste Fluxo ${stamp}`,
  publicName: `Fluxo ${stamp}`,
  email: `criador.fluxo.${stamp}@vyrex.test`,
  password: `${randomBytes(12).toString("base64url")}aA1!`,
};
let creatorId = "";

async function storyImage(color: string) {
  return sharp({ create: { width: 540, height: 960, channels: 3, background: color } })
    .png()
    .toBuffer();
}

test("o servidor está ligado ao banco de testes", async ({ page }) => {
  await assertTestDatabase(page);
});

test("1. criador tem conta nova (criada direto no banco de testes)", async ({ page }) => {
  await createTestCreator(creator.email, creator.password, creator.name);
  await login(page, creator.email, creator.password, /\/dashboard/);
  await expect(page.getByText("Cadastro incompleto").first()).toBeVisible();
});

test("2. criador preenche perfil, rede, evidências e envia", async ({ page }) => {
  await login(page, creator.email, creator.password, /\/dashboard/);

  // Perfil
  await page.goto("/dashboard/perfil");
  await page.locator("input[name=publicName]").fill(creator.publicName);
  await page.locator("input[name=city]").fill("Campinas");
  await page.locator("input[name=region]").fill("SP");
  await page.locator("textarea[name=biography]").fill("Conteúdo de teste automático.");
  await page.locator("input[name=categories]").first().check();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.locator(".autosave-status")).toHaveText("Salvo");

  // Rede social (a página abre na primeira etapa pendente)
  await page.goto("/dashboard/perfil");
  await page.locator("input[name=handle]").fill(`fluxo${stamp}`);
  await page.locator("input[name=profileUrl]").fill(`https://www.instagram.com/fluxo${stamp}`);
  await page.locator("input[name=followersReported]").fill("1500");
  await page.getByRole("button", { name: "Adicionar rede" }).click();
  await expect(page.getByText("Rede social salva.")).toBeVisible();
  await expect(page.locator(".account-row", { hasText: `@fluxo${stamp}` })).toBeVisible();

  // Evidências: três prints de uma vez, com 1.500 visualizações cada
  await page.goto("/dashboard/perfil");
  await page.locator("form input[type=file]").setInputFiles([
    { name: "story1.png", mimeType: "image/png", buffer: await storyImage("#2d3a4a") },
    { name: "story2.png", mimeType: "image/png", buffer: await storyImage("#4a2d3a") },
    { name: "story3.png", mimeType: "image/png", buffer: await storyImage("#3a4a2d") },
  ]);
  for (const position of [1, 2, 3]) {
    await page.locator(`input[name=viewsReported-${position}]`).fill("1500");
  }
  await page.getByRole("button", { name: "Salvar 3 evidências" }).click();
  await expect(page.getByText("Stories 1, 2 e 3 salvos.")).toBeVisible({ timeout: 120_000 });

  // Revisão e envio
  await page.goto("/dashboard/perfil");
  await page.getByRole("button", { name: /^Etapa 4:/ }).click();
  await page.getByRole("button", { name: "Enviar para análise" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Aguardando análise").first()).toBeVisible();
});

test("3. administrador atribui recrutador e gestora", async ({ browser }) => {
  const { context, page } = await loginAs(browser, "ADMIN", /\/interno/);
  await page.goto(`/interno?q=${encodeURIComponent(creator.publicName)}`);
  await page.getByRole("link", { name: "Abrir ficha" }).first().click();
  await expect(page).toHaveURL(/\/interno\/[0-9a-f-]{36}$/);
  creatorId = page.url().split("/").pop()!;

  await page.getByLabel("Recrutador").selectOption({ label: "Rui Recrutador (teste)" });
  await page.getByLabel("Gestor de relacionamento").selectOption({ label: "Gabi Gestora (teste)" });
  await page.getByRole("button", { name: "Salvar responsáveis" }).click();
  await expect(page.getByText("Responsáveis atualizados.")).toBeVisible();
  await context.close();
});

test("4. outro criador não abre a ficha", async ({ browser }) => {
  const { context, page } = await loginAs(browser, "CRIADOR_B", /\/dashboard/);
  // Resposta "não encontrada": nem confirma que a ficha existe.
  // (O código HTTP fica 200 porque a tela de carregamento já foi enviada;
  // o conteúdo é a página de "não encontrada".)
  await page.goto(`/interno/${creatorId}`);
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  await expect(page.getByText(creator.publicName)).toHaveCount(0);
  await context.close();
});

test("5. recrutador encaminha para validação e não vê a decisão final", async ({ browser }) => {
  const { context, page } = await loginAs(browser, "RECRUTADOR", /\/interno/);
  await page.goto(`/interno/${creatorId}`);
  await expect(page.getByRole("heading", { name: "Decisão final" })).toHaveCount(0);
  await page.getByRole("button", { name: "Encaminhar para validação" }).click();
  await expect(page.getByText("Cadastro encaminhado para validação.")).toBeVisible();
  await context.close();
});

test("6. gestora envia mensagem ao criador", async ({ browser }) => {
  const { context, page } = await loginAs(browser, "GESTOR", /\/interno/);
  await page.goto(`/interno/${creatorId}`);
  await page.getByLabel("Mensagem ao criador").fill("Olá! Recebemos seu cadastro (teste automático).");
  await page.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(page.getByText("Mensagem enviada ao criador.")).toBeVisible();
  await context.close();
});

test("7. analista confere rede e evidências e aprova", async ({ browser }) => {
  const { context, page } = await loginAs(browser, "ANALISTA", /\/interno/);
  await page.goto(`/interno/${creatorId}`);

  await page.getByRole("button", { name: "Registrar resultado" }).click();
  await expect(page.getByText("Verificação da rede social registrada.")).toBeVisible();

  for (let index = 0; index < 3; index += 1) {
    await page.goto(`/interno/${creatorId}`);
    await page.getByRole("button", { name: "Registrar análise" }).nth(index).click();
    await expect(page.getByText("Resultado da evidência registrado.")).toBeVisible();
  }

  await page.goto(`/interno/${creatorId}`);
  await page.getByLabel("Justificativa").fill("Aprovado no teste automático.");
  await page.getByRole("button", { name: "Registrar decisão" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  // Volta para a lista com a confirmação (o cadastro aprovado sai da fila).
  await expect(page).toHaveURL(/\/interno\?decisao=approved/);
  await expect(page.getByText("Decisão registrada: cadastro aprovado.")).toBeVisible();
  await context.close();
});

test("8. criador vê a aprovação, a mensagem e o histórico", async ({ page }) => {
  await login(page, creator.email, creator.password, /\/dashboard/);
  await expect(page.getByText("Aprovado").first()).toBeVisible();
  await expect(page.getByText("Seu perfil foi aprovado")).toBeVisible();
  await expect(page.getByText("Recebemos seu cadastro (teste automático).").first()).toBeVisible();
  await expect(page.getByText("Cadastro aprovado").first()).toBeVisible();
});
