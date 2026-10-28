# Vyrex: relatório de testes (rodada 1)

**Data:** 28/10/2026.
**Ambiente:** `localhost:3000` (Next.js 16 em desenvolvimento), ligado ao Supabase real.
**Plano seguido:** "Plano mestre de testes" (80 testes, de PREP a ROB).

**O que foi usado para testar:**
- **Banco simulado** (PGlite): banco local criado só para os testes, com todas as migrations.
- **Chamadas HTTP sem login**: feitas contra o site local e contra a API do Supabase real.
- **Leitura da estrutura do banco real**: consultas só ao catálogo (tabelas, regras e permissões), sem ler nem gravar dados de usuários.
- **Navegador automatizado** (agent-browser): em 360, 390, 1366 e 1920 px.

**Nada foi apagado ou alterado no banco real.** As duas chamadas de escrita sem login feitas no teste foram recusadas.

## Resumo executivo

| Item | Quantidade |
|---|---|
| Testes planejados | 80 |
| Executados, total ou parcialmente | 54 |
| Aprovados | 45. Muitos só **em parte** (no banco simulado, sem login ou por revisão de código), como indicado em cada linha. Inclui o SEC-02, que falhou e foi aprovado depois da correção. |
| Reprovados | 3: SEC-13 (aberto), SEC-14 (lógica corrigida, execução pendente) e BUS-01 (limitação conhecida) |
| Inconclusivos | 6 |
| Bloqueados | 26 |
| Não executados | 0 |
| Problemas de segurança encontrados | 3: dois de gravidade média (SEC-13 e SEC-14) e um baixo (SEC-02); nenhum crítico |
| Correções feitas nesta rodada | 2 (commit `42f3751`) |
| Testes automáticos | 47 de 47 passando; verificação de código, padrão de escrita e versão de produção sem erro |

**Principais causas de bloqueio:**
1. **Faltam contas de teste** de cada função: dois criadores, um recrutador, um gestor de relacionamento e um analista. O Claude não cria contas nem digita senhas no Supabase real.
2. **Não há banco separado para testes destrutivos.** O banco simulado cobre as regras SQL, mas não o login nem os arquivos.
3. **Não há SMTP próprio**, então os e-mails reais não são testados.
4. **Não há celular físico** disponível.
5. **Não existem testes automáticos de navegador** (Playwright). O usuário os deixou fora do escopo em 28/10; o novo plano sugere avaliá-los e a decisão está pendente.

## Falhas encontradas

| Gravidade | Teste | Problema | Situação |
|---|---|---|---|
| Média | SEC-14 | O limite "8 tentativas por e-mail" também usava o endereço de rede lido do cabeçalho `x-forwarded-for`, que o visitante consegue forjar. Trocando o cabeçalho a cada tentativa, o contador zerava, tanto o limite por e-mail quanto o limite por rede. | **Corrigido.** O limite por e-mail ou conta agora vale em qualquer endereço de rede, e o endereço vem primeiro do `x-real-ip`, preenchido pela hospedagem (`src/lib/rate-limit.ts`). |
| Média | SEC-13 | O cadastro responde "Este e-mail já está cadastrado", e a recuperação por CPF responde "Não encontramos uma conta ativa com esse CPF". As duas respostas permitem descobrir se um e-mail ou CPF tem conta. | **Corrigido** (commit `6ccf6f1`, decisão do usuário: mensagens neutras). O cadastro com e-mail existente vai para a mesma tela de confirmação. A recuperação responde igual exista ou não a conta, leva pelo menos 1,2 s e não mostra mais o e-mail mascarado nem a dica do celular. Teste automático em `tests/e2e/public.spec.ts`. |
| Baixa | SEC-02 | Sem login, `/dashboard` e `/interno` respondiam 200 com a tela de carregamento e só depois redirecionavam. Não havia vazamento: só o título da página aparecia. | **Corrigido.** O filtro de entrada (`proxy`) redireciona direto para `/login` (307). |

