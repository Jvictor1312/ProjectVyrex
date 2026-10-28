# Vyrex - acompanhamento de tarefas

Atualizado em: 2026-10-15 (sessão 4)

## Sessão 2026-10-27 (Claude Code)

- [x] Indicador "N" do Next.js desligado em desenvolvimento (`devIndicators: false`).
- [x] Cadastro com e-mail já existente agora mostra "Este e-mail já está cadastrado" (o Supabase devolve um usuário sem identidades em vez de erro).
- [x] Apresentação do cadastro: um único puxador na própria barra preta recolhe e abre; recolhida, a barra vira uma faixa clicável. Verificado em navegador (computador e celular), com prints.
- [x] `loading.tsx` em `/dashboard`, `/interno` e `/interno/[creatorId]`: a troca de tela agora é imediata, com tela de carregamento enquanto o Supabase responde.
- [x] Esfera do cadastro move sem re-renderizar o componente a cada movimento do mouse.
- [x] Cadastro: botão "Recolher" pequeno, na base da barra e à direita; logo duplicado e textos pequenos removidos.
- [x] Visão geral do criador redesenhada (`dashboard/creator-overview.tsx`): cartão preto com o próximo passo, trilha de etapas e botão; mensagens, notificações e histórico em cartões. A preview `/preview/criador` usa o mesmo componente.
- [x] Envio de evidências refeito (`components/evidence-board.tsx`): cada quadro é clicável, a imagem aparece borrada no quadro e um formulário curto pede rede, data e visualizações. Preview em `/preview/criador/evidencias`. Verificado no navegador com Playwright.
- [x] Causa do "envio que não funciona": salvar rede social e evidência não atualizava a página (faltava `revalidatePath`), então a seção de evidências continuava sem rede e o envio ficava travado.
- [x] Painel da equipe: menu lateral, filtros, tabela e paginação com fontes legíveis e retorno ao clique; a linha inteira da tabela abre o cadastro.
- [x] Funções do usuário buscadas em uma consulta e junto com o perfil (`requireUserWithRoles`), cortando 2 idas ao banco em `/interno`, `/interno/[creatorId]` e no login.
- [x] Fontes de 9–12 px aumentadas nas áreas de formulário e painel; textos longos encurtados nas abas do criador.
- [x] Favicon (`src/app/icon.svg`).
- [x] Teste `assigned relationship manager can request corrections` corrigido (preenche o nome público). 35/35 testes passam.
- [ ] Telas com login não verificadas no navegador: não há conta de teste (o usuário precisa criá-las; ver CLAUDE.md).
- [ ] `Public/image.png` e `Public/image2.png` estão corrompidos (não são imagens válidas). Não são usados no código. Pasta `Public` com P maiúsculo quebra em Linux (deploy).

## Sessão 2026-10-28 (Claude Code)

- [x] Borrado da prévia de evidências mais leve.
- [x] Área da equipe: layout único (`interno/internal-shell.tsx`), visual corporativo, modo escuro opcional (tema claro é o padrão; escolha salva no cookie `vyrex-internal-theme`). A ficha do criador também usa o layout.
- [x] Vídeo de apresentação: admin envia em Configurações (upload direto ao Storage, bucket público `site-media`, até 50 MB); abre grande na tela de cadastro. Migration `202610280001_presentation_video.sql` aplicada no Supabase.
- [x] Padrão visual único: botões em pílula com resposta ao toque, campos arredondados, links da home com sublinhado animado, esfera da home reativa. Login e recuperação sem barra preta (só o cadastro tem).
- [x] Conta `+adm` recebeu a função admin; `+user` é criadora. As duas confirmadas.
- [x] Só as 3 primeiras evidências são obrigatórias (migration `202610280002`, aplicada). Corrige também a brecha em que qualquer evidência aprovada contava na aprovação.
- [x] Celular opcional no cadastro (convite com seta abre o campo); validado no servidor com `libphonenumber-js/max` e salvo em E.164 (migration `202610280003`, aplicada).
- [x] Recuperação de senha em 2 passos: e-mail → escolha do canal mascarado. SMS aparece como "em breve".
- [x] Home redesenhada: menos texto, passos, públicos, critérios atualizados, dúvidas e chamada final.
- [ ] E-mails em português e remetente próprio: bloqueado até o usuário configurar SMTP (o Supabase recusa alterar os textos no plano gratuito sem SMTP). Modelos prontos em `supabase/templates/`.
- [ ] SMS de recuperação e verificação de posse do celular: exige um provedor de SMS (Twilio, MessageBird ou Vonage) configurado no Supabase.
- [ ] Testar as telas logadas com dados reais: o usuário precisa entrar no Chrome.

