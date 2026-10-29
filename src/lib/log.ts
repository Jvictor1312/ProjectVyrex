// Registro de erros do servidor. Antes, quando o banco recusava ou falhava,
// o usuário via uma mensagem neutra e o erro não ficava em lugar nenhum.
// Agora cada ocorrência vira uma linha JSON no log do servidor (terminal em
// desenvolvimento; painel de logs da hospedagem em produção), pronta para ser
// lida por um serviço de alertas.
//
// Nada de dados pessoais: nunca registre o conteúdo de formulários, e-mails,
// CPF, tokens ou o endereço completo com parâmetros de busca.

type Level = "erro" | "aviso";

const maxText = 300;

function cut(value: unknown) {
  const text = typeof value === "string" ? value : String(value ?? "");
  return text.length > maxText ? `${text.slice(0, maxText)}…` : text;
}

export function logServer(level: Level, where: string, details: Record<string, unknown>) {
  const line = JSON.stringify({
    nivel: level,
    onde: where,
    quando: new Date().toISOString(),
    ...details,
  });
  if (level === "erro") console.error(line);
  else console.warn(line);
}

export function logServerError(where: string, error: unknown, level: Level = "erro") {
  const details: Record<string, unknown> =
    error instanceof Error
      ? { tipo: error.name, mensagem: cut(error.message) }
      : { mensagem: cut(error) };
  if (error && typeof error === "object") {
    if ("digest" in error) details.digest = String(error.digest);
    if ("code" in error) details.codigo = String(error.code);
  }
  logServer(level, where, details);
}

// Recusas previstas pelas regras do banco (sem permissão, regra de negócio,
// registro inexistente, e-mail repetido) são avisos; o resto é erro.
const expectedCodes = new Set(["42501", "P0001", "PGRST116", "23505", "22023", "55000"]);

// Envolve o fetch dos clientes Supabase do servidor: toda resposta de erro do
// banco (REST) e do Storage é registrada, e do Auth só as falhas do próprio
// serviço (senha errada não é erro do sistema). O corpo é lido de uma cópia,
// então quem chamou recebe a resposta intacta.
export const loggedFetch: typeof fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    logServerError(`supabase ${url.pathname.split("/").slice(0, 3).join("/")}`, error);
    throw error;
  }
  if (response.ok) return response;

  const parts = url.pathname.split("/");
  const service = parts[1];
  if (service === "auth" && response.status < 500) return response;
  // No Storage, o caminho traz o id do usuário e o nome do arquivo: fica só
  // até o nome do bucket.
  const path = service === "storage" ? parts.slice(0, 5).join("/") : url.pathname;

  let body: { code?: unknown; message?: unknown; error?: unknown } = {};
  try {
    body = await response.clone().json();
  } catch {
    // Resposta sem JSON: registra só o status.
  }
  const code = body.code === undefined ? undefined : String(body.code);
  logServer(
    response.status >= 500 || !code || !expectedCodes.has(code) ? "erro" : "aviso",
    `supabase ${init?.method ?? "GET"} ${path}`,
    {
      status: response.status,
      codigo: code,
      mensagem: cut(body.message ?? body.error ?? ""),
    },
  );
  return response;
};
