# Roda os testes de navegador (Playwright) com as contas de teste guardadas
# por scripts\set-test-credentials.ps1. Repassa os argumentos ao Playwright:
#   powershell -ExecutionPolicy Bypass -File scripts\e2e.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\e2e.ps1 --project=celular
#   powershell -ExecutionPolicy Bypass -File scripts\e2e.ps1 tests/e2e/admin.spec.ts
# Os valores são lidos do registro do usuário e nunca são impressos.
foreach ($name in "VYREX_TEST_ADMIN_EMAIL", "VYREX_TEST_ADMIN_PASSWORD", "VYREX_TEST_USER_EMAIL", "VYREX_TEST_USER_PASSWORD") {
  $value = [Environment]::GetEnvironmentVariable($name, "User")
  if ($value) { Set-Item -Path "env:$name" -Value $value }
}
$configured = @("ADMIN", "USER") | Where-Object { [Environment]::GetEnvironmentVariable("VYREX_TEST_$($_)_PASSWORD", "User") }
Write-Host "Contas de teste configuradas: $(if ($configured) { $configured -join ', ' } else { 'nenhuma (testes com login serao pulados)' })"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { $env:Path = "C:\Program Files\nodejs;" + $env:Path }
& npx playwright test @args
exit $LASTEXITCODE