## Sessão 2026-10-28, fluxo do criador (Claude Code)

- [x] Corrigido: nenhuma evidência salvava (ação enviava `id`, sem permissão de coluna). Conta +user com perfil, rede e 3 evidências, cadastro ENVIADO (status submitted), pronto para o teste do admin.
- [x] Login conferido localmente (getClaims/ES256) e checagem de conta ativa junto com as consultas (`requireUserFast`): telas do criador em produção ~0,42–0,69 s (antes ~0,75–1,2 s).
- [x] Abas do criador: Visão geral, Meu cadastro, Mensagens (com avisos), Configurações (com privacidade).
- [x] Segundo envio do cadastro é bloqueado pelo banco e pela tela.
- [ ] Decidir com o usuário: como o criador corrige um cadastro enviado por engano (ex.: "desfazer envio" enquanto ninguém começou a análise).
- [ ] Próximo: teste do fluxo de administrador com a conta +adm.

## Critério de status

- **Concluída:** comportamento verificado e a verificação está descrita.
- **Escrita, não executada:** código escrito, mas typecheck/lint/build/testes NÃO foram executados no ambiente em que foi criado. Precisa de `npm run typecheck && npm run lint && npm test && npm run build` na máquina de desenvolvimento.
- **Parcial:** código existe, mas falta cobertura ou integração real.
- **Pendente:** ainda não implementada.
- **Bloqueada:** depende de configuração ou acesso externo.

Uma tela ou migration existente, isoladamente, não comprova que o fluxo está pronto para uso real.

## Concluídas e verificadas (sessões anteriores, 2026-10-14/15, na máquina do desenvolvedor)

- [x] Build de produção, `tsc --noEmit`, ESLint e `npm audit` passaram em 2026-10-14 (ver `QA_REPORT.txt`).
- [x] 26 testes passaram em 2026-10-15 (PGlite + validação). Eles cobrem a migration inicial, RLS, RPCs de decisão, quotas de upload, desativação de conta, roteamento por papel, schemas Zod e normalização de imagem.
- [x] Autenticação (login, cadastro, confirmação, recuperação, redefinição, callback), cadastro do criador (perfil, redes, 5 evidências com upload normalizado para WebP em bucket privado), submissão, painéis por função em `/interno`, equipe, critérios de elegibilidade, auditoria, mensagens e notificações.

## Verificadas nesta sessão (2026-10-15, sessão 2)

- [x] Migration `202610150001_data_requests.sql` aplicada sobre a migration inicial em **PostgreSQL 16 real** (com substitutos mínimos de `auth`/`storage`, os mesmos do teste existente). Verificado por script: criação do pedido, duplicado ativo bloqueado, tipo inválido recusado, escrita direta negada, criador/recrutador sem acesso a pedidos alheios, admin vê todos, encerramento exige justificativa e é definitivo, notificações e auditoria gravadas.
- [x] Checagem de **sintaxe** (TypeScript 6.0.3, erros TS1xxx) de todos os `.ts`/`.tsx` de `src/`: 0 erros. Isto NÃO é um typecheck completo.

## Escritas nesta sessão, ainda não executadas pelo projeto

Motivo: o ambiente da sessão não alcança o registro do npm (bloqueio de rede), então `node_modules` não pôde ser instalado e `typecheck`, `lint`, `npm test` (PGlite) e `build` não rodaram.

