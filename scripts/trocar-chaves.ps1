# Troca as chaves do Supabase (banco REAL) sem que elas apareçam na tela,
# no git ou na conversa. Rode no terminal do VS Code:
#   powershell -ExecutionPolicy Bypass -File scripts\trocar-chaves.ps1
#
# Pede, digitando às escondidas (Enter vazio = não trocar aquela):
#   1. chave publicável nova (sb_publishable_...) -> .env.local, NEXT_PUBLIC_SUPABASE_ANON_KEY
#   2. chave secreta nova    (sb_secret_...)      -> .env.local, SUPABASE_SERVICE_ROLE_KEY
#   3. token de acesso novo  (sbp_...)            -> variável do Windows SUPABASE_ACCESS_TOKEN
# Cada uma é conferida no Supabase antes de ser gravada; se não funcionar,
# nada é alterado. O passo a passo completo está em docs/GUIA_SMTP_E_CHAVES.md.

$ErrorActionPreference = "Stop"
$envFile = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envFile)) { throw ".env.local não encontrado na pasta do projeto." }

function Read-Secret($prompt) {
  $secure = Read-Host $prompt -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr).Trim() }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

$lines = [IO.File]::ReadAllLines((Resolve-Path $envFile))
$urlLine = $lines | Where-Object { $_ -match '^NEXT_PUBLIC_SUPABASE_URL=' } | Select-Object -First 1
if (-not $urlLine) { throw "NEXT_PUBLIC_SUPABASE_URL não está no .env.local." }
$url = ($urlLine -split "=", 2)[1].Trim().Trim('"')

# A chave funciona se o Auth do projeto a aceitar.
function Test-ApiKey($key) {
  try {
    Invoke-RestMethod -Uri "$url/auth/v1/settings" -Headers @{ apikey = $key } | Out-Null
    return $true
  } catch { return $false }
}

function Set-EnvLine($name, $value) {
  $found = $false
  for ($i = 0; $i -lt $script:lines.Count; $i++) {
    if ($script:lines[$i] -match "^$name=") { $script:lines[$i] = "$name=$value"; $found = $true }
  }
  if (-not $found) { $script:lines += "$name=$value" }
}

$changed = @()

$publishable = Read-Secret "1/3 Chave PUBLICAVEL nova (sb_publishable_...; Enter = manter)"
if ($publishable) {
  if ($publishable -notlike "sb_publishable_*") { throw "Essa não parece uma chave publicável (deve começar com sb_publishable_). Nada foi alterado." }
  if (-not (Test-ApiKey $publishable)) { throw "O Supabase recusou a chave publicável. Nada foi alterado." }
  Set-EnvLine "NEXT_PUBLIC_SUPABASE_ANON_KEY" $publishable
  $changed += "chave publicável"
}

$secret = Read-Secret "2/3 Chave SECRETA nova (sb_secret_...; Enter = manter)"
if ($secret) {
  if ($secret -notlike "sb_secret_*") { throw "Essa não parece uma chave secreta (deve começar com sb_secret_). Nada foi alterado." }
  if (-not (Test-ApiKey $secret)) { throw "O Supabase recusou a chave secreta. Nada foi alterado." }
  Set-EnvLine "SUPABASE_SERVICE_ROLE_KEY" $secret
  $changed += "chave secreta"
}

$token = Read-Secret "3/3 Token de acesso novo (sbp_...; Enter = manter)"
if ($token) {
  if ($token -notlike "sbp_*") { throw "Esse não parece um token de acesso (deve começar com sbp_). Nada foi alterado." }
  try {
    Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects" -Headers @{ Authorization = "Bearer $token" } | Out-Null
  } catch { throw "O Supabase recusou o token de acesso. Nada foi alterado." }
}

if ($publishable -or $secret) {
  [IO.File]::WriteAllLines((Resolve-Path $envFile), $lines, (New-Object Text.UTF8Encoding $false))
}
if ($token) {
  [Environment]::SetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", $token, "User")
  $changed += "token de acesso"
}

if ($changed.Count -eq 0) { Write-Host "Nada foi alterado."; exit 0 }
Write-Host "Pronto. Trocado(s): $($changed -join ', ')."
Write-Host "Agora: feche e abra o VS Code (para o servidor e o terminal lerem os valores novos) e avise o Claude para conferir o site."
