# Guarda o e-mail e a senha das contas de TESTE do Vyrex (administrador e
# criador) como variáveis de ambiente do seu usuário do Windows.
# - Rode no terminal do VS Code:  powershell -ExecutionPolicy Bypass -File scripts\set-test-credentials.ps1
# - A senha é digitada às escondidas e não fica no projeto, no git nem na conversa.
# - Para trocar, rode de novo. Para apagar, rode com -Remove.
# - Contas descartáveis: serão excluídas quando o site for finalizado.
param([switch]$Remove)

$names = @(
  "VYREX_TEST_ADMIN_EMAIL", "VYREX_TEST_ADMIN_PASSWORD",
  "VYREX_TEST_USER_EMAIL", "VYREX_TEST_USER_PASSWORD"
)

if ($Remove) {
  foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $null, "User") }
  Write-Host "Credenciais de teste removidas."
  exit 0
}

function Read-Secret($prompt) {
  $secure = Read-Host $prompt -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

$adminEmail = Read-Host "E-mail da conta de teste ADMINISTRADOR (Enter = jvictorbviana+adm@gmail.com)"
if (-not $adminEmail) { $adminEmail = "jvictorbviana+adm@gmail.com" }
$adminPassword = Read-Secret "Senha da conta ADMINISTRADOR"
$userEmail = Read-Host "E-mail da conta de teste CRIADOR (Enter = jvictorbviana+user@gmail.com)"
if (-not $userEmail) { $userEmail = "jvictorbviana+user@gmail.com" }
$userPassword = Read-Secret "Senha da conta CRIADOR"

[Environment]::SetEnvironmentVariable("VYREX_TEST_ADMIN_EMAIL", $adminEmail, "User")
[Environment]::SetEnvironmentVariable("VYREX_TEST_ADMIN_PASSWORD", $adminPassword, "User")
[Environment]::SetEnvironmentVariable("VYREX_TEST_USER_EMAIL", $userEmail, "User")
[Environment]::SetEnvironmentVariable("VYREX_TEST_USER_PASSWORD", $userPassword, "User")
Write-Host "Pronto. Credenciais de teste guardadas no seu usuario do Windows."
