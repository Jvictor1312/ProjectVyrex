# Vyrex: resumo do sistema para planejar testes

Atualizado em 28/10/2026. Este documento descreve o estado real do sistema (código, banco e telas) para que outra IA ou pessoa monte um plano de testes. Não contém chaves, senhas nem dados pessoais.

---

## 1. O que é

A Vyrex é uma agência de marketing de influência. A plataforma web serve para:

- **Criadores de conteúdo (influenciadores):** criam conta, preenchem perfil e redes sociais, enviam prints de Stories como prova de visualizações e mandam o cadastro para análise.
- **Equipe interna:** analisa os cadastros, confere redes e evidências, pede correções, aprova ou recusa, conversa com o criador e administra a equipe.

O público principal (criadores) acessa **principalmente pelo celular**. A equipe usa principalmente o computador.

## 2. Tecnologia

| Camada | Tecnologia |
|---|---|
| Front e servidor | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Estilo | CSS próprio (CSS Modules + `globals.css`), sem biblioteca de componentes |
| Fontes | Figtree (texto) e Georgia/Gelasio (títulos), servidas pelo próprio site |
| Banco, login e arquivos | Supabase: Postgres com RLS (segurança por linha), Auth (e-mail e senha) e Storage |
| Validação | Zod (formulários), libphonenumber-js (telefone), validação própria de CPF |
| Imagens | sharp: os prints são convertidos para WebP e os metadados são removidos |
| Testes atuais | 47 testes automáticos com `node --test`: banco simulado em PGlite (regras SQL, RLS, permissões) e validações em TypeScript |
| Verificações | `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` (todos passando) |

O sistema roda localmente em `http://localhost:3000` e usa o banco Supabase real na nuvem. **Ainda não foi publicado em produção.**

## 3. Perfis de acesso (funções)

| Função | O que pode |
|---|---|
| Criador (influencer) | Só os próprios dados: perfil, redes, evidências, mensagens, configurações |
| Recrutador | Triagem dos criadores atribuídos a ele; encaminha para validação |
| Gestor de relacionamento | Acompanha os criadores atribuídos, registra contatos e envia mensagens |
| Analista de validação | Confere redes e evidências, pede correções e registra a decisão final |
| Administrador | Tudo: colaboradores, funções, critérios, vídeo de apresentação, privacidade e todos os cadastros |

- Uma pessoa pode ter várias funções.
- As permissões são conferidas **no servidor e no banco** (funções SQL `has_permission`, `can_access_creator` e políticas RLS), não apenas escondendo botões.
- Ao entrar, quem tem função de equipe vai para `/interno`; quem é só criador vai para `/dashboard`.

## 4. Situações do cadastro do criador

`incomplete` (Cadastro incompleto) → `submitted` (Aguardando análise) → `under_review` (Em análise) → `approved` (Aprovado), `rejected` (Rejeitado) ou `changes_requested` (Correção solicitada). Existe ainda `suspended` (Suspenso).

- Enquanto está `submitted` e a equipe não fez nenhuma ação, o criador pode **desfazer o envio** e voltar a editar.
- Depois que a análise começa, o criador **não altera mais nada**, a não ser que a equipe peça correção.
- Evidências salvas podem ser **apagadas só no rascunho** (`incomplete`).
- Toda mudança importante fica registrada em `review_history` (visível ao criador) e em `audit_logs` (histórico administrativo).

## 5. Critérios atuais (configuráveis pelo administrador)

- 0 seguidores mínimos: não há corte por seguidores.
- 3 evidências obrigatórias (Stories nas posições 1 a 3); a 4ª e a 5ª são opcionais.
- 1.000 visualizações mínimas por evidência.
- Story com no máximo 7 dias.
- Prints: JPEG, PNG ou WebP, até 8 MB cada, convertidos para WebP no servidor.

## 6. Telas

### Públicas
| Endereço | Conteúdo |
|---|---|
| `/` | Página inicial: apresentação, "Como funciona", criadores e marcas, dúvidas. Reconhece quem já está logado ("ir para o meu painel"). |
| `/cadastro` | Criação de conta (nome, e-mail, senha forte, telefone opcional, aceite dos termos). Painel lateral com o vídeo de apresentação. |
| `/cadastro/confirmacao` | Aviso para confirmar o e-mail |
| `/login` | Entrar (redireciona direto para o painel se já estiver logado) |
| `/recuperar-senha` | Recuperação por **CPF ou e-mail**: com CPF, mostra o e-mail mascarado (ex.: `jv•••@gmail.com`) e envia o link para ele |
| `/redefinir-senha` | Nova senha (a partir do link do e-mail) |
| `/termos`, `/privacidade` | Documentos preliminares |
| `/acesso-negado` | Quando falta permissão |

