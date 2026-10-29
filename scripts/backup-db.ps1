# Cópia de segurança dos DADOS do banco (só leitura).
#
#   powershell -ExecutionPolicy Bypass -File scripts\backup-db.ps1              # banco real
#   powershell -ExecutionPolicy Bypass -File scripts\backup-db.ps1 -Banco testes
#
# Grava em backups\<banco>-<data-hora>\ um JSON por tabela do esquema public,
# as contas (auth.users, sem senhas) e a lista de arquivos do Storage (sem os
# arquivos em si). A estrutura do banco está nas migrations do git; com as
# migrations + estes JSON dá para reconstruir os dados.
#
# A pasta backups\ fica fora do git (contém dados pessoais): guarde uma cópia
# em lugar seguro e fora deste computador. Usa o token da variável do Windows
# SUPABASE_ACCESS_TOKEN (nunca escrito em arquivo). Não altera nada no banco.
param([ValidateSet("real", "testes")][string]$Banco = "real")

$ErrorActionPreference = "Stop"
$ref = @{ real = "zofxrohoilwjtzbcruse"; testes = "ukwnnrrqmrvfwtbjjrbi" }[$Banco]
$token = [Environment]::GetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", "User")
if (-not $token) { throw "Variável SUPABASE_ACCESS_TOKEN não encontrada." }

function Invoke-Sql([string]$sql) {
  $body = [Text.Encoding]::UTF8.GetBytes((@{ query = $sql } | ConvertTo-Json -Depth 3))
  Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
    -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json; charset=utf-8" -Body $body
}

$stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$target = Join-Path $PSScriptRoot "..\backups\$Banco-$stamp"
New-Item -ItemType Directory -Force $target | Out-Null
$utf8 = New-Object Text.UTF8Encoding $false

function Save([string]$name, [string]$sql) {
  # O banco monta o JSON (json_agg); aqui só é salvo como texto.
  $rows = (Invoke-Sql "select coalesce(json_agg(t), '[]'::json)::text as data from ($sql) t").data
  [IO.File]::WriteAllText((Join-Path $target "$name.json"), $rows, $utf8)
  $count = (Invoke-Sql "select count(*)::int as n from ($sql) t").n
  Write-Host ("  {0,-32} {1,6} linhas" -f $name, $count)
  return [pscustomobject]@{ arquivo = "$name.json"; linhas = $count }
}

Write-Host "Copiando o banco $Banco ($ref) para $target"
$tables = Invoke-Sql "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name"
$manifest = @()
foreach ($table in $tables) {
  $manifest += Save "public.$($table.table_name)" "select * from public.$($table.table_name)"
}
$manifest += Save "auth.users" "select id, email, phone, created_at, updated_at, email_confirmed_at, last_sign_in_at, banned_until, raw_user_meta_data from auth.users"
$manifest += Save "storage.objects" "select bucket_id, name, created_at, updated_at, metadata from storage.objects"

$migrations = @((Invoke-Sql "select version from supabase_migrations.schema_migrations order by version") | ForEach-Object { $_.version })
$info = [pscustomobject]@{
  banco = $Banco
  projeto = $ref
  copiado_em = (Get-Date).ToString("o")
  ultima_migration = $migrations[-1]
  tabelas = $manifest
}
[IO.File]::WriteAllText((Join-Path $target "manifesto.json"), ($info | ConvertTo-Json -Depth 4), $utf8)
Write-Host "Pronto. Manifesto em $target\manifesto.json"
