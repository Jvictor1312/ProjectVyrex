import { defineConfig, devices } from "@playwright/test";

// Testes de navegador (ponta a ponta) do Vyrex.
// - Usam o Chrome instalado no computador (channel "chrome"), sem baixar outro.
// - Rodam contra o servidor local (localhost:3000); se ele não estiver ligado,
//   o Playwright liga o "npm run dev".
// - As contas de teste vêm de variáveis de ambiente (veja scripts/e2e.ps1).
//   As sessões ficam em playwright/.auth/, fora do git.
// - O banco é o Supabase real: os testes só leem e navegam. Nada de salvar,
//   enviar, apagar ou decidir cadastros.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    channel: "chrome",
    locale: "pt-BR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "computador",
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1366, height: 860 } },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
    {
      name: "celular",
      use: { ...devices["Pixel 7"], channel: "chrome" },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
});
