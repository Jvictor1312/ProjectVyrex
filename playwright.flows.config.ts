import { defineConfig } from "@playwright/test";

// Fluxos que ALTERAM dados (cadastro, envio, análise, decisão). Rodam só no
// servidor de testes (localhost:3001), ligado ao projeto Supabase "Vyrex
// Testes". Nunca apontar para o banco real.
//   npm run test:flows
export default defineConfig({
  testDir: "tests/e2e-flows",
  timeout: 240_000,
  expect: { timeout: 30_000 },
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-flows" }]],
  use: {
    baseURL: "http://localhost:3001",
    channel: "chrome",
    locale: "pt-BR",
    viewport: { width: 1366, height: 860 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "powershell -ExecutionPolicy Bypass -File scripts/dev-test.ps1",
    url: "http://localhost:3001/login",
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
