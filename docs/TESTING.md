# Testes

Detalhes, números atuais e o que não é coberto: [arquetipo/05-testes.md](../arquetipo/05-testes.md).

## Comandos

| Comando | O que roda | Precisa de |
| --- | --- | --- |
| `npm run typecheck` | TypeScript | nada |
| `npm run lint` | ESLint | nada |
| `npm test` | regras e banco (PGlite), validação, registro de erros | nada |
| `npm run build` | build de produção | `.env.local` (ou os valores de exemplo do CI) |
| `npm run test:e2e` | navegador no banco real, só leitura, incluindo a auditoria de acessibilidade (axe) | variáveis `VYREX_TEST_*` do Windows |
| `npm run test:flows` | fluxo completo no banco de **testes** | `.env.test.local` |

O GitHub roda `typecheck`, `lint`, `npm test`, `build` e `npm audit` a cada envio (`.github/workflows/verificacoes.yml`).

## Onde ficam

- `supabase/tests/*.test.mjs`: banco (todas as migrations aplicadas num Postgres em memória).
- `tests/*.test.mjs`: unidade.
- `tests/e2e/`: navegador, banco real (só leitura). `accessibility.spec.ts` audita 15 telas.
- `tests/e2e-flows/`: fluxo completo, banco de testes.

## Migration nova

Inclua-a no `before()` de `supabase/tests/initial-platform.test.mjs`, escreva o teste, rode `npm test`, aplique no banco de testes (`scripts\migrations.ps1 -Banco testes -Aplicar`), rode `npm run test:flows` e só então aplique no real.
