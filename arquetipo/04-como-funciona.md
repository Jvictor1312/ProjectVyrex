# 4. Como funciona

Para o detalhe arquivo por arquivo, veja `docs/MAPA_DO_CODIGO.md`. Este capítulo explica o desenho e registra o que mudou depois dele.

## 4.1 As camadas

```
Navegador (telas em HTML montadas no servidor + poucas peças interativas)
   │  links, formulários (Server Actions) e upload do vídeo
   ▼
src/proxy.ts  ── em TODA página: sorteia o nonce e envia a política de conteúdo;
   │             nas telas com login: renova a sessão e manda quem não entrou para /login
   ▼
Next.js no servidor
   ├─ Páginas (Server Components): leem o banco COM A SESSÃO DE QUEM ESTÁ LOGADO
   ├─ Server Actions (src/app/actions/*.ts): Zod → confere a sessão → chama o banco
   ├─ src/lib/: regras compartilhadas (rótulos, histórico, busca, validação, segurança)
   ├─ src/lib/log.ts: registra toda recusa/falha do banco e todo erro não tratado
   └─ src/lib/supabase/admin.ts: chave de serviço, só no servidor, em 4 usos pontuais
   ▼
Supabase
   ├─ Auth: e-mail + senha (token ES256 conferido no servidor com getClaims)
   ├─ Postgres: 21 tabelas, todas com RLS + funções RPC que fazem as mudanças de estado
   └─ Storage: story-evidence (privado, prints) e site-media (público, vídeo)
```

**A ideia central:** o banco é quem manda. O site valida, organiza e mostra, mas quem decide se alguém pode ver ou mudar algo são as políticas (RLS) e as funções do Postgres. Se alguém montar uma chamada "na mão", com o próprio login, o banco recusa do mesmo jeito.

## 4.2 Uma visita, passo a passo

1. O navegador pede `/dashboard`.
2. `src/proxy.ts` sorteia um código (nonce) e monta a política de conteúdo (`src/lib/security/csp.ts`). Como a rota exige login, renova o token se ele estiver vencido e grava o cookie novo.
3. O layout raiz chama `connection()`, para a página ser montada na hora e cada script levar o nonce daquela visita.
4. A página chama `requireUserFast()` (`src/lib/auth.ts`): confere o token sem ir ao Supabase e dispara, **junto** com as outras consultas da página, a conferência de "conta ativa".
5. Todas as consultas da tela vão num único `Promise.all`, ou seja, numa rodada só até o banco. A conexão fica aberta por até 60 s (`src/instrumentation.ts`), então a próxima tela não paga a abertura de novo.
6. O banco devolve só o que a RLS deixa aquela pessoa ver.
7. O HTML chega ao navegador, e só as peças interativas viram JavaScript (16 componentes `"use client"`).

## 4.3 Um formulário, passo a passo (Server Action)

`formulário → Zod (formato) → requireSession() → RPC ou update com o próprio id → revalidatePath → mensagem em português`

- Erros do banco nunca chegam crus ao usuário: viram uma mensagem neutra. **O detalhe fica no log do servidor** (`src/lib/log.ts`): o `fetch` dos clientes Supabase registra toda resposta de erro (aviso para recusa prevista, erro para falha), e `onRequestError` (`src/instrumentation.ts`) registra exceções não tratadas. Sem dados pessoais.
- Em erro de validação, o servidor devolve também **o campo** (`validationFailure`); na tela, `FormFeedback` marca o campo como inválido, liga-o à mensagem e leva o foco até ele.
- Login, cadastro e senha enviam pelo `onSubmit`, para o React não apagar o que foi digitado quando o servidor recusa.
- Mudanças de **situação do cadastro, funções, responsáveis e critérios** só acontecem por **RPC** (função no banco), que confere a permissão, trava a linha e grava histórico, auditoria e aviso **na mesma transação**.

## 4.4 Login e conta

| Fluxo | Como é |
| --- | --- |
| Cadastro | Zod (senha com 11+ caracteres, maiúscula, minúscula, número e símbolo) → limite de 5 por hora por endereço → `signUp`. Um gatilho no banco cria o perfil, o cadastro de criador (`incomplete`) e a função `influencer`. E-mail já existente recebe a mesma tela (não revela contas). |
| Login | Limite de 8 tentativas por e-mail e 30 por endereço a cada 15 min → `signInWithPassword` → painel conforme a função. |
| Recuperação | E-mail ou CPF. Com CPF, o servidor descobre o e-mail (chave de serviço) e envia o link. Resposta sempre igual, com tempo mínimo de 1,2 s, para nem a demora denunciar se a conta existe. |
| Conta desativada | O banco barra em todas as políticas (`account_is_active()`). As páginas deslogam e mostram o aviso. |
| Limite de tentativas | Contador no banco (`consume_rate_limit`), compartilhado por todos os servidores. A chave é gravada resumida (SHA-256), sem e-mail nem IP legível. Se o banco falhar, um contador em memória assume. |

## 4.5 O banco

