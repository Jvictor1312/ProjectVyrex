# Arquitetura da Vyrex

Resumo de uma página. O detalhe está em [arquetipo/04-como-funciona.md](../arquetipo/04-como-funciona.md) e a avaliação em [arquetipo/08-avaliacao-da-arquitetura.md](../arquetipo/08-avaliacao-da-arquitetura.md).

```
Navegador
   ▼
src/proxy.ts        nonce + política de conteúdo em toda página; renova a sessão nas telas com login
   ▼
Next.js 16 (servidor)
   ├─ páginas (Server Components): leem o banco com a sessão de quem está logado
   ├─ src/app/actions/*: Server Actions (Zod → sessão → RPC)
   ├─ src/lib/log.ts: registro de recusas e falhas (fetch dos clientes + onRequestError)
   └─ src/lib/supabase/admin.ts: chave de serviço, só no servidor
   ▼
Supabase
   ├─ Auth (e-mail + senha)
   ├─ Postgres: 21 tabelas com RLS; mudanças de estado só por RPC
   └─ Storage: story-evidence (privado) e site-media (público)
```

- **Regras no banco:** RLS em todas as tabelas; situação do cadastro, funções, responsáveis e critérios só mudam por RPC, com histórico e auditoria na mesma transação.
- **Tipos:** `src/lib/supabase/database.types.ts`, gerado do banco (`scripts/gen-db-types.ps1`).
- **Migrations:** `supabase/migrations/` (16, aditivas), registradas em `supabase_migrations.schema_migrations`; aplicar com `scripts/migrations.ps1`.
- **Áreas:** `src/app/dashboard` (criador, com `layout.tsx`), `src/app/interno` (equipe, moldura por página), `src/app/(auth)` e `(legal)` (públicas), `src/app/preview` (só em desenvolvimento).
- **Evolução prevista** (não implementada): marcas, campanhas, propostas, contratos, entregas, comissões e pagamentos. Novas tabelas devem referenciar `profiles` e reutilizar as permissões e a auditoria.