### Área do criador (`/dashboard`, exige login)
| Endereço | Conteúdo |
|---|---|
| `/dashboard` | Visão geral. No computador, em duas colunas: cartão com o próximo passo, "Sua jornada na Vyrex" (5 etapas com "Você está aqui") e histórico; mensagens e notificações à direita. |
| `/dashboard/perfil` | "Meu cadastro" em 4 etapas: Perfil (salva sozinho), Redes sociais, Evidências (vários prints de uma vez, dados por Story, salva tudo junto, refaz só os que falharam) e Revisão e envio |
| `/dashboard/mensagens` | Mensagens da equipe e avisos |
| `/dashboard/configuracoes` | Nome, telefone, **CPF opcional** (validado, único por conta, só o dono vê), troca de senha (pede a senha atual) e pedidos de privacidade (LGPD) |

### Área da equipe (`/interno`, exige função interna)
| Endereço | Conteúdo |
|---|---|
| `/interno` | Visão geral: indicadores (sem contar as contas da equipe), carteira por responsável, redes declaradas e lista de cadastros com busca e filtros por situação, responsável e período |
| `/interno/[id]` | Ficha do criador: dados, conferência de cada rede e evidência, pedido de correção, decisão final, responsáveis, contatos, mensagens e histórico |
| `/interno/equipe` | Colaboradores (só admin): cadastrar (convite por e-mail, ou adiciona a função se o e-mail já tem conta), mudar funções, desativar com motivo, legenda de funções e **histórico administrativo recolhido, com subalterações** (mudanças no mesmo alvo com até 10 min entre elas ficam agrupadas) |
| `/interno/configuracoes` | Critérios de elegibilidade, vídeo de apresentação (envio com barra de progresso) e histórico dos critérios |
| `/interno/privacidade` | Pedidos de privacidade dos titulares |

### Prévias sem login (só no ambiente local)
`/preview/criador`, `/preview/criador/cadastro`, `/preview/criador/evidencias`, `/preview/equipe` e `/preview/equipe/colaboradores`. Elas usam **os mesmos componentes** das telas reais, com dados fictícios. Salvar nelas é recusado, porque não há login.

## 7. Identidade visual e experiência

- **Identidade:** minimalista, preto e branco, com um tom de cor só para indicar situação (verde, amarelo, vermelho, azul), sempre acompanhado de texto.
- **Logo oficial em SVG**, que muda de cor conforme o fundo. A página inicial tem uma esfera com órbitas animadas, que respeita "reduzir movimento".
- **Computador:** a área do criador tem menu no topo; a equipe tem menu lateral, com modo claro e escuro.
- **Celular** (até 760 px):
  - menu do criador como **barra fixa embaixo**, com ícones;
  - campos com letra de 16 px (o iPhone não dá zoom);
  - botões e links com pelo menos 44 px de altura;
  - nenhum texto abaixo de 12 px;
  - botões principais na largura toda;
  - respeita a área do "risco" do iPhone.
- **Instalável na tela inicial** do celular (manifest), abrindo como aplicativo.
- **Acessibilidade:**
  - foco visível em todos os controles;
  - rótulos em todos os campos;
  - mensagens de erro e sucesso anunciadas a leitores de tela;
  - confirmação antes de ações destrutivas;
  - situação nunca indicada só por cor.

## 8. Segurança já implementada

- RLS em todas as tabelas. O criador só vê os próprios dados, e a equipe só vê os cadastros a que tem acesso pela função ou pela atribuição.
- Ações sensíveis passam por funções SQL `security definer`, que conferem a permissão e gravam no histórico: decisão, correção, funções, desativação e critérios.
- A chave de serviço do Supabase fica só no servidor. Ela é usada para e-mails da equipe, convites, recuperação por CPF e localização de conta por e-mail, sempre por funções que só o servidor pode executar.
- Limites de tentativas:
  - login: 8 por e-mail e 30 por IP a cada 15 min;
  - cadastro: 5 por hora;
  - consulta de recuperação: 10 a cada 15 min;
  - envio do e-mail de recuperação: 3 por hora;
  - troca de senha: 5 a cada 15 min.
