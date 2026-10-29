# Vyrex — passagem para o próximo colaborador

Atualizado em 2026-10-28. Este documento diz **onde o trabalho parou** e **como continuar** sem refazer nada. Leia nesta ordem: este arquivo → `CLAUDE.md` (regras do dono do projeto) → `docs/TASKS.md` (pendências) → `docs/TESTING.md`.

## 1. Onde paramos

- Último commit desta etapa: veja `git log -1`. A `main` local e a `origin/main` estavam iguais e sem alterações pendentes.
- **Funciona e foi testado:** cadastro e login, área do criador (perfil, redes, evidências, envio, desfazer envio, mensagens, configurações, CPF opcional), área da equipe (fila, ficha, encaminhamento, decisão, colaboradores, critérios, vídeo, privacidade, histórico agrupado), recuperação de senha com mensagens neutras, celular (até 760px).
- **Última rodada:** revisão de textos, acessibilidade e indexação (`cd5d75c`), projeto Supabase de testes com fluxo completo (`aa1e3f9`, `ebcc5e9`).
- **Resultado das verificações nessa rodada:** `npm test` 47/47; `npm run test:e2e` 55 aprovados e 3 pulados de propósito (banco real, só leitura); `npm run test:flows` 10/10 (banco de testes); typecheck, lint, build e `npm audit` (0 vulnerabilidades) sem erros. Detalhes em `docs/RELATORIO_TESTES.md`.

## 2. Regras que não podem ser quebradas

1. **Nunca apagar dados do Supabase real** (`zofxrohoilwjtzbcruse`): nada de `delete`, `truncate`, `drop` ou reset.
2. **Não publicar em produção** sem autorização do dono.
3. **Segredos fora do git:** nunca commitar `.env*` (exceto `.env.example`), nem escrever chaves, senhas ou tokens em arquivos, logs ou mensagens.
4. Testes que **alteram dados** só no projeto de testes (`ukwnnrrqmrvfwtbjjrbi`). No banco real, só leitura.
5. Commits em Conventional Commits, em português, com push para `origin main` ao fim de cada bloco.
6. Não commitar `next-env.d.ts`/`tsconfig.json` quando a única mudança for o caminho `.next/dev` ou `.next-test` (desfazer com `git checkout -- next-env.d.ts tsconfig.json`).

## 3. O que NÃO está no GitHub (e como obter)

Por segurança, estes itens ficam só no computador do dono. Peça a ele; não peça senhas por chat aberto.

| Item | Para que serve | Como recriar |
| --- | --- | --- |
| `.env.local` | Ligar o site ao Supabase real | Copiar `.env.example` e preencher com URL, chave pública e chave de serviço (painel do Supabase → Project Settings → API) |
| `.env.test.local` | Ligar o servidor 3001 ao projeto de testes | Variáveis na seção 4 abaixo; as contas são recriadas com `npm run seed:test` |
| Variáveis do Windows `VYREX_TEST_ADMIN_EMAIL/PASSWORD`, `VYREX_TEST_USER_EMAIL/PASSWORD` | Contas descartáveis `+adm` e `+user` no banco real (testes só leitura) | `powershell -ExecutionPolicy Bypass -File scripts\set-test-credentials.ps1` |
| Variável do Windows `SUPABASE_ACCESS_TOKEN` | Management API (aplicar migrations) | Gerar em supabase.com/dashboard/account/tokens |
| `playwright/.auth/` | Sessões salvas dos testes | Gerado sozinho pelo `npm run test:e2e` |

## 4. Variáveis do `.env.test.local` (só os nomes)