### Propostas para o SEC-13 (enumeração de contas)

1. **Cadastro.** Responder sempre "Enviamos um e-mail para confirmar o cadastro" e, se a conta já existir, mandar para esse e-mail um aviso com o link de login e recuperação. Hoje isso não é possível, porque falta o SMTP próprio. Até lá, a alternativa é uma mensagem neutra: "Se este e-mail puder ser usado, você receberá as instruções."
2. **Recuperação por CPF.** Mostrar sempre a mesma resposta, por exemplo "Se houver uma conta com esse CPF, enviamos as instruções para o e-mail cadastrado". Nunca mostrar o e-mail mascarado quando a conta não existir. A perda: o usuário deixa de ver para qual e-mail foi enviado. Uma alternativa é mostrar o e-mail mascarado só depois de alguma confirmação extra.
3. **Limite.** Manter o limite de 10 consultas por CPF a cada 15 minutos, contado por endereço de rede, e somar um limite global de consultas por CPF.

## Resultado por teste

Legendas: **APROVADO**, **REPROVADO**, **BLOQUEADO**, **INCONCLUSIVO**.

### Preparação
| ID | Resultado | Observações e evidências |
|---|---|---|
| PREP-01 | APROVADO | Node 24.22, npm 11.19. Antes de qualquer mudança: verificação de código, padrão de escrita, 47 testes e build passando. |
| PREP-02 | APROVADO | As 4 variáveis de ambiente estão presentes (só os nomes foram conferidos). `.env*` está no `.gitignore`, e só o `.env.example` está no git. Nenhuma escrita feita para testar a conexão. |
| PREP-03 | BLOQUEADO | Não há banco Supabase separado nem contas sintéticas de todas as funções. |

