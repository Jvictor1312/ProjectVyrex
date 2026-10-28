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
- **Tela por tela:** depois de cada alteração visível, abra o site num navegador **visível** e percorra as telas afetadas uma por uma, no ritmo em que o usuário consiga acompanhar. Use o Claude in Chrome quando estiver conectado; senão, use a skill `agent-browser` com janela visível (veja "Skills do projeto").
- **Prova do resultado:** tire prints das telas alteradas e mostre ao usuário. Diga em qual endereço (por exemplo, `localhost:3000/dashboard`) ele pode ver cada mudança e o que mudou ali.
- Se não houver como abrir um navegador visível, diga isso claramente e mostre a verificação alternativa que foi feita. Nunca afirme que mostrou uma tela que não foi aberta.

## Ambiente local

- Node.js 24 LTS instalado em `C:\Program Files\nodejs`. Se o shell não encontrar `node`/`npm`, adicione esse caminho ao PATH do comando.
- Python 3.13 instalado (`%LOCALAPPDATA%\Programs\Python\Python313`), usado pela skill `graphify`.
- `agent-browser` 0.40 instalado globalmente (`npm i -g agent-browser`, em `%APPDATA%\npm`). Chrome em `C:\Program Files\Google\Chrome\Application\chrome.exe`.
- Claude in Chrome está conectado: prefira-o para mostrar as telas ao usuário no Chrome dele.
- Servidor de desenvolvimento: `npm run dev` → http://localhost:3000 (hot reload).
- Verificações: `npm run typecheck`, `npm run lint`, `npm test` (PGlite + validação), `npm run build` e `npm run test:e2e` (Playwright no Chrome instalado, projetos "computador" e "celular"; testes em `tests/e2e/`).
- Next.js desta versão tem mudanças em relação ao que você conhece: consulte `node_modules/next/dist/docs/` antes de escrever código Next (ver `AGENTS.md`).

## Skills do projeto (`.claude/skills/`)

Instaladas pelo `npx skills add` (registradas em `skills-lock.json`; atualize com `npx skills update -p -y`) ou copiadas à mão.

- **`agent-browser`**: navegador automatizado para ver e testar telas. Antes do primeiro uso na sessão, leia o guia com `agent-browser skills get core`. Use sempre uma sessão própria (`$env:AGENT_BROWSER_SESSION = "vyrex-<tarefa>"`) e, para mostrar ao usuário, janela visível com o Chrome instalado: `agent-browser --headed --executable-path "C:\Program Files\Google\Chrome\Application\chrome.exe" open http://localhost:3000`. Depois `snapshot -i`, `click @eN` e `screenshot <arquivo>`. Para caçar bugs pelas telas: `agent-browser skills get dogfood`. Feche com `agent-browser close` ao terminar.
- **`design-taste-frontend`**: direção de arte e inspeção visual. O inspetor `node .claude/skills/design-taste-frontend/scripts/inspect.mjs <url> [--app]` mede a página em 1440/768/390 px e salva prints em `.taste-skill/inspect/` (ignorado pelo git). Use `--app` nos painéis (`/dashboard`, `/equipe`, previews). As "regras da casa" dela (sem linhas finas, sem caixas com borda, mais fotos etc.) são sugestões: **a identidade preto e branco e minimalista da Vyrex vale mais** (seção 9 das diretrizes). Não rode `assets.mjs` (baixa imagens da internet) sem o usuário pedir.
- **`web-design-guidelines`**, **`vercel-react-best-practices`**: revisão de interface/acessibilidade e de desempenho React/Next.
- **`ui-ux-pro-max`**: referência de usabilidade e sistema visual (tabelas em `data/`, como `ux-guidelines.csv` e `app-interface.csv`). Use para decisões de layout de painéis, formulários e tabelas; a identidade preto e branco da Vyrex continua valendo.
- **`accessibility`** (WCAG 2.2) e **`tailwindcss-mobile-first`**: auditoria de acessibilidade e padrões de layout para celular primeiro. O projeto usa CSS próprio (módulos e `globals.css`), não classes do Tailwind: aproveite os princípios, não as classes.
- **`code-review`** (Sentry): revisão de código por segurança, desempenho, testes e design. Tem o mesmo nome do `/code-review` nativo do Claude Code.
- **`application-security-testing`**: guia do Strix (teste de invasão). A ferramenta não está instalada (exige Docker e chave de IA, ou conta na nuvem). Nunca rodar contra produção sem autorização expressa do usuário.
- **`security-and-hardening`**: proteção ao escrever código que recebe dados do usuário, login, sessão, uploads ou integrações. Para revisar alterações prontas, use também o `/security-review` do Claude Code.
- **`supabase`**, **`supabase-postgres-best-practices`**: qualquer trabalho com banco, RLS, Auth ou Storage.
- **`systematic-debugging`**, **`test-driven-development`**, **`verification-before-completion`**: processo para corrigir bugs, escrever testes e só declarar pronto com prova.
- **`git-commit`**: commits em Conventional Commits (português).
- **`graphify`**: perguntas sobre a estrutura do código (usa `graphify-out/`).
- **`grilling`**: quando o usuário quiser "ser sabatinado" sobre um plano ou ideia antes de construir.
- **`find-skills`**: procurar novas skills quando faltar alguma capacidade. Instale no projeto com `npx skills add <repo> --skill <nome> -a claude-code --copy -y`.