**Tabelas (21):**
- *Identidade:* `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles` (várias funções por pessoa; revogar preserva o histórico), `user_documents` (CPF; só o dono lê).
- *Criador:* `creator_profiles` (situação), `social_accounts`, `metric_evidence` (um print por posição).
- *Operação:* `recruiter_assignments`, `relationship_assignments`, `review_history`, `contact_history`, `team_messages`, `notifications`.
- *Administração:* `eligibility_settings`, `site_settings`, `audit_logs`, `evidence_upload_events` (cota de upload), `data_requests` (privacidade), `rate_limit_counters`.

**Permissões por função:**

| Função | Pode |
| --- | --- |
| admin | tudo, incluindo ver todos, atribuir, gerenciar funções, critérios, auditoria e privacidade |
| recruiter | ver os seus, anotar a triagem, encaminhar |
| relationship_manager | ver os seus, registrar contato, mandar mensagem, pedir correção |
| validator | ver a fila de análise, conferir prints e redes, decidir |
| influencer | o próprio perfil e as próprias evidências |

**Situações do cadastro:**

```
incomplete ──enviar──► submitted ──encaminhar (recrutador)──► under_review
    ▲                     │  │                                    │
    └──desfazer envio─────┘  └───────────┬────────────────────────┘
       (antes da equipe agir)            │ pedir correção (gestor/analista)
                                         ▼
                              changes_requested ──reenviar──► submitted
                                         │
          decisão final (analista) a partir de submitted, under_review ou changes_requested
                                         ▼
                               approved | rejected
```

`suspended` existe nos rótulos e no esquema, mas nenhuma função coloca um cadastro nessa situação ainda.

**Para aprovar**, o banco exige: as 3 evidências obrigatórias aprovadas, cada uma com as visualizações mínimas, e a rede verificada.

**Migrations (16):** de `202610140001_initial_platform.sql` até `202610290003_creator_queue_filter.sql`. Todas são aditivas, estão aplicadas no projeto real e no de testes e ficam **registradas** em `supabase_migrations.schema_migrations`. `scripts\migrations.ps1 -Banco testes|real [-Aplicar]` mostra o que falta e aplica (a migration e o registro na mesma transação). Depois, `scripts\gen-db-types.ps1` regera os tipos (`src/lib/supabase/database.types.ts`), que o TypeScript usa para conferir cada consulta. Quando uma função aparece em mais de uma migration, vale a última.

**Lista do painel da equipe:** sai da RPC `creator_queue(responsible, unassigned)` (security invoker, a RLS vale). O filtro "Responsável" é aplicado dentro do banco; situação, busca, período, ordem e paginação vêm por cima.

**Cópia de segurança:** `scripts\backup-db.ps1` exporta os dados de todas as tabelas (só leitura) para `backups\` (fora do git).

## 4.6 O caminho de um print até o banco

1. O criador escolhe vários prints; a tela mostra prévias locais.
2. Cada print vai **um por vez** para `uploadStoryEvidenceAction`: tamanho até 8 MB e dados do Story conferidos pelo Zod.
3. `sharp` confere se é mesmo uma imagem (JPEG, PNG ou WebP; até 8.000 px e 25 MP), gira conforme a orientação e **refaz em WebP**. Metadados e qualquer conteúdo estranho somem.
4. O arquivo sobe para `story-evidence/<id do usuário>/<id aleatório>.webp` com a sessão do criador. A política do Storage aplica a cota: 10 envios a cada 10 min.
5. Grava a linha em `metric_evidence`. Se falhar, apaga o arquivo novo; se der certo e havia um arquivo antigo, apaga o antigo.
6. A equipe vê os prints por **links assinados de 10 minutos**.

## 4.7 Onde mora cada coisa

| Pasta | Conteúdo |
| --- | --- |
| `src/app/(auth)`, `(legal)` | login, cadastro, recuperação; termos e privacidade |
| `src/app/dashboard` | área do criador (`layout.tsx` monta `CreatorShell` uma vez; o menu fica na tela entre as páginas) |
| `src/app/interno` | área da equipe (cada página usa `InternalShell`; peças visuais em `ui.tsx`) |
| `src/app/actions` | Server Actions: `auth`, `creator`, `internal`, `privacy`, `site` |
| `src/app/components` | formulários e peças interativas |
| `src/app/preview` | prévias sem login (desenvolvimento) |
| `src/lib` | `auth`, `labels` (vocabulário único), `history`, `audit-*`, `search`, `rate-limit`, `security/` (CSP, redirecionamento), `validation/` (Zod, CPF, telefone), `evidence/` (imagem), `supabase/` (clientes) |
| `supabase/` | migrations, testes PGlite, modelos de e-mail |
| `tests/` | unitários, `e2e/` (banco real, só leitura), `e2e-flows/` (banco de testes) |
| `scripts/` | servidor de testes, e2e, seed das contas de teste, gravar credenciais, migrations, tipos do banco, cópia de segurança |
| `.github/workflows/` | CI: verificações a cada envio |
