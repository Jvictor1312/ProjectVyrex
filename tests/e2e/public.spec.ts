import { expect, test, type Page } from "@playwright/test";

// Telas públicas e proteções de acesso, sem login.

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, "a página não pode rolar de lado").toBeLessThanOrEqual(1);
}

test.describe("páginas públicas", () => {
  for (const path of ["/", "/login", "/cadastro", "/recuperar-senha", "/termos", "/privacidade"]) {
    test(`${path} abre com logo, um título e sem rolagem lateral`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("svg.vyrex-logo").first()).toBeVisible();
      await expect(page.locator("h1:visible")).toHaveCount(1);
      await expectNoHorizontalScroll(page);
    });
  }

  test("rota inexistente mostra página de erro 404", async ({ page }) => {
    const response = await page.goto("/rota-que-nao-existe");
    expect(response?.status()).toBe(404);
  });

  test("campos do login têm rótulo e letra de 16px no celular", async ({ page, isMobile }) => {
    await page.goto("/login");
    for (const name of ["email", "password"]) {
      const input = page.locator(`input[name=${name}]`);
      await expect(input).toBeVisible();
      const label = await input.evaluate((el) => (el as HTMLInputElement).labels?.[0]?.textContent ?? "");
      expect(label.trim().length).toBeGreaterThan(0);
      if (isMobile) {
        const size = await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
        expect(size).toBeGreaterThanOrEqual(16);
      }
    }
  });
});

test.describe("proteção das áreas com login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const path of ["/dashboard", "/dashboard/perfil", "/dashboard/configuracoes", "/interno", "/interno/equipe", "/interno/configuracoes"]) {
    test(`${path} sem login vai para o login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("link de retorno não leva para outro site", async ({ page }) => {
    await page.goto("/auth/callback?next=//exemplo-externo.test");
    await expect(page).toHaveURL(/localhost:3000\/login/);
  });
});

// CPF válido e aleatório: cada execução usa um novo e não esbarra no limite
// de 3 envios por hora para o mesmo CPF.
function randomCpf() {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  for (const size of [9, 10]) {
    const total = digits.slice(0, size).reduce((sum, d, i) => sum + d * (size + 1 - i), 0);
    const check = (total * 10) % 11;
    digits.push(check === 10 ? 0 : check);
  }
  return digits.join("");
}

test.describe("recuperação de senha com resposta neutra", () => {
  test.skip(({ isMobile }) => isMobile, "Roda só no computador, para não gastar o limite de consultas.");

  test("CPF fictício recebe a mesma resposta de uma conta existente", async ({ page }) => {
    await page.goto("/recuperar-senha");
    await page.locator("input[name=identifier]").fill(randomCpf());
    await page.getByRole("button", { name: /Continuar/ }).click();
    await expect(page.getByText("O e-mail cadastrado na conta desse CPF")).toBeVisible();
    await page.getByRole("button", { name: /Enviar para o e-mail/ }).click();
    await expect(page.getByRole("status")).toContainText("Se houver uma conta ativa com esse CPF");
  });

  test("CPF inválido é recusado sem consultar contas", async ({ page }) => {
    await page.goto("/recuperar-senha");
    await page.locator("input[name=identifier]").fill("111.111.111-11");
    await page.getByRole("button", { name: /Continuar/ }).click();
    await expect(page.getByRole("status")).toContainText("CPF válido");
  });
});