### Segurança (P0)
| ID | Resultado | Observações e evidências |
|---|---|---|
| SEC-01 | APROVADO (banco simulado) / BLOQUEADO (login real) | Teste "authenticated creators cannot read another creator's profile or private evidence". Sem login, a API real recusa (401) a leitura de `metric_evidence`, `profiles`, `user_documents` e `audit_logs`. O teste com duas contas reais precisa de contas. |
| SEC-02 | REPROVADO → corrigido e APROVADO | Sem login, 10 rotas privadas testadas por endereço direto: agora respondem 307 para `/login`. Rotas inexistentes respondem 404. |
| SEC-03 | APROVADO (banco) / BLOQUEADO (tela) | As 21 funções que um usuário logado pode chamar conferem `auth.uid()` e a permissão (inspeção do banco real). Testes: "only administrators can grant internal roles", "eligibility changes require admin", "influencer cannot make a validation decision through the RPC". Sem login, `set_user_role` na API real é recusada (401). |
| SEC-04 | BLOQUEADO | Precisa de contas com funções combinadas. O banco simulado cobre funções isoladas ("staff only see creators allowed by their role and assignments"). |
| SEC-05 | APROVADO | Banco real: nenhuma tabela `public` sem RLS. As regras `true` existem só em tabelas de referência (`roles`, `permissions`, `role_permissions`, `eligibility_settings`, `site_settings`). Visitante sem login só lê `site_settings`. |
| SEC-06 | APROVADO | Todas as funções `security definer` fixam o `search_path`. As funções internas, como `write_audit_log`, não podem ser executadas pelo navegador. Visitante sem login só executa `is_valid_cpf`. |
| SEC-07 | APROVADO | A chave secreta não aparece em nenhum arquivo enviado ao navegador (comparação exata, sem imprimir o valor). O único resultado da busca foi o texto `sb_secret_` dentro da biblioteca do Supabase. Nenhum segredo no git. |
| SEC-08 | APROVADO (sem login) / BLOQUEADO (com login) | Um print real de `story-evidence`: endereço público → 400, endereço autenticado só com a chave pública → 400, listar a pasta → 400. Os links temporários duram 10 min (código); o teste de expiração e o acesso autorizado precisam de login. |
| SEC-09 | APROVADO (banco simulado) / BLOQUEADO (sessão real) | Teste "deactivated accounts lose RLS access until an active admin reactivates them". As páginas chamam `ensureActive`. |
| SEC-10 | APROVADO | `/auth/callback` com `//evil`, `https://evil`, `/%2F%2Fevil`, `javascript:` e `code` inválido: tudo cai em `/login?message=link-invalido`. Há ainda o teste "callback redirect accepts only a normalized local destination". |
| SEC-11 | APROVADO (banco) / INCONCLUSIVO (respostas reais) | CPF: só o dono lê (teste). Recuperação por CPF: o e-mail completo nunca vai ao navegador. A conferência das respostas reais da tela precisa de login. |
| SEC-12 | APROVADO (revisão de código) | Nenhum `dangerouslySetInnerHTML`. React escapa o texto. A única consulta montada com texto digitado (busca em `/interno`) troca `,()*%\"'.:` por espaço, e as regras de acesso continuam valendo. As demais consultas usam parâmetros. Sem payload destrutivo. |
| SEC-13 | REPROVADO (aberto) | Ver "Falhas encontradas". A recuperação por e-mail já responde igual para conta existente e inexistente. |
| SEC-14 | REPROVADO → corrigido / INCONCLUSIVO (execução) | Lógica corrigida. **Limitação:** o contador fica na memória de cada instância do servidor. Em hospedagem com várias instâncias, cada uma conta separado, e o Supabase mantém os próprios limites como segunda camada. O teste de execução (9 logins seguidos) não foi feito, para não bloquear contas reais. |
| SEC-15 | APROVADO, com ressalva | Presentes: CSP, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `Referrer-Policy`, `nosniff`, `Permissions-Policy`, HSTS, `Cache-Control: no-store`, e sem `X-Powered-By`. Ressalva: a CSP aceita `'unsafe-inline'` e `'unsafe-eval'` (`unsafe-eval` é necessário em desenvolvimento). Endurecer com *nonce* antes da publicação. |

### Criador (P1)
| ID | Resultado | Observações |
|---|---|---|
| CRI-01 | BLOQUEADO | Criar conta real dispara e-mail real; faltam caixa de e-mail de teste e SMTP. |
| CRI-02 | APROVADO (servidor) / INCONCLUSIVO (tela) | Testes: "signup requires matching passwords and explicit terms acceptance", "new passwords require 11 characters…". A mesma regra vale no servidor (Zod). |
| CRI-03 | BLOQUEADO | Falta SMTP e caixa de e-mail de teste. |
| CRI-04 | APROVADO (regra) / BLOQUEADO (login real) | Teste "login destination follows internal roles". Em sessão anterior, já visto com login real: `/login` e `/cadastro` levam ao painel. |
| CRI-05 | INCONCLUSIVO | Validação de CPF testada (unidade e banco). O envio real do e-mail ainda não foi testado (pendência registrada em TASKS). |
| CRI-06 a CRI-08, CRI-11, CRI-12, CRI-16 | BLOQUEADO | Precisam de conta de criador de teste. A tela foi conferida pelas prévias (`/preview/criador/cadastro`, `/preview/criador/evidencias`). |
| CRI-07 | APROVADO (validação) | Teste "social accounts reject insecure and deceptive profile URLs". |
| CRI-09 | APROVADO (banco) | Teste "submission requires the first three Stories, in order and within the age window"; critérios conferidos no banco real (0 / 3 / 1.000 / 7 dias). |
| CRI-10 | APROVADO (servidor) | Testes "image normalization rejects spoofed and oversized file contents" e "…strips metadata into WebP". O armazenamento aceita só JPEG, PNG e WebP, até 8 MB. |
| CRI-13 | APROVADO (banco) | Testes "creator withdraws a sent application before any review…" e "…cannot withdraw once the team has started". |
| CRI-14 | APROVADO (banco) | Testes "creator cannot alter protected status" e "creator cannot delete evidence after sending". |
| CRI-15 | APROVADO (banco) | Testes "creator deletes own evidence while the application is a draft" e "…cannot delete evidence after sending". |

