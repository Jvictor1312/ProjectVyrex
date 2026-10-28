# Vyrex — contexto do projeto

Plataforma web de recrutamento, validação e gestão de influenciadores digitais. Stack: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 + Supabase (Auth, Postgres com RLS, Storage).

## Diretrizes do projeto: BASE, não regra absoluta

As diretrizes completas estão em `docs/DIRETRIZES.md` (importadas no fim deste arquivo). **Elas são uma base de referência, não uma regra 100%.** Muita coisa descrita lá já foi feita, e algumas foram alteradas depois. Antes de agir com base nelas, confira o estado real do código, do banco e de `docs/TASKS.md`. Em caso de divergência, vale esta ordem:

1. o que o usuário pedir na conversa;
2. o estado real do código e do banco;
3. as diretrizes.

As diretrizes não são uma ordem para recomeçar a auditoria a cada sessão. Trabalhe no que o usuário pedir, usando-as como contexto do produto e padrão de qualidade.

## Regras firmes do usuário

- **Nunca apagar dados do Supabase.** O usuário decidiu manter todos os dados existentes, sem opção de apagar. Nada de `delete`, `truncate`, `drop` ou reset em dados reais.
- **Git e GitHub:** o usuário autorizou commit e push para `origin main` (https://github.com/Jvictor1312/ProjectVyrex) ao concluir alterações. Use Conventional Commits em português (skill `git-commit`). Nunca commitar `.env*` (exceto `.env.example`). Não commitar `next-env.d.ts` quando a única mudança for o caminho `.next/dev/types` gerado pelo `next dev`.
- **Subir tudo no GitHub, sem exceção:** faça commit e push ao fim de cada bloco de trabalho, não só no final da tarefa. Se o contexto ou os tokens estiverem acabando, pare, faça commit e push do que já foi feito e registre o que falta em `docs/TASKS.md`.
- **Não publicar em produção** sem autorização explícita.
- O usuário não programa com frequência: explique em português simples e sem jargão desnecessário.

## Mostrar o trabalho, não só fazer (regra do usuário)

O usuário acompanha tudo pelo VS Code, com o site aberto. **Dê mais empenho a mostrar o que foi feito do que só fazer.**

- **Site sempre rodando:** o VS Code liga o servidor sozinho ao abrir a pasta (tarefa "Vyrex: servidor local" em `.vscode/tasks.json`). Antes de iniciar um servidor, verifique se http://localhost:3000 já responde. Se responder, use esse servidor e não abra outro. Se não responder, inicie `npm run dev` e mantenha-o ligado durante todo o trabalho.
- **Tela por tela:** depois de cada alteração visível, abra o site num navegador **visível** e percorra as telas afetadas uma por uma, no ritmo em que o usuário consiga acompanhar. Use o Claude in Chrome quando estiver conectado; senão, use o Playwright com `headless=False` (skill `webapp-testing`).
- **Prova do resultado:** tire prints das telas alteradas e mostre ao usuário. Diga em qual endereço (por exemplo, `localhost:3000/dashboard`) ele pode ver cada mudança e o que mudou ali.
- Se não houver como abrir um navegador visível, diga isso claramente e mostre a verificação alternativa que foi feita. Nunca afirme que mostrou uma tela que não foi aberta.

## Ambiente local

- Node.js 24 LTS instalado em `C:\Program Files\nodejs`. Se o shell não encontrar `node`/`npm`, adicione esse caminho ao PATH do comando.
- Python 3.13 instalado (`%LOCALAPPDATA%\Programs\Python\Python313`), com `playwright` e Chromium para a skill `webapp-testing`.
- Claude in Chrome está conectado: prefira-o para mostrar as telas ao usuário no Chrome dele.
- Servidor de desenvolvimento: `npm run dev` → http://localhost:3000 (hot reload).
- Verificações: `npm run typecheck`, `npm run lint`, `npm test` (PGlite + validação), `npm run build`.
- Next.js desta versão tem mudanças em relação ao que você conhece: consulte `node_modules/next/dist/docs/` antes de escrever código Next (ver `AGENTS.md`).

## Supabase

- Projeto na nuvem `zofxrohoilwjtzbcruse` (nome "Vyrex", região us-east-1). Chaves públicas em `.env.local`; `SUPABASE_SERVICE_ROLE_KEY` ainda é placeholder.
- As 5 migrations de `supabase/migrations/` já estão aplicadas no banco (aplicadas pelo SQL Editor; não existe a tabela `supabase_migrations.schema_migrations`). Novas migrations devem ser aditivas e não destrutivas.
- Critérios de elegibilidade atuais no banco: 0 seguidores mínimos e 1.000 visualizações por evidência (a migration `202610150004` alterou os valores iniciais de 3.000/2.000 citados nas diretrizes).
- O access token do Supabase (`sbp_...`) está salvo, a pedido do usuário, na variável de ambiente do usuário do Windows `SUPABASE_ACCESS_TOKEN`. Use-a para a Management API e o Supabase CLI. Nunca escreva o valor em arquivos do projeto, logs ou mensagens.

## Documentação

- `docs/TASKS.md`: tarefas e progresso (atualize após cada conjunto de alterações).
- `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/SECURITY.md`, `docs/TESTING.md`.
- `README.md`: instalação e configuração.

## Testar telas com login

- O Supabase é o banco real na nuvem: o Claude não cria contas nem digita senhas nele. O usuário cria as contas de teste e entra no Chrome; o Claude pode dar a função de equipe a uma conta via SQL quando o usuário pedir.
- Sem login, use as previews (só em desenvolvimento): `/preview/criador`, `/preview/criador/evidencias`, `/preview/equipe`. Elas usam os mesmos componentes das telas reais; mantenha assim ao criar novas telas.

## Problemas conhecidos

- `Public/image.png` e `Public/image2.png` estão corrompidos e não são usados. A pasta `Public` com P maiúsculo funciona no Windows, mas quebra em Linux (deploy).

@docs/DIRETRIZES.md
