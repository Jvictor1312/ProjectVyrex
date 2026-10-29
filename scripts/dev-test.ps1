# Liga o site em http://localhost:3001 usando o Supabase de TESTES
# ("Vyrex Testes"), lido de .env.test.local. O servidor normal
# (localhost:3000, banco real) continua funcionando ao lado.
#   powershell -ExecutionPolicy Bypass -File scripts\dev-test.ps1
$envFile = Join-Path $PSScriptRoot "..\.env.test.local"
if (-not (Test-Path $envFile)) { Write-Error "Falta .env.test.local (projeto de testes)."; exit 1 }
foreach ($line in [IO.File]::ReadAllLines($envFile)) {
  if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) { continue }
  $name, $value = $line -split "=", 2
  Set-Item -Path "env:$name" -Value $value
}
if ($env:NEXT_PUBLIC_SUPABASE_URL -notmatch "ukwnnrrqmrvfwtbjjrbi\.supabase\.co") {
  Write-Error "Recusado: .env.test.local nao aponta para o projeto de testes."; exit 1
}
$env:NEXT_DIST_DIR = ".next-test"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { $env:Path = "C:\Program Files\nodejs;" + $env:Path }
Set-Location (Join-Path $PSScriptRoot "..")
& npx next dev -p 3001