### Equipe (P1)
| ID | Resultado | Observações |
|---|---|---|
| EQP-01 a EQP-04 | BLOQUEADO | Precisam de contas de cada função. As regras de acesso por função e atribuição estão aprovadas no banco simulado. |
| EQP-05 | APROVADO (função do banco) / BLOQUEADO (tela) | `user_id_for_email` encontra a conta certa e é recusada para usuários logados e para visitantes. O convite real dispara e-mail. |
| EQP-06, EQP-07 | APROVADO (banco) / BLOQUEADO (tela) | Testes "only administrators can grant internal roles and each change is audited" e "deactivated accounts lose RLS access…". |
| EQP-08 | APROVADO (banco) / BLOQUEADO (tela) | Teste "eligibility changes require admin and record the resulting criteria". |
| EQP-09 | APROVADO (banco) | Testes "rejection records the authorized reviewer, date, and reason" e "decision notifications carry a title…". |
| EQP-10 | APROVADO | Teste "audit history groups changes to the same target within 10 minutes"; conferido visualmente em `/preview/equipe/colaboradores`. |
| EQP-11 | APROVADO (banco) / BLOQUEADO (tela) | Testes "creators see only their own messages marked visible to them" e "…mark only their own notifications". |

### Regras de negócio (P1)
| ID | Resultado | Observações |
|---|---|---|
| REG-01 | APROVADO em parte (banco) | Envio, desfazer envio, correção, aprovação (bloqueada sem 3 evidências aprovadas) e rejeição estão cobertos. A suspensão não tem teste próprio. |
| REG-02 | APROVADO (banco) | O criador não muda a própria situação; a aprovação é bloqueada sem as evidências; a decisão por quem não é analista é recusada. |
| REG-03 | APROVADO (banco) | Os critérios são aplicados no banco no envio, não só na tela. |
| REG-04 | INCONCLUSIVO | Não há teste de concorrência. As funções SQL rodam em transação e conferem a situação atual antes de mudar, mas isso não foi comprovado com duas chamadas simultâneas. |

### Celular (P1/P2)
| ID | Resultado | Observações |
|---|---|---|
| MOB-01 | APROVADO (simulação) | 360 e 390 px: nada sai da largura da tela, campos com 16 px e alvos de toque de 44 px ou mais (auditoria automática de 9 telas). |
| MOB-02, MOB-03 | BLOQUEADO | Não há iPhone nem Android físico. Só foi feita simulação no navegador. |
| MOB-04 | APROVADO (simulação, prévia) | Barra fixa embaixo com o item atual destacado e espaço reservado para não cobrir o conteúdo. O teclado virtual depende de celular físico. |
| MOB-05, MOB-06 | BLOQUEADO | Precisam de celular físico e login. |
| MOB-07 | INCONCLUSIVO | O `manifest.webmanifest` é gerado (nome, cores, ícone SVG e início em `/login`). A instalação real precisa de celular e HTTPS. |

### Acessibilidade (P2)
| ID | Resultado | Observações |
|---|---|---|
| ACE-01 | APROVADO em parte | Foco visível definido em todos os controles (CSS). A navegação completa só com o teclado não foi percorrida em todas as telas. |
| ACE-02 | APROVADO | Auditoria automática de 15 telas: todos os campos têm rótulo, todos os botões e links têm nome, imagens têm descrição, há um título principal por tela e não há ids repetidos. Ressalva: a prévia de evidências não tem título principal, mas a tela real tem. Não foi testado com leitor de tela real. |
| ACE-03 | APROVADO | Contraste: texto de apoio 5,5:1, erro 6,0:1, texto do cartão escuro 11,7:1 (todos acima do mínimo AA de 4,5). A situação sempre aparece com texto além da cor. |
| ACE-04 | APROVADO (código) | `prefers-reduced-motion` tratado em 5 arquivos, incluindo as órbitas da página inicial. |