Removidas por não servirem a este projeto: `hyperframes` (vídeo), `frontend-design` (substituída pela `design-taste-frontend`), `webapp-testing` (substituída pela `agent-browser`), `using-git-worktrees` (o projeto trabalha direto na `main`) e `requesting-code-review` (o Claude Code já tem `/code-review`).

## Supabase

- Projeto na nuvem `zofxrohoilwjtzbcruse` (nome "Vyrex", região us-east-1). Chaves em `.env.local`: pública (formato antigo `eyJ`) e `SUPABASE_SERVICE_ROLE_KEY` com a chave secreta nova (`sb_secret_`), usada só no servidor (e-mails da equipe, convites, recuperação por CPF).
- Todas as migrations de `supabase/migrations/` (até `202610280008_user_id_for_email.sql`) estão aplicadas no banco (pelo SQL Editor ou pela Management API; não existe a tabela `supabase_migrations.schema_migrations`). Novas migrations devem ser aditivas e não destrutivas; aplique-as pela Management API (`POST /v1/projects/{ref}/database/query`) e inclua-as nos testes PGlite.
- Critérios atuais no banco: 0 seguidores mínimos, 1.000 visualizações por evidência e **3 evidências obrigatórias** (posições 1 a 3; a 4ª e a 5ª são opcionais). As diretrizes citam 3.000/2.000 e 5 evidências: estão desatualizadas.
- E-mails do Supabase: no plano gratuito sem SMTP próprio os textos não podem ser alterados. Os modelos em português estão em `supabase/templates/`; aplique-os quando o usuário configurar o SMTP.
- Contas de teste: `jvictorbviana+user@gmail.com` (criador) e `jvictorbviana+adm@gmail.com` (admin). O Claude pode entrar nelas (veja "Testar telas com login").
- O access token do Supabase (`sbp_...`) está salvo, a pedido do usuário, na variável de ambiente do usuário do Windows `SUPABASE_ACCESS_TOKEN`. Use-a para a Management API e o Supabase CLI. Nunca escreva o valor em arquivos do projeto, logs ou mensagens.

## Documentação

- `docs/TASKS.md`: tarefas e progresso (atualize após cada conjunto de alterações).
- `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/SECURITY.md`, `docs/TESTING.md`.
- `README.md`: instalação e configuração.

## Testar telas com login

- **Contas de teste (autorizado pelo usuário em 2026-10-28):** o Claude pode entrar sempre que precisar nas contas de teste `+adm` (administrador) e `+user` (criador). São descartáveis e serão excluídas quando o site for finalizado. O e-mail e a senha ficam em variáveis de ambiente do usuário do Windows (`VYREX_TEST_ADMIN_EMAIL`, `VYREX_TEST_ADMIN_PASSWORD`, `VYREX_TEST_USER_EMAIL`, `VYREX_TEST_USER_PASSWORD`), gravadas pelo próprio usuário com `scripts/set-test-credentials.ps1`.
  - **Nunca** imprima, registre ou escreva esses valores em arquivos, commits, logs ou mensagens. Leia-os do registro na hora: `[Environment]::GetEnvironmentVariable('VYREX_TEST_ADMIN_PASSWORD','User')`.
  - **Testes automáticos:** `npm run test:e2e` (ou `scripts/e2e.ps1 [args do Playwright]`). O setup entra nas duas contas e guarda as sessões em `playwright/.auth/` (fora do git), reaproveitadas por 30 min.
  - **Para mostrar telas** com agent-browser: abra `/login`, preencha `input[name=email]` e `input[name=password]` passando o valor da variável dentro do próprio comando (sem ecoar) e clique em "Entrar".
  - Se as variáveis não existirem, peça ao usuário para rodar `powershell -ExecutionPolicy Bypass -File scripts\set-test-credentials.ps1` no terminal do VS Code. Não peça a senha na conversa.
  - Com essas contas, só navegue e leia. Salvar, enviar cadastro, apagar evidência, convidar, mudar funções, desativar, decidir cadastros ou mudar critérios só com pedido explícito do usuário, porque o banco é o real. O limite de login é 8 tentativas por e-mail a cada 15 min.
- O Claude não cria outras contas no Supabase real. Pode dar a função de equipe a uma conta via SQL quando o usuário pedir.
- Sem login, use as previews (só em desenvolvimento): `/preview/criador`, `/preview/criador/cadastro`, `/preview/criador/evidencias`, `/preview/equipe`, `/preview/equipe/colaboradores`.
- **Celular primeiro** (decisão do usuário: a maioria dos usuários vem do celular; o computador já está aprovado). Ajustes de celular ficam em `@media (max-width: 760px)` sem alterar o computador: campos com 16px (sem zoom no iPhone), alvos de toque de 44px ou mais, texto de 12px no mínimo, menu do criador fixo embaixo. Confira em 390 e 360px. Elas usam os mesmos componentes das telas reais; mantenha assim ao criar novas telas.

## Problemas conhecidos

- Arquivos estáticos ficam em `public/` (minúsculo; o Linux diferencia maiúsculas). A antiga pasta `Public/` só tinha duas imagens corrompidas e foi removida em 2026-10-28 (continuam no histórico do git).

@docs/DIRETRIZES.md