```env
NEXT_PUBLIC_SUPABASE_URL=        # https://ukwnnrrqmrvfwtbjjrbi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# Contas fictícias (@vyrex.test) criadas por scripts/seed-test-project.mjs
VYREX_E2E_ADMIN_EMAIL=
VYREX_E2E_ADMIN_PASSWORD=
VYREX_E2E_RECRUTADOR_EMAIL=
VYREX_E2E_RECRUTADOR_PASSWORD=
VYREX_E2E_GESTOR_EMAIL=
VYREX_E2E_GESTOR_PASSWORD=
VYREX_E2E_ANALISTA_EMAIL=
VYREX_E2E_ANALISTA_PASSWORD=
VYREX_E2E_CRIADOR_A_EMAIL=
VYREX_E2E_CRIADOR_A_PASSWORD=
VYREX_E2E_CRIADOR_B_EMAIL=
VYREX_E2E_CRIADOR_B_PASSWORD=
```

O seed recusa rodar se a URL não for a do projeto de testes.

## 5. Primeiros passos para continuar

```powershell
npm install
npm run dev                      # http://localhost:3000 (banco real)
npm run typecheck; npm run lint; npm test
npm run test:e2e                 # precisa das variáveis VYREX_TEST_* do Windows
powershell -ExecutionPolicy Bypass -File scripts\dev-test.ps1   # http://localhost:3001 (banco de testes)
npm run test:flows
```

Telas sem login (só em desenvolvimento): `/preview/criador`, `/preview/criador/cadastro`, `/preview/criador/evidencias`, `/preview/equipe`, `/preview/equipe/colaboradores`.

## 6. Mapa rápido do código

- `src/app/(auth)/` login, cadastro, confirmação, recuperação · `src/app/actions/` Server Actions (auth, creator, internal, site).
- `src/app/dashboard/` área do criador · `src/app/interno/` área da equipe (componentes em `interno/ui.tsx`).
- `src/lib/labels.ts` vocabulário único das situações · `src/lib/audit-groups.ts` agrupamento do histórico · `src/lib/rate-limit.ts` limite de tentativas.
- `src/proxy.ts` sessão e proteção de rotas · `next.config.ts` cabeçalhos de segurança (CSP, noindex).
- `supabase/migrations/` 13 migrations, todas aplicadas no real e no de testes; novas devem ser aditivas, aplicadas primeiro no projeto de testes e incluídas em `tests/` (PGlite).
- `tests/` unitários (PGlite) · `tests/e2e/` navegador no banco real (só leitura) · `tests/e2e-flows/` fluxos no banco de testes.

## 7. Próximas tarefas, em ordem de prioridade

1. **Segurança antes de publicar:** CSP com *nonce* (tirar `'unsafe-inline'` de `next.config.ts`) e limite de tentativas compartilhado entre servidores (hoje fica na memória de cada servidor; ex.: tabela no Postgres ou Upstash).
2. **SMTP próprio** no Supabase e aplicar os modelos de `supabase/templates/` (e-mails em português); depois testar recuperação por CPF de ponta a ponta.
3. **Teste em celular de verdade** (iPhone e Android).
4. **Mostrar `creatorStatusDescriptions`** (já existe em `src/lib/labels.ts`, ainda sem uso) na visão geral do criador.
5. **Busca sem acento** ("joao" → "João") com `unaccent` ou coluna normalizada.
6. **Revisão jurídica** dos termos e da política de privacidade (ainda rascunhos).
7. **Fim do projeto (decisão do dono):** trocar as chaves do Supabase e o token de acesso, que foram expostos em conversa; apagar as contas `+adm` e `+user`.
8. Arquivo de vídeo duplicado no Storage real (`presentation/112708a0-…mp4`, 24 MB, sem uso): **só apagar com autorização**.

Lista completa e histórico de decisões: `docs/TASKS.md`.

## 8. Limitações conhecidas

- A página 404 de uma ficha sem permissão responde HTTP 200 (por causa do carregamento progressivo do Next); o conteúdo mostrado é o de "não encontrado" e os dados não vazam.
- Barra de progresso por arquivo no envio de evidências não existe (Server Actions não informam progresso).
- `/interno` é um painel único que se adapta à função de cada pessoa.
