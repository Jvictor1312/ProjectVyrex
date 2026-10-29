# Segurança

A versão completa e conferida está em [arquetipo/07-seguranca.md](../arquetipo/07-seguranca.md). Aqui fica só o essencial para quem vai mexer no código.

## Regras ao escrever código

1. **Permissão no banco, não na tela.** Toda mudança de estado nova é uma RPC `security definer` com `search_path` fixo, que confere `has_permission(...)`. Esconder um botão é só conforto.
2. **Entrada sempre pelo Zod** no servidor. Em erro, devolva `validationFailure(...)` (mensagem e campo) e nunca o erro cru do banco.
3. **Chave de serviço** só via `createSupabaseAdminClient()` (arquivo `server-only`), e só depois de conferir a permissão de quem pediu.
4. **Nada de dados pessoais em logs.** Use `logServer`/`logServerError` (`src/lib/log.ts`); nunca registre formulários, e-mails, CPF, tokens ou endereços com parâmetros.
5. **Scripts:** a política de conteúdo só aceita scripts com o nonce da página. Não use `dangerouslySetInnerHTML` com script nem carregue scripts de outros domínios sem ajustar `src/lib/security/csp.ts`.
6. **Redirecionamento** só com `safeLocalRedirectPath`.
7. **Arquivos enviados** passam por `normalizeEvidenceImage` (prints) e por buckets com política própria.
8. **Testes de segurança novos** vão em `supabase/tests/` (PGlite), agindo como cada função com `asUser(...)`.

## Antes de publicar

Lista completa em [arquetipo/07-seguranca.md](../arquetipo/07-seguranca.md#o-que-falta-antes-de-publicar): trocar as chaves e o token expostos em conversa, SMTP próprio, `site_url` do Auth, CAPTCHA, revisão jurídica e apagar as contas de teste.
