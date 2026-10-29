# Regera src/lib/supabase/database.types.ts a partir do banco (só leitura).
# Rode depois de aplicar uma migration. Usa o token salvo na variável do
# Windows SUPABASE_ACCESS_TOKEN (nunca escrito em arquivo).
param([string]$ProjectRef = "zofxrohoilwjtzbcruse")

$token = [Environment]::GetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", "User")
if (-not $token) { throw "Variável SUPABASE_ACCESS_TOKEN não encontrada." }

$response = Invoke-RestMethod `
  -Uri "https://api.supabase.com/v1/projects/$ProjectRef/types/typescript?included_schemas=public" `
  -Headers @{ Authorization = "Bearer $token" }

$header = @"
// Gerado a partir do banco real ($ProjectRef) pela Management API.
// Não edite à mão: depois de aplicar uma migration, rode
//   powershell -ExecutionPolicy Bypass -File scripts\gen-db-types.ps1


"@
$target = Join-Path $PSScriptRoot "..\src\lib\supabase\database.types.ts"
[IO.File]::WriteAllText((Resolve-Path $target), $header + $response.types, (New-Object Text.UTF8Encoding $false))
Write-Host "Tipos atualizados em src/lib/supabase/database.types.ts"
