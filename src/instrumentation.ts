// Roda uma vez quando o servidor do Next inicia.
//
// Conexões com o Supabase: o fetch do Node fecha uma conexão parada depois de
// cerca de 4 s (o Supabase não informa um prazo maior). Quem lê uma tela por
// mais tempo e clica de novo pagava a abertura de cada conexão (TCP + TLS),
// e cada consulta em paralelo usa uma conexão. Medido daqui até o Supabase
// (us-east-1), após 6 s parado: 1 consulta caiu de ~520 ms para ~165 ms e
// 9 em paralelo (Visão geral) de ~590 ms para ~430 ms. O Supabase mantém a
// conexão aberta; só o lado do Node fechava cedo.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { Agent, setGlobalDispatcher } = await import("undici");
  setGlobalDispatcher(
    new Agent({
      // Conexão parada continua aberta por até 60 s.
      keepAliveTimeout: 60_000,
      keepAliveMaxTimeout: 10 * 60_000,
    }),
  );
}