- [ ] `supabase/migrations/202610150001_data_requests.sql` (validada em PG16; falta rodar no PGlite/Supabase do projeto).
- [ ] `supabase/migrations/202610150002_social_account_updates.sql` (reset e auditoria da verificação após edição da rede; teste PGlite adicionado, ainda não executado).
- [ ] `supabase/migrations/202610150003_submission_profile_name.sql` (exige nome público no banco antes da submissão; teste PGlite adicionado, ainda não executado).
- [ ] Categorias do criador, critérios dinâmicos na tela de cadastro, edição de rede social e revisão pré-envio; diagnósticos do editor limpos, mas typecheck/lint/testes/build ainda não executados.
- [ ] `supabase/tests/data-requests.test.mjs` (espelha as verificações feitas em PG16; adicionado ao script `npm test`; `node --check` ok, mas não executado com PGlite).
- [ ] Páginas do criador: `/dashboard/privacidade`, `/dashboard/configuracoes`; navegação `CreatorNav` em todas as páginas do painel; progresso, pendências de evidência e "próximo passo" por estado em `/dashboard`; âncoras e atalhos em `/dashboard/perfil`.
- [ ] Ações `src/app/actions/privacy.ts` (solicitação de privacidade, resolução por admin, dados da conta, troca de senha).
- [ ] Admin: `/interno/privacidade` (permissão nova `privacy.requests.manage`, atribuída ao papel admin).
- [ ] Páginas `not-found` (404), `error` (erro inesperado) e `/acesso-negado` (403); `/interno`, `/interno/equipe` e `/interno/configuracoes` agora levam a `/acesso-negado` quando falta permissão.

## Parciais

- [ ] Cadastro em etapas: wizard de quatro etapas, ajuda contextual e salvamento automático do perfil implementados. Redes e evidências ainda exigem ações explícitas; persistência real e retomada ainda precisam de teste com Supabase.
- [ ] Painéis por função: existe um painel `/interno` único que se adapta ao papel (admin, validador, relacionamento, recrutador). Não há painéis visualmente separados por função.
- [ ] Upload: há pré-visualização local removível antes do envio; faltam progresso, retentativa/retomada e remoção persistente de evidências. O servidor valida tipo real, tamanho e reencoda para WebP.
- [ ] Termos e política de privacidade são rascunhos; precisam de revisão jurídica.
- [ ] Fluxo ponta a ponta com contas reais dos cinco papéis nunca foi exercitado.
- [ ] Cadastro: tela `/cadastro` usa painel preto de 24% no desktop, esfera interativa e diálogo de vídeo futuro. Desktop e mobile foram conferidos no navegador local; o vídeo final ainda depende de produção de conteúdo.
- [ ] Senhas novas: 11 caracteres mínimos com maiúscula, minúscula e especial; botão mostrar/ocultar nos campos de cadastro, redefinição e troca de senha. Testes foram adicionados, mas ainda não executados.

## Bloqueios externos

