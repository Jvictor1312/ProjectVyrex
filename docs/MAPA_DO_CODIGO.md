# Vyrex — mapa do código

Leitura geral da estrutura do código, escrita para dar contexto a uma IA (ou a uma pessoa nova) antes de mexer no projeto. Reflete o código em **2026-10-28** (commit `d87f200`). Tudo aqui foi conferido lendo os arquivos; onde a documentação antiga diverge do código, isso está apontado na seção 14.

Ordem de leitura sugerida: este arquivo → `CLAUDE.md` (regras do dono) → `docs/PASSAGEM.md` (onde o trabalho parou) → `docs/TASKS.md` (pendências).

---

## 1. Em uma frase

Site Next.js 16 (App Router, React 19, TypeScript) ligado ao Supabase (Auth, Postgres, Storage). **A regra de negócio e a segurança moram no banco** (RLS + funções `security definer`); o Next.js valida a entrada com Zod, confere a sessão e chama o banco **com a sessão do próprio usuário**. A chave de serviço (`service_role`) só é usada no servidor, em três situações pontuais (convites da equipe, e-mails/último acesso dos colaboradores, recuperação de senha por CPF).

```
Navegador
  │  formulários (Server Actions) e links
  ▼
Next.js (servidor)
  ├─ src/proxy.ts ............ renova a sessão e barra quem não tem login
  ├─ páginas (Server Components): leem dados com a sessão do usuário
  ├─ src/app/actions/*.ts .... Server Actions: Zod → requireSession → banco
  └─ src/lib/supabase/admin.ts (só servidor, chave de serviço, uso raro)
  ▼
Supabase
  ├─ Auth (e-mail + senha; token conferido localmente com getClaims)
  ├─ Postgres: tabelas + RLS + RPCs (mudanças de estado só por RPC)
  └─ Storage: story-evidence (privado) e site-media (público, vídeo)
```

---

## 2. Pilha e dependências

| Item | Versão / uso |
| --- | --- |
| `next` | ^16 (App Router). Esta versão muda APIs: consulte `node_modules/next/dist/docs/` antes de escrever código Next (`AGENTS.md`). Ex.: o antigo `middleware.ts` aqui se chama **`src/proxy.ts`** e exporta `proxy`. |
| `react` / `react-dom` | ^19.2 (`useActionState`, `useTransition`) |
| `@supabase/ssr` + `@supabase/supabase-js` | clientes com cookies (servidor) e do navegador |
| `zod` | ^4 (validação de todas as entradas no servidor) |
| `sharp` | normaliza as imagens de evidência (reencoda em WebP) |
| `libphonenumber-js` | valida e normaliza telefone (formato `+55…`) |
| Tailwind 4 | **importado** em `globals.css` (`@import "tailwindcss"`), mas o projeto **não usa classes utilitárias**: o visual é CSS próprio (`globals.css` + CSS Modules). |
| Dev | TypeScript 5.9 (strict), ESLint 9 (flat config), Playwright, PGlite (Postgres em memória para testes), Supabase CLI |

Alias de importação: `@/*` → `src/*` (`tsconfig.json`). Node ≥ 22.6 (`package.json`, usa `--experimental-strip-types` nos testes).

### Scripts (`package.json`)

| Script | O que faz |
| --- | --- |
| `npm run dev` | servidor em `localhost:3000` (banco **real**) |
| `npm run build` / `start` | build de produção |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm test` | testes do banco em PGlite + validação (runner nativo do Node) — 47 testes |
| `npm run test:e2e` | Playwright no banco real, **só leitura** (via `scripts/e2e.ps1`) |
| `npm run test:flows` | Playwright no **projeto de testes** (`localhost:3001`) com fluxo completo |
| `npm run seed:test` | cria/redefine as contas fictícias do projeto de testes |
| `npm run seed:local-users` | script antigo para contas locais (`scripts/seed-local-test-users.mjs`) |

---

## 3. Árvore de pastas (o que importa)

```
src/
  proxy.ts                    sessão + proteção de rotas (antigo "middleware")
  app/
    layout.tsx                <html lang="pt-BR">, fontes Figtree/Gelasio, metadados
    globals.css               ~2.300 linhas: tokens, páginas públicas, área do criador, celular
    page.tsx + home.module.css   página inicial (hero com órbitas em CSS)
    error.tsx, not-found.tsx, acesso-negado/   páginas 500/404/403 (status-page.module.css)
    robots.ts, manifest.ts, icon.svg
    (auth)/                   login, cadastro, cadastro/confirmacao, recuperar-senha, redefinir-senha
    (legal)/                  termos, privacidade (rascunhos)
    auth/callback/route.ts    troca o código do e-mail por sessão e redireciona (só caminho local)
    actions/                  Server Actions: auth, creator, internal, privacy, site
    components/               componentes de cliente (formulários, quadro de evidências etc.)
    dashboard/                área do CRIADOR
    interno/                  área da EQUIPE
    preview/                  telas com dados fictícios, sem login (só em desenvolvimento)
  lib/
    auth.ts                   requireUserFast / requireUserWithRoles / requireSession / getSignedInUser
    auth-routing.ts           decide /interno ou /dashboard pelas funções
    labels.ts                 vocabulário único (situações, funções, plataformas, categorias)
    audit-labels.ts           textos legíveis do histórico de auditoria
    audit-groups.ts           agrupa alterações seguidas no histórico administrativo
    rate-limit.ts             limite de tentativas em memória
    site-media.ts             URL pública do vídeo de apresentação
    evidence/normalize.ts     sharp: valida e converte prints para WebP
    security/redirect.ts      só aceita redirecionamento para caminho local
    supabase/server.ts        cliente com cookies (servidor)
    supabase/browser.ts       cliente do navegador (só para upload do vídeo)
    supabase/admin.ts         cliente com chave de serviço ("server-only")
    validation/               schemas Zod e utilitários: auth, creator, privacy, cpf, phone
