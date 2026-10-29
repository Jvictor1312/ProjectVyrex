# Migrations: mostra o que falta e aplica, sempre registrando no banco.
#
#   scripts\migrations.ps1 -Banco testes            # situação (padrão)
#   scripts\migrations.ps1 -Banco testes -Aplicar   # aplica as que faltam
#   scripts\migrations.ps1 -Banco real   -Aplicar   # só depois de testar no de testes
#
# O registro fica em supabase_migrations.schema_migrations (a mesma tabela do
# Supabase CLI), então "supabase db push" também passa a enxergá-lo.
# Usa o token da variável do Windows SUPABASE_ACCESS_TOKEN (nunca em arquivo).
# Nunca apaga nada: só cria a tabela de registro e aplica migrations novas.
param(
  [Parameter(Mandatory = $true)][ValidateSet("real", "testes")][string]$Banco,
  [switch]$Aplicar,
  # Só para a primeira vez: marca como aplicadas as migrations até esta versão
  # (inclusive), sem rodá-las de novo. Use quando o banco já as tem.
  [string]$MarcarAte
)

$ErrorActionPreference = "Stop"
$ref = @{ real = "zofxrohoilwjtzbcruse"; testes = "ukwnnrrqmrvfwtbjjrbi" }[$Banco]
$token = [Environment]::GetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", "User")
if (-not $token) { throw "Variável SUPABASE_ACCESS_TOKEN não encontrada." }

function Invoke-Sql([string]$sql) {
  $body = [Text.Encoding]::UTF8.GetBytes((@{ query = $sql } | ConvertTo-Json -Depth 3))
  Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
    -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json; charset=utf-8" -Body $body
}

function Quote([string]$text) { "'" + $text.Replace("'", "''") + "'" }

Invoke-Sql @"
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);
"@ | Out-Null

$folder = Join-Path $PSScriptRoot "..\supabase\migrations"
$files = Get-ChildItem $folder -Filter *.sql | Sort-Object Name
$applied = @((Invoke-Sql "select version from supabase_migrations.schema_migrations") | ForEach-Object { $_.version })

foreach ($file in $files) {
  $version, $name = $file.BaseName -split "_", 2
  if ($applied -contains $version) { Write-Host "  ok        $($file.Name)"; continue }

  if ($MarcarAte -and $version -le $MarcarAte) {
    Invoke-Sql "insert into supabase_migrations.schema_migrations (version, name) values ($(Quote $version), $(Quote $name)) on conflict do nothing" | Out-Null
    Write-Host "  marcada   $($file.Name) (já estava no banco)"
    continue
  }
  if (-not $Aplicar) { Write-Host "  FALTA     $($file.Name)" -ForegroundColor Yellow; continue }

  $sql = [IO.File]::ReadAllText($file.FullName)
  # A migration e o registro vão juntos: se a migration falhar, nada é registrado.
  Invoke-Sql "begin;`n$sql`n;insert into supabase_migrations.schema_migrations (version, name) values ($(Quote $version), $(Quote $name));`ncommit;" | Out-Null
  Write-Host "  aplicada  $($file.Name)" -ForegroundColor Green
}