- [ ] Criar/selecionar projeto Supabase de staging e preencher `.env.local` (URL, chave pública, Site URL).
- [ ] Aplicar **as quatro** migrations em staging e validar Auth, RLS e Storage remotos.
- [ ] Configurar Auth: Site URL, allowlist de callback, confirmação de e-mail e SMTP.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` somente no servidor, se convites internos forem usados.
- [ ] Criar o primeiro administrador (procedimento no README).
- [ ] Revisão jurídica de termos/privacidade; definir procedimento humano para atender pedidos de privacidade (exportar/eliminar dados).

## Pendências de produto e qualidade

- [ ] Testes ponta a ponta (Playwright) do cadastro, upload, encaminhamento, triagem, decisão e correção. Não há Playwright configurado no projeto.
- [ ] Testar o wizard e persistência automática contra Supabase; adicionar autosave ao restante dos dados apenas com confirmação real de cada gravação.
- [ ] Painéis separados por função (recrutador, relacionamento, validação) com filtros por responsável, etapa e data.
- [ ] Revisão completa de responsividade e acessibilidade em navegador real das telas; a nova tela de cadastro foi inspecionada em desktop/mobile, mas as demais continuam pendentes.
- [ ] Preparar configuração de produção, retenção de dados e monitoramento. Não publicar sem autorização.

## Auditoria da especificação central (sessão 3)

### Coberto pela implementação existente, ainda sem validação ponta a ponta real

- [x] Auth Supabase, cadastro, confirmação, login, recuperação, redefinição, logout e roteamento por papel estão implementados. A integração remota ainda depende de configuração e não foi testada nesta sessão.
- [x] RLS e RPCs protegem perfis, atribuições, estados, decisões, auditoria e permissões; o Storage foi definido como privado. Testes locais usam PGlite e substitutos de Auth/Storage, não um projeto Supabase real.
- [x] Critérios de seguidores, cinco evidências, visualizações e idade máxima são armazenados/configurados no banco e verificados ao submeter/analisar. Números continuam declarados pelo criador e precisam de validação humana.
- [x] Perfil do criador, redes, evidências, mensagens, notificações, privacidade e configurações possuem persistência/ações no código; páginas 403/404/erro existem.
- [x] Equipe tem convites, papéis, ativações, atribuições com histórico e ações de triagem, relacionamento e validação protegidas por RPC/RLS. A experiência continua concentrada em um painel interno comum.

### Corrigido nesta auditoria, aguardando execução dos testes

- [ ] Acrescentadas as categorias Moda, Viagens, Educação, Música e Outros ao schema/formulário, conforme a especificação, com teste de regressão ainda não executado.
- [ ] O formulário do criador lê e apresenta os critérios ativos de seguidores, visualizações e idade, incluindo o caso sem limite de idade.
- [ ] Redes sociais existentes têm edição explícita; a migration nova permite a correção e remove/audita uma verificação anterior quando dados relevantes mudam.
- [ ] Revisão pré-envio mostra resumo e pendências por perfil, rede e evidência; ações de edição/envio são ocultadas fora de rascunho/correção.
- [ ] Página inicial agora posiciona a VYREX como operação de marketing de influência apoiada por tecnologia, apresenta marcas e criadores e explica estratégia/execução sem prometer resultados; critérios seguem configuráveis.
- [ ] Evidência selecionada agora pode ser pré-visualizada e removida antes do upload; comportamento ainda não foi testado em navegador.
- [ ] Diagnósticos do editor não apontaram erros nos arquivos alterados. Isso não substitui typecheck, lint, testes ou build.

### Lacunas confirmadas pela auditoria

- [ ] Cadastro agora usa wizard com quatro etapas, conclusão por etapa, ajuda contextual e revisão antes do envio; perfil tem autosave server-side. Falta testar retomada e persistência no Supabase e cobrir testes automatizados.
- [ ] Painéis de recrutamento, relacionamento e validação ainda usam `/interno` com variações por papel; faltam experiências separadas e filtros operacionais por responsável/período.
- [ ] A home reflete o posicionamento do manual; o arquivo de logo com o desenho tipográfico original não está válido no workspace, então foi mantido um wordmark textual uniforme, não uma reprodução da arte.
- [ ] Upload tem prévia local e remoção antes do envio, mas falta barra de progresso, retomada de falha e fluxo para excluir arquivo persistido.
- [ ] Não há E2E Playwright nem verificação visual atual de responsividade/acessibilidade.
- [ ] Pedidos de privacidade são registrados e respondidos manualmente; exportação e eliminação continuam procedimento externo, sem automação.
- [ ] Termos e política são rascunhos e exigem revisão jurídica. Campanhas, marcas, contratos e pagamentos permanecem fora do MVP.

### Bloqueio de execução atualizado

- [ ] O usuário inicializou `supabase/config.toml` e instalou/invocou a CLI via `npx`, mas `supabase start` falhou porque Docker/Podman não está instalado ou disponível no PATH. Portanto, `db reset`, `status -o env` e o seed ainda não foram concluídos; `.env.local` copiado do exemplo contém placeholders e precisa ser preenchido somente após iniciar o Supabase local.
- [ ] O executor desta sessão também não possui `node`/`npm` disponíveis, então não foi possível executar `npm run typecheck`, `npm run lint`, `npm test` ou `npm run build` após as mudanças.
- [ ] O servidor de desenvolvimento já estava acessível no navegador compartilhado em `http://localhost:3000`; o executor isolado não consegue iniciá-lo no caminho `C:\Users\Joaov\OneDrive\Desktop\Vyrex`.

## Erros conhecidos e limitações

- Supabase remoto não configurado nem exercitado.
- Testes de banco usam PGlite com substitutos de Auth/Storage; não substituem teste em Supabase de staging.
- Seguidores e visualizações são declarados pelo criador; não há integração oficial de métricas.
- A plataforma registra solicitações de privacidade, mas não exporta nem elimina dados automaticamente.
- Não há campanhas, marcas, contratos ou pagamentos.
- A migration inicial gera um aviso inofensivo do Postgres: o nome da política `contact history visible to assigned staff or creator when shared` excede 63 caracteres e é truncado.

## Próxima prioridade

1. Na máquina de desenvolvimento: `npm install`, depois `npm run typecheck`, `npm run lint`, `npm test` e `npm run build`; corrigir qualquer falha nos arquivos listados em "Escritas nesta sessão".
2. Criar o projeto Supabase de staging, aplicar as quatro migrations e validar o fluxo ponta a ponta.
3. Executar typecheck, lint, testes e build na máquina de desenvolvimento; revisar as novas telas em desktop/mobile.