supabase/
  migrations/                 13 migrations (todas aplicadas no real e no de testes)
  tests/                      testes PGlite do banco
  templates/                  e-mails em português (aguardam SMTP próprio)
  config.toml                 config do Supabase CLI
tests/
  validation.test.mjs         testes unitários (Zod, CPF, telefone, redirect, imagem, auditoria)
  e2e/                        Playwright no banco real (só leitura)
  e2e-flows/                  Playwright no projeto de testes (altera dados)
scripts/                      dev-test.ps1, e2e.ps1, seed-*.mjs, set-test-credentials.ps1
public/vyrex-logo.svg         logo oficial
docs/                         documentação (ver seção 14)
.claude/skills/               skills do assistente (não fazem parte do site; ignoradas pelo ESLint)
```

Não há `layout.tsx` dentro de `dashboard/` nem de `interno/`: cada página monta a própria moldura com `CreatorShell` ou `InternalShell` (ver seções 7 e 8).

---

## 4. Variáveis de ambiente

`.env.example` (o único `.env*` no git):

| Variável | Onde é usada |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | todos os clientes, CSP em `next.config.ts`, upload do vídeo |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clientes com sessão do usuário |
| `NEXT_PUBLIC_SITE_URL` | links dos e-mails (`emailRedirectTo`, `redirectTo`), `metadataBase` |
| `SUPABASE_SERVICE_ROLE_KEY` | só `src/lib/supabase/admin.ts` (convites, lista de usuários do Auth, CPF→e-mail) |
| `NEXT_DIST_DIR` | opcional; `.next-test` no servidor de testes (porta 3001) |

Se a URL ou a chave pública faltarem, `isSupabaseConfigured()` devolve `false` e as telas mandam para `/login?configuracao=supabase` em vez de quebrar. Sem a chave de serviço, convites e e-mails dos colaboradores ficam indisponíveis e a tela avisa.

---

## 5. Sessão, login e proteção de rotas

### 5.1 `src/proxy.ts`

Roda em `/`, `/login`, `/cadastro`, `/dashboard/*`, `/interno/*`, `/redefinir-senha`, `/auth/*`.

1. Cria um cliente Supabase ligado aos cookies da requisição.
2. `getClaims()` confere o token **localmente** (assinatura ES256) e, se vencido, renova e grava o cookie novo na resposta. Isso precisa acontecer aqui porque Server Components não conseguem gravar cookies.
3. Logado em `/cadastro` → redireciona para `/login` (que leva ao painel certo).
4. Sem login em `/dashboard*` ou `/interno*` → redireciona para `/login`.

O proxy **não** confere função nem conta ativa; isso é feito nas páginas e no banco.

### 5.2 `src/lib/auth.ts` — as quatro portas de entrada

| Função | Usada em | O que faz |
| --- | --- | --- |
| `requireUserFast()` | quase todas as páginas com login | confere o token localmente e devolve na hora; devolve também `activeCheck` (consulta de `profiles.is_active`) para a página rodar **junto** com as suas próprias consultas no `Promise.all`, e `ensureActive(resultado)` que desloga e manda para `/login?conta-desativada=1` se a conta estiver desativada |
| `requireUserWithRoles()` | `/interno` (painel) | token + perfil ativo + funções ativas numa ida só |
| `requireSession()` | **todas as Server Actions** | só confere o token (o banco já barra contas inativas via `has_permission`/RLS) |
| `getSignedInUser()` | home, login | diz se há alguém logado, sem redirecionar |

`fetchActiveRoleKeys()` lê `user_roles` (sem `revoked_at`) com o join em `roles(key)`. `dashboardPathForRoles()` (`auth-routing.ts`) manda para `/interno` se houver qualquer função de equipe, senão `/dashboard`.

O nome exibido vem do próprio token (`user_metadata.full_name`), sem consulta extra.

### 5.3 Fluxos de autenticação (`src/app/actions/auth.ts`)

- **Login** (`loginAction`): Zod → limite (8 por e-mail e 30 por IP a cada 15 min) → `signInWithPassword` → lê funções → `redirect` para o painel certo.
- **Cadastro** (`signupAction`): Zod (senha forte: 11+ caracteres, maiúscula, minúscula, número e símbolo) → telefone opcional normalizado → limite (5/h por IP) → `signUp` com `full_name`, `phone`, `terms_version`, `privacy_version` no metadata. E-mail já cadastrado recebe **a mesma tela** de confirmação (não revela contas). Com confirmação de e-mail desligada (projeto de testes), já cai em `/dashboard`.
- **Gatilho no banco** `handle_new_auth_user`: ao criar o usuário no Auth, cria `profiles`, `creator_profiles` (status `incomplete`) e a função `influencer`. **Toda conta nova nasce como criador.**
- **Recuperação de senha** em dois passos, com respostas neutras:
  1. `recoveryOptionsAction`: só confere o formato (e-mail ou CPF válido); não consulta contas.
  2. `recoveryAction`: com CPF, o servidor resolve o e-mail por `recovery_email_for_cpf` (chave de serviço); chama `resetPasswordForEmail`; responde a mesma frase exista ou não a conta e espera no mínimo 1,2 s (o tempo também não denuncia). Limite: 3 envios/h por identificador.
- **Link do e-mail** → `/auth/callback?code=…&next=…` → `exchangeCodeForSession` → `safeLocalRedirectPath(next)` (só caminhos do próprio site).
- **Redefinir senha** (`passwordUpdateAction`): exige sessão vinda do link.
- **Trocar senha logado** (`changePasswordAction` em `privacy.ts`): exige a senha atual (refaz o login) e tem limite de 5/15 min por conta.
- **Sair**: `logoutAction` → `/`.

### 5.4 Limite de tentativas (`src/lib/rate-limit.ts`)

Mapa em memória por instância do servidor (janela deslizante). Com `extraKey` (e-mail/conta), o limite vale para a conta em qualquer IP. Usa `x-real-ip` e, como alternativa, `x-forwarded-for`. **Limitação conhecida:** com várias instâncias, cada uma tem seu contador (pendência antes de publicar).

---

## 6. Banco de dados (Supabase / Postgres)

Todas as migrations estão em `supabase/migrations/` e foram aplicadas no projeto real e no de testes (não existe a tabela `supabase_migrations.schema_migrations`; aplicação via SQL Editor ou Management API). **Novas migrations devem ser aditivas**, aplicadas primeiro no projeto de testes e cobertas pelos testes PGlite.

### 6.1 Migrations, em ordem

| Arquivo | O que faz |
| --- | --- |
| `202610140001_initial_platform.sql` | esquema base: tabelas, papéis/permissões, RLS, RPCs, bucket `story-evidence` |
| `202610150001_data_requests.sql` | pedidos de privacidade (`data_requests`) + permissão `privacy.requests.manage` |
| `202610150002_social_account_updates.sql` | editar a rede social zera a verificação (gatilho) e é auditado |
| `202610150003_submission_profile_name.sql` | gatilho: não envia sem nome público |
| `202610150004_creator_growth_criteria.sql` | critérios 3.000/2.000 → **0 seguidores / 1.000 visualizações** |
| `202610280001_presentation_video.sql` | `site_settings` + bucket público `site-media` (vídeo da tela de cadastro) |
| `202610280002_three_required_evidence.sql` | **3 evidências obrigatórias** (posições 1–3; 4 e 5 opcionais); nova versão de `submit_creator_application` e `update_eligibility_settings` |
| `202610280003_signup_phone_and_recovery_options.sql` | telefone do cadastro vai para `profiles`; cria `recovery_phone_hint` |
| `202610280004_security_hardening.sql` | só remove permissões (tabela de cota, funções de gatilho, `recovery_phone_hint` só para `service_role`) |
| `202610280005_creator_withdraw_and_draft_evidence.sql` | `withdraw_creator_application` e `delete_own_draft_evidence`; ação `withdrawn` no histórico |
| `202610280006_decision_notification_titles.sql` | título do aviso conforme a decisão (versão **atual** de `record_review_decision`) |
| `202610280007_user_cpf.sql` | `user_documents` (CPF), `is_valid_cpf`, `set_own_cpf`, `recovery_email_for_cpf` |
| `202610280008_user_id_for_email.sql` | `user_id_for_email` (só servidor), para dar função de equipe a conta existente |

Quando a mesma função aparece em mais de uma migration (`create or replace`), **vale a última**: `submit_creator_application` → 0002; `record_review_decision` → 0006; `update_eligibility_settings` → 0002; `handle_new_auth_user` → 0003.

### 6.2 Tabelas

**Identidade e acesso**
- `profiles` (1:1 com `auth.users`): `full_name`, `phone` (E.164), versões de termos/consentimento, `is_active` + dados de desativação.
- `roles`: `admin`, `recruiter`, `relationship_manager`, `validator`, `influencer`.
- `permissions` + `role_permissions` (RBAC). `user_roles`: várias funções por pessoa; revogar = preencher `revoked_at` (histórico preservado; índice único parcial impede duas ativas iguais).
- `user_documents`: CPF (só dígitos, único). Só o dono lê; a equipe não vê.

**Criador**
- `creator_profiles` (PK = `user_id`): nome público, cidade, UF, bio, categorias, **`status`**, datas e motivo da decisão.
- `social_accounts`: plataforma (`instagram|tiktok|youtube|other`), @, URL, seguidores declarados, `verification_status` (`unverified|verified|rejected`).
- `metric_evidence`: um print por posição (`unique(creator_id, position)`), caminho no Storage, data do Story, visualizações declaradas, observação, `review_status` (`pending|approved|rejected|changes_requested`). O banco aceita posição 1–20, mas o envio só aceita até 5.

**Operação**
- `recruiter_assignments` / `relationship_assignments`: um responsável atual por criador (`ended_at` nulo); trocas preservam histórico.
- `review_history`: linha do tempo do cadastro (enviado, encaminhado, evidência aprovada, decisão, desfeito…).
- `contact_history`: contatos registrados (canal, resumo, `visible_to_creator`).
- `team_messages`: mensagens da equipe ao criador.
- `notifications`: avisos ao usuário (`status|message|correction|system`), `read_at`.

**Administração**
- `eligibility_settings` (linha única): `minimum_followers` (0), `required_story_evidence` (3), `minimum_story_views` (1.000), `max_story_age_days` (7).
- `site_settings` (linha única): caminho do vídeo de apresentação.
- `audit_logs`: quem fez o quê, em qual entidade, com `details` em JSON.
- `evidence_upload_events`: cota interna de upload (sem acesso pela API).
- `data_requests`: pedidos de privacidade (no máximo um ativo por tipo e titular).

### 6.3 Funções de apoio (usadas pelas políticas)

- `account_is_active()` — a conta do `auth.uid()` está ativa.
- `has_permission(chave)` — a pessoa tem alguma função ativa com essa permissão **e** a conta está ativa.
- `can_access_creator(id)` — pode ver aquele criador: `view_all` (admin); ou `view_assigned` e é o recrutador/gestor atual; ou `view_validation_queue` (analista) e o cadastro está em `submitted|under_review|changes_requested`.
- `consume_evidence_upload_quota()` — máximo de 10 uploads de evidência a cada 10 min por pessoa (chamada pela política do Storage).
- `write_audit_log(...)` — grava em `audit_logs` (não executável pela API).

### 6.4 Permissões por função

| Função | Permissões |
| --- | --- |
| `admin` | todas (inclui `view_all`, `assign`, `manage_roles`, `configure_eligibility`, `audit.read`, `privacy.requests.manage` e as de recrutamento, relacionamento e validação) |
| `recruiter` | `view_assigned`, `recruitment.write`, `recruitment.forward` |
| `relationship_manager` | `view_assigned`, `relationship.write`, `relationship.corrections` |
| `validator` | `view_validation_queue`, `validation.review`, `validation.decide` |
| `influencer` | `profile.own`, `evidence.own` |

### 6.5 RLS e permissões de coluna

- Toda tabela tem RLS. O papel `authenticated` recebe `select` e **apenas** `update`/`insert` em colunas específicas: o criador edita `full_name/phone` do perfil, os campos públicos do `creator_profiles`, insere/edita as próprias redes e evidências e marca notificações como lidas. **Ninguém muda `status`, verificação, funções ou critérios por `update` direto**: isso só acontece pelas RPCs.
- O criador só edita perfil, redes e evidências com status `incomplete` ou `changes_requested`.
- Leitura: o dono (com conta ativa) ou a equipe com `can_access_creator`. Mensagens e contatos só aparecem ao criador se `visible_to_creator`. Auditoria só com `audit.read`.

### 6.6 RPCs (o "backend" de verdade)

Todas são `security definer` com `search_path` fixo, conferem permissão, travam a linha (`for update`) quando mudam estado e gravam histórico/auditoria/notificação **na mesma transação**.

| RPC | Quem | Efeito |
| --- | --- | --- |
| `submit_creator_application()` | criador | confere rede, 3 evidências obrigatórias válidas (visualizações mínimas, arquivo existe no Storage), no máximo 5, ordem da mais nova para a mais antiga, idade máxima; `incomplete|changes_requested` → `submitted` |
| `withdraw_creator_application()` | criador | `submitted` → `incomplete`, só se ninguém da equipe agiu desde o envio |
| `delete_own_draft_evidence(pos)` | criador | apaga evidência só em `incomplete`; devolve o caminho para o servidor remover o arquivo |
| `forward_creator_to_validation(id)` | recrutador | `submitted` → `under_review` |
| `record_contact_event(...)` | recrutador/gestor | registra contato (só o gestor pode torná-lo visível ao criador) |
| `write_staff_message(id, texto)` | gestor (ou admin) | mensagem + notificação |
| `request_creator_corrections(id, motivo)` | gestor ou analista | `submitted|under_review` → `changes_requested` + notificação |
| `review_story_evidence(id, decisão, motivo)` | analista | aprova/recusa/pede correção de um print (motivo obrigatório se não aprovar) |
| `review_social_account(id, decisão, motivo)` | analista | verifica ou recusa a rede |
| `record_review_decision(id, decisão, motivo)` | analista | decisão final; **aprovar exige** as evidências obrigatórias aprovadas, com visualizações mínimas e rede verificada |
| `assign_creator_responsibles(id, recrutador, gestor)` | admin | troca responsáveis (encerra os anteriores) |
| `set_user_role(usuario, função, ligado)` | admin | dá/tira função de equipe; impede tirar o próprio admin e remover o último admin ativo |
| `set_user_active(usuario, ligado, motivo)` | admin | desativa/reativa conta (motivo obrigatório; não desativa a si mesmo nem o último admin) |
| `update_eligibility_settings(...)` | admin | altera critérios (gatilho grava auditoria) |
| `create_data_request` / `resolve_data_request` | titular / admin | pedidos de privacidade |
| `set_own_cpf(cpf)` | qualquer usuário | grava, troca ou remove (vazio) o próprio CPF |
| `recovery_email_for_cpf`, `user_id_for_email`, `recovery_phone_hint` | **só `service_role`** | consultas do servidor (a última não é mais usada pelo site) |

Gatilhos: `set_updated_at` (várias tabelas); editar uma evidência volta `review_status` para `pending`; editar a rede volta para `unverified`; não deixa ir para `submitted` sem nome público; `handle_new_auth_user` no `auth.users`.

### 6.7 Situações do cadastro (máquina de estados)

```
incomplete ──enviar──► submitted ──encaminhar (recrutador)──► under_review
    ▲                      │  │                                   │
    └──desfazer envio──────┘  └──────────┬────────────────────────┘
       (criador, antes da equipe agir)   │ pedir correção (gestor/analista)
                                         ▼
                              changes_requested ──reenviar──► submitted
                                         │
                 decisão final (analista) a partir de submitted/under_review/changes_requested
                                         ▼
                               approved | rejected
```

`suspended` existe no esquema e nos rótulos, mas **não há RPC que coloque um cadastro nesse estado** hoje. Os textos de cada situação ficam em `src/lib/labels.ts` (`creatorStatusLabels`, `creatorStatusTones` e `creatorStatusDescriptions`, esta última ainda sem uso).

### 6.8 Storage

- **`story-evidence`** (privado, 8 MB, JPEG/PNG/WebP). Caminho `<user_id>/<uuid>.webp`. O criador só grava na própria pasta, com cota e status editável. Leitura pelo dono ou por quem tem `can_access_creator`. As telas usam **URLs assinadas de 600 s** (`createSignedUrls`).
- **`site-media`** (público, 50 MB, MP4/WebM). Só quem tem `configure_eligibility` envia ou remove. Caminho `presentation/<uuid>.mp4|webm`.

---

## 7. Área do criador (`/dashboard`)

Moldura: `dashboard/creator-shell.tsx` (logo, `CreatorNav` e botão Sair). Cada página a inclui por conta própria. `CreatorNav` (cliente) usa `usePathname` para marcar a página atual (`aria-current`); no celular vira barra fixa embaixo, com ícones.

| Rota | Arquivo | Conteúdo |
| --- | --- | --- |
| `/dashboard` | `dashboard/page.tsx` + `creator-overview.tsx` | visão geral: próximo passo (`nextStepFor`), jornada em etapas, pendências das evidências, últimas mensagens, avisos e histórico. 9 consultas em paralelo + `ensureActive`. |
| `/dashboard/perfil` | `dashboard/perfil/page.tsx` | "Meu cadastro": assistente de 4 etapas (perfil, redes, evidências, revisão e envio). Calcula no servidor a lista de pendências antes do envio e gera URLs assinadas dos prints. |
| `/dashboard/mensagens` | `mensagens/page.tsx` | mensagens da equipe e avisos (`#avisos`), com "marcar como lida" |
| `/dashboard/configuracoes` | `configuracoes/page.tsx` | dados da conta (nome, telefone, CPF opcional), troca de senha e privacidade (`#privacidade`, recolhida) |
| `/dashboard/notificacoes`, `/dashboard/privacidade` | — | apenas redirecionam para as telas acima (rotas antigas mantidas) |

Peças de cliente usadas aqui (`src/app/components/`):

- **`creator-forms.tsx`**
  - `CreatorWizard`: guarda a etapa ativa em estado e escreve `data-active-step`; o CSS (`globals.css`, seletores `[data-wizard-step]`) esconde as outras seções. Abre na primeira etapa incompleta.
  - `CreatorProfileForm`: **salvamento automático** 700 ms depois da última mudança (`setTimeout` + `requestSubmit`), status "salvando/salvo/erro".
  - `SocialAccountForm`, `SubmitApplicationButton`, `WithdrawApplicationButton`.
- **`evidence-board.tsx`** (`EvidenceBoard`): escolhe vários prints de uma vez (preenche os quadros vazios em ordem), mostra prévias locais (`URL.createObjectURL`, liberadas ao sair), pede data e visualizações por Story e envia **um por vez** para `uploadStoryEvidenceAction`. Os que falham ficam marcados e o botão vira "Tentar enviar de novo". Apagar evidência salva só no rascunho.

Server Actions do criador (`actions/creator.ts`): `saveCreatorProfileAction`, `saveSocialAccountAction`, `uploadStoryEvidenceAction`, `deleteDraftEvidenceAction`, `withdrawCreatorApplicationAction`, `submitCreatorApplicationAction`, `markNotificationReadAction`.

**Caminho de um print até o banco** (`uploadStoryEvidenceAction`):
1. confere tamanho (até 8 MB) e os dados do Story com Zod (mensagem específica por campo);
2. `normalizeEvidenceImage` (`sharp`): aceita só JPEG/PNG/WebP reais, até 8000 px e 25 MP, uma página; gira pela orientação e reencoda em **WebP qualidade 82** (some metadado e conteúdo estranho);
3. sobe para `story-evidence/<user>/<uuid>.webp` com a sessão do usuário (a política do Storage aplica a cota);
4. insere ou atualiza `metric_evidence` (posição única); se falhar, remove o arquivo novo; se deu certo e havia arquivo antigo, remove o antigo;
5. `revalidatePath` em `/dashboard` e `/dashboard/perfil`.

O limite de corpo das Server Actions é 10 MB (`next.config.ts`).

---

## 8. Área da equipe (`/interno`)

Moldura: `interno/internal-shell.tsx` (Server Component): menu lateral com "Operação" (Visão geral) e, só para admin, "Administração" (Colaboradores, Configurações, Pedidos de privacidade); nome e funções de quem está logado; alternância de tema claro/escuro (`theme-toggle.tsx`, cookie `vyrex-internal-theme`, aplicado via `data-theme` no `<main>`). Componentes visuais comuns ficam em `interno/ui.tsx` (`PageHeader`, `Panel`, `Stats`, `Badge`, `Avatar`, `Notice`, `EmptyState`) com `ui.module.css`.

| Rota | Arquivo | Conteúdo |
| --- | --- | --- |
| `/interno` | `interno/page.tsx` + `creator-queue.tsx` | **painel único que se adapta à função principal** (admin > analista > gestor > recrutador): título e descrição próprios, indicadores (só admin), busca por nome público ou do cadastro, filtros por situação, responsável (admin) e período, paginação de 25. O analista só vê `submitted/under_review/changes_requested`, do mais antigo para o mais novo. A lista visível é o que a RLS deixa cada um ver. Mostra aviso após decisão (`?decisao=`). |
| `/interno/[creatorId]` | `interno/[creatorId]/page.tsx` | ficha do criador: dados, redes, evidências com imagem, histórico (30), mensagens e contatos (20), responsáveis. Mostra os controles conforme a função: `RecruiterControls`, `RelationshipControls`, `EvidenceReviewForm`, `SocialAccountReviewForm`, `FinalDecisionForm`, `AssignmentForm` (admin). Sem permissão ou inexistente → `notFound()`. |
| `/interno/equipe` | `interno/equipe/page.tsx` | colaboradores: diretório (`team-directory.tsx`) com e-mail e último acesso (via chave de serviço, `listUsers`), convite (`InviteInternalUserForm`), funções (`MemberRolesForm`), ativar/desativar com confirmação e motivo (`MemberStatusForm`), legenda de funções e **histórico administrativo agrupado** (`team-sections.tsx` + `lib/audit-groups.ts`: alterações no mesmo alvo com até 10 min entre si viram subitens; começa recolhido). Exige `manage_roles`, senão `/acesso-negado`. |
| `/interno/configuracoes` | `interno/configuracoes/page.tsx` | critérios de elegibilidade (`EligibilitySettingsForm`) com histórico, e vídeo de apresentação (`PresentationVideoForm`). Exige `configure_eligibility`. |
| `/interno/privacidade` | `interno/privacidade/page.tsx` | pedidos de privacidade e `ResolveDataRequestForm` |

Server Actions da equipe (`actions/internal.ts`): todas seguem **Zod → `requireSession` → RPC**; qualquer erro do banco vira a mesma mensagem neutra (`denied`), exceto as regras de equipe traduzidas em `teamRuleError` (último admin, próprio admin, própria conta, motivo obrigatório). `recordFinalDecisionAction` redireciona para `/interno?decisao=…`, porque depois da decisão o cadastro pode sair da fila de quem decidiu.

**Convite de colaborador** (`inviteInternalUserAction`): confere `manage_roles` → com a chave de serviço, procura o e-mail (`user_id_for_email`). Se já existe conta (ex.: alguém que se cadastrou como criador), só adiciona a função; se não, `inviteUserByEmail` e então `set_user_role`.

**Vídeo de apresentação** (`presentation-video-form.tsx` + `actions/site.ts`): é o **único upload feito direto do navegador** ao Storage (XHR com barra de porcentagem e aviso ao sair da página no meio do envio), usando o token da sessão do admin; depois `savePresentationVideoAction(path)` valida o caminho, grava em `site_settings`, apaga o vídeo anterior e revalida `/cadastro`. A página `/cadastro` é estática com `revalidate = 300` e lê o vídeo por `getPresentationVideoUrl()` (cliente sem sessão, dado público).

---

## 9. Páginas públicas

- `/` (`page.tsx`): hero com logo e três órbitas animadas **só com CSS** (`home.module.css`, `@keyframes`, respeita `prefers-reduced-motion`), fatos, "Como funciona" em 4 etapas, dúvidas frequentes e contato (`BrandContact`). Quem já está logado vê "Ir para o meu painel".
- `/login`, `/cadastro` (com `SignupExperience` e o vídeo), `/cadastro/confirmacao`, `/recuperar-senha` (`RecoveryForm`), `/redefinir-senha`. O formulário de login/cadastro é um só: `components/auth-form.tsx` (`AuthForm mode="login|signup"`, `PasswordField` com mostrar/ocultar).
- `/termos`, `/privacidade`: rascunhos jurídicos.
- `error.tsx` (500, sem detalhes técnicos), `not-found.tsx` (404), `/acesso-negado` (403).
- `robots.ts` bloqueia áreas com login, prévias e retornos; `manifest.ts` permite instalar na tela inicial (abre em `/login`).

### Prévias (`/preview/...`)

`/preview/criador`, `/preview/criador/cadastro`, `/preview/criador/evidencias`, `/preview/equipe`, `/preview/equipe/colaboradores`. Usam **os mesmos componentes das telas reais** com dados fictícios e dão `notFound()` fora de desenvolvimento. Ao criar uma tela nova, mantenha esse padrão.

---

## 10. Padrões do código (siga estes ao escrever algo novo)

1. **Página com login:** `const { supabase, user, activeCheck, ensureActive } = await requireUserFast();` → todas as consultas num único `Promise.all` incluindo `activeCheck` → `await ensureActive(...)`. Selecione colunas explicitamente; use `.limit()` em listas.
2. **Server Action:** `"use server"` → assinatura `(_state: FormState, formData: FormData): Promise<FormState>` → Zod `safeParse` → `requireSession()` → RPC ou `update` com `.eq("user_id", user.id)` e `.select().maybeSingle()` (para detectar quando a RLS bloqueou e nada foi gravado) → `revalidatePath` → `{ message, success }`. Mensagens ao usuário em português simples; nunca repasse o erro do banco.
3. **Formulário de cliente:** `useActionState(action, { message: "", success: false })`, botão desabilitado com `pending`, mensagem com `role="status"`/`role="alert"`.
4. **Mudança de estado do cadastro, funções ou critérios:** sempre por RPC no banco, nunca por `update` direto. Nova regra de negócio → nova migration aditiva + teste PGlite.
5. **Textos de situação, função, plataforma e categoria:** só de `src/lib/labels.ts`. Ação nova de auditoria → adicionar em `src/lib/audit-labels.ts`.
6. **Chave de serviço:** só via `createSupabaseAdminClient()` (arquivo marcado `server-only`), e sempre conferindo antes a permissão de quem pediu com `has_permission`.
7. **Joins do PostgREST** podem vir como objeto ou array; o código usa helpers do tipo `Array.isArray(x) ? x[0] : x` (ver `accountName`, `actorName`).
8. **Estilo:** CSS próprio, preto e branco e minimalista. Páginas públicas e área do criador em `globals.css` (classes globais como `dashboard-page`, `profile-section`, `form-message`); área da equipe em CSS Modules (`interno/*.module.css`, variáveis `--bg`, `--surface`, `--text`, `--tone-*`). Celular em `@media (max-width: 760px)` sem alterar o computador: campos com 16px, alvos de toque de 44px ou mais, texto de 12px no mínimo.
9. **Comentários** em português, curtos, explicando o porquê (é o estilo do repositório).

---

## 11. Segurança (como está implementada)

- **Autorização no banco** (RLS + RPCs). Esconder botão é só conforto; o banco recusa de qualquer jeito.
- **Cabeçalhos** em `next.config.ts`: CSP (scripts, imagens, vídeos e conexões só do site e do Supabase; `frame-ancestors 'none'`), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS, COOP. `X-Robots-Tag: noindex` em `/dashboard`, `/interno`, `/preview`, `/auth`, `/redefinir-senha`. A CSP ainda usa `'unsafe-inline'` (pendência: nonce).
- **Respostas neutras** no cadastro e na recuperação (não revelam se um e-mail ou CPF existe).
- **Imagens reencodadas** no servidor; Storage privado com URLs assinadas.
- **Redirecionamentos** só para caminhos locais (`safeLocalRedirectPath`).
- **Limite de tentativas** em memória (login, cadastro, recuperação, troca de senha).
- **Segredos** fora do git (`.gitignore` cobre `.env*`, exceto `.env.example`).

---

## 12. Testes

| Camada | Onde | Como roda | O que cobre |
| --- | --- | --- | --- |
| Banco | `supabase/tests/initial-platform.test.mjs` (29), `data-requests.test.mjs` (4) | `npm test` | aplica **todas** as migrations num Postgres em memória (PGlite) com imitações de `auth.users`, `auth.uid()` e `storage.*`; testa RLS, RPCs, transições, cota, desativação, CPF, desfazer envio etc. Usa `asUser(id, fn)` para agir como cada papel. |
| Unitário | `tests/validation.test.mjs` (14) | `npm test` | Zod (cadastro, senha, redes, categorias, evidências), destino do login por função, CPF, redirect, normalização de imagem, agrupamento da auditoria (telefone não tem teste) |
| Navegador (real, só leitura) | `tests/e2e/*.spec.ts` | `npm run test:e2e` | páginas públicas, 404, proteção de rotas, recuperação neutra, navegação do criador e da equipe; projetos "computador" e "celular" (Pixel 7). `auth.setup.ts` entra nas contas `+adm`/`+user` (senhas lidas das variáveis do Windows) e guarda a sessão em `playwright/.auth/`. |
| Fluxos (projeto de testes) | `tests/e2e-flows/*.spec.ts` | `npm run test:flows` (sobe `localhost:3001`) | cadastro pela tela e ciclo completo: criador envia → admin atribui → outro criador é barrado → recrutador encaminha → gestora manda mensagem → analista aprova → criador vê. Recusa rodar se o site não estiver ligado ao projeto de testes. |

Ao mudar o banco: escreva a migration, acrescente um `readFile` dela no `before()` de `supabase/tests/initial-platform.test.mjs` (cada migration é carregada ali, em ordem), rode `npm test`, aplique no projeto de testes, rode `npm run test:flows` e só então aplique no real.

---

## 13. Ambientes

| | Real | Testes |
| --- | --- | --- |
| Projeto Supabase | `zofxrohoilwjtzbcruse` | `ukwnnrrqmrvfwtbjjrbi` ("Vyrex Testes") |
| Servidor | `localhost:3000` (`npm run dev`, tarefa do VS Code ao abrir a pasta) | `localhost:3001` (`scripts/dev-test.ps1`, pasta `.next-test`) |
| Variáveis | `.env.local` | `.env.test.local` |
| Pode alterar dados? | **Não** (só leitura; nunca apagar) | Sim, à vontade |

O servidor de testes regrava `next-env.d.ts` e `tsconfig.json` apontando para `.next-test`: **não commite essas mudanças** (`git checkout -- next-env.d.ts tsconfig.json`).

---

## 14. Pontos de atenção encontrados nesta leitura

Nada aqui foi alterado; são observações para quem for mexer.

**Documentação desatualizada em relação ao código**
- `docs/SECURITY.md`, primeira parte: diz que `requireUser()` usa `auth.getUser()` (hoje é `getClaims()`), que não há limite de tentativas e que os cabeçalhos de segurança não estão configurados. Os três já existem; a seção "Revisão de segurança de 2026-10-28", mais abaixo no mesmo arquivo, está correta. Também cita URLs assinadas de 60 s, mas o código usa 600 s.
- `docs/ARCHITECTURE.md`: lista as migrations só até `202610150003` e não cita `site_settings`, `user_documents`, o bucket `site-media` nem `proxy.ts`.
- `docs/DECISIONS.md` nº 3: cita os valores antigos (3.000 / 5 / 2.000).
- `docs/TESTING.md`: diz que não há Playwright e que vários testes "não foram executados"; hoje há 47 testes de unidade e banco, além das suítes `e2e` e `e2e-flows`.
- `docs/DIRETRIZES.md`: os critérios (3.000/2.000, 5 evidências) estão desatualizados, como o próprio `CLAUDE.md` avisa.

**Código sem uso ou incompleto**
- `recovery_phone_hint` (banco) e `maskPhone` (`lib/validation/phone.ts`): sobras da recuperação por celular; nada no site chama.
- `components/info-help.tsx` (`InfoHelp`): não é importado em lugar nenhum.
- `creatorStatusDescriptions` (`lib/labels.ts`): pronto e sem uso (já listado em `TASKS.md`).
- `lib/audit-labels.ts` não tem texto para `creator.application.withdrawn`, `creator.evidence.removed`, `user.cpf.changed` e `creator.social_account.verification_reset`; essas ações aparecem como "Ação administrativa" genérica onde forem listadas.
- O estado `suspended` não tem RPC que o aplique.

**Limitações já conhecidas** (detalhes em `docs/PASSAGEM.md` e `docs/TASKS.md`): limite de tentativas em memória; CSP com `'unsafe-inline'`; sem progresso por arquivo no envio de evidências; busca não ignora acentos; exportação e exclusão de dados por pedido de privacidade são manuais; e-mails do Supabase em inglês até haver SMTP próprio; ficha sem permissão responde HTTP 200 com conteúdo de "não encontrado".