### Desempenho e estabilidade (P1/P2)
| ID | Resultado | Observações |
|---|---|---|
| PERF-01 a PERF-05 | BLOQUEADO / INCONCLUSIVO | Sem login, só as prévias. Medida do vídeo: começa a tocar logo (índice do MP4 no início, 0,6 Mbit/s, download a 24 Mbit/s). Não há medições de navegação com login. |

### Busca, arquivos, experiência, privacidade e robustez
| ID | Resultado | Observações |
|---|---|---|
| BUS-01 | REPROVADO (limitação conhecida) | "joao" não encontra "João". Correção proposta: extensão `unaccent` (migration aditiva). |
| BUS-02, BUS-03 | BLOQUEADO | Precisam de login de equipe. A exclusão das contas da equipe dos indicadores foi conferida em sessão anterior com login real. |
| ARQ-01, ARQ-02 | APROVADO (servidor) | Ver CRI-10. O sharp limita a quantidade de pixels. Não houve teste de exaustão de memória (proibido no banco real). |
| ARQ-03 | APROVADO em parte | `site-media` aceita só MP4 e WebM, até 50 MB, e só administradores enviam (regra do armazenamento). A barra de progresso real precisa de login de administrador. O bucket é público e guarda só o vídeo de apresentação. |
| UX-01 a UX-03 | INCONCLUSIVO | Estados vazios conferidos nas prévias; os erros simulados precisam de login. |
| PRIV-01 | APROVADO (banco) | Testes de pedidos de privacidade: criação, impedimento de duplicado e quem resolve. |
| PRIV-02 | APROVADO (texto) | A tela diz "nenhum e-mail foi enviado automaticamente" e trata o pedido como registrado, não como concluído. A exportação e a exclusão são manuais (limitação conhecida). |
| PRIV-03 | APROVADO (acesso) | `/termos` e `/privacidade` abrem, com o selo "Documento preliminar". Ainda falta a revisão jurídica. |
| ROB-01 | APROVADO (código) | Os botões ficam desativados enquanto o formulário é enviado. Envio duplicado impedido no banco (pedido de privacidade duplicado recusado; envio do cadastro conferido pela situação). |
| ROB-02, ROB-03 | BLOQUEADO | Precisam de sessão real e de simulação de falha. |

## Correções desta rodada

| Arquivo | Mudança |
|---|---|
| `src/proxy.ts` | Sem sessão, `/dashboard*` e `/interno*` redirecionam para `/login` antes de carregar a página |
| `src/lib/rate-limit.ts` | Limite por conta independente do IP; IP lido primeiro do `x-real-ip` |

Testes depois das correções: verificação de código OK, padrão de escrita OK, `npm test` com 47 de 47, e as rotas conferidas por HTTP. Nenhuma regressão encontrada.

## O que é preciso para destravar o restante

1. **Contas de teste**, criadas pelo responsável do projeto: duas contas de criador e uma de cada função (recrutador, gestor, analista e administrador). Os e-mails podem ser variações `+teste` da mesma caixa.
2. **Projeto Supabase separado para testes** (gratuito), para os testes destrutivos, de concorrência e de limite de tentativas sem risco aos dados reais.
3. **SMTP próprio**, para testar o cadastro, o convite e a recuperação de ponta a ponta.
4. **Decisão sobre o Playwright** (testes automáticos de navegador), que o usuário tinha deixado fora do escopo.
5. **Decisão sobre o SEC-13** (mensagens neutras no cadastro e na recuperação por CPF).
6. **Teste em celulares reais** (iPhone com Safari e Android com Chrome).