- Proteção contra descobrir contas cadastradas:
  - na recuperação por e-mail, a resposta é a mesma exista ou não a conta;
  - na recuperação por e-mail, o endereço aparece mascarado mesmo quando não há conta.
- Ponto de atenção: o **cadastro** avisa "Este e-mail já está cadastrado", o que permite descobrir se um e-mail tem conta. Foi uma escolha de usabilidade; vale avaliar no teste.
- Ponto de atenção: a **recuperação por CPF** responde "Não encontramos uma conta ativa com esse CPF", o que revela se um CPF tem conta. O limite é de 10 consultas a cada 15 min; vale avaliar no teste.
- Senha forte: no mínimo 11 caracteres, com maiúscula, minúscula, número e símbolo. Trocar a senha exige a senha atual.
- Prints de evidência ficam em armazenamento **privado**, com links temporários; o vídeo de apresentação fica em armazenamento público.
- Redirecionamento após o login só aceita endereços internos do próprio site.
- Conta desativada é impedida de usar o sistema mesmo com sessão aberta.

## 9. Banco de dados (Supabase)

- **Tabelas:**
  - pessoas e acesso: `profiles`, `user_roles`, `roles`, `permissions`, `role_permissions`;
  - criador: `creator_profiles`, `social_accounts`, `metric_evidence`, `evidence_upload_events`;
  - análise e equipe: `review_history`, `team_messages`, `notifications`, `contact_history`, `recruiter_assignments`, `relationship_assignments`;
  - configurações: `eligibility_settings`, `site_settings`;
  - registro e privacidade: `audit_logs`, `data_requests`, `user_documents` (CPF).
- **Armazenamento:** `story-evidence` (privado, 8 MB, imagens) e `site-media` (público, 50 MB, vídeos MP4/WebM).
- **Migrations:** 13 aplicadas, todas aditivas, de `202610140001` a `202610280008`.

## 10. Limitações e pendências conhecidas

- **E-mails do Supabase** ainda saem com o texto padrão, em inglês, e com link em vez de código, porque falta configurar um SMTP próprio. Os modelos em português já estão prontos.
- **Recuperação por SMS** ainda não está disponível, porque falta um provedor de SMS.
- **Busca da equipe** diferencia acentos: "joao" não encontra "João".
- **Exportação e exclusão de dados** (pedidos de privacidade) são feitas manualmente pela equipe.
- **Termos e política** são rascunhos que aguardam revisão jurídica.
- **Testes automáticos de navegador** (ponta a ponta) ainda não existem; os testes atuais cobrem banco e validações.
- **Celular de verdade:** ainda não foi testado em iPhone e Android reais, só em simulação de 360 e 390 px.

## 11. Regras para quem for testar

1. **Nunca apagar dados** do banco real: nada de delete, truncate, drop ou reset. Testes destrutivos só em ambiente local ou separado.
2. **Não publicar em produção** sem autorização.
3. Sem login, use as **prévias** (seção 6). Para fluxos com login, use contas de teste criadas pelo responsável do projeto.
4. **Não registrar senhas, tokens ou chaves** em relatórios.
5. Teste de invasão automatizado só com autorização expressa, e nunca contra produção.

---

## Pedido

Com base neste resumo, gere um **prompt de testes** completo e organizado por prioridade. O prompt deve cobrir:

- **Fluxos:** funcionais ponta a ponta do criador e de cada função da equipe;
- **Permissões:** tentativas de acesso indevido por endereço direto e por chamada manual;
- **Regras de negócio:** situações do cadastro, desfazer envio, apagar evidência só no rascunho, critérios, agrupamento do histórico;
- **Formulários:** validações, como CPF, telefone, senha e limites de tentativas;
- **Arquivos:** envio de prints e vídeo, com tipos e tamanhos inválidos;
- **Celular e acessibilidade:** usabilidade no celular (360 a 430 px) e no computador (1366 e 1920 px), teclado, leitor de tela e contraste;
- **Robustez:** desempenho e estabilidade, como navegação entre abas, recarregar a página e conexão lenta;
- **Segurança:** OWASP básico, sessão, redirecionamentos, exposição de dados e enumeração de contas.

Para cada teste, informe:
- passos;
- resultado esperado;
- conta ou função necessária;
- se pode rodar sem login (prévias);
- prioridade: alta, média ou baixa.
