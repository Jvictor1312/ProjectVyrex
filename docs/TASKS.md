# Vyrex - acompanhamento de tarefas

Atualizado em: 2026-10-29. Reescrito para mostrar só o estado atual e as pendências reais; o registro detalhado das sessões anteriores está no histórico do git (`git log -- docs/TASKS.md`).

## Estado atual (verificado)

- **Retrato completo do sistema:** `arquetipo/README.md` (atualizado em 2026-10-29).
- **Passagem para outro colaborador:** comece por `docs/PASSAGEM.md` (onde paramos, o que fica fora do git e próximas tarefas).
- **Ambiente:** Supabase na nuvem (`zofxrohoilwjtzbcruse`) com as 15 migrations aplicadas (até `202610290002`; conferido em 2026-10-29 no real e no de testes); `.env.local` com URL, chave pública (formato antigo `eyJ`) e chave de serviço nova (`sb_secret_`). Servidor local em `localhost:3000`. Projeto de testes `ukwnnrrqmrvfwtbjjrbi` com servidor em `localhost:3001`.
- **Verificações:** `npm run typecheck`, `npm run lint`, `npm test` (54/54, PGlite), `npm run test:e2e` (55 aprovados, 3 pulados de propósito), `npm run test:flows` (10/10) e `npm run build` passam.
- **Área do criador (`/dashboard`):** visão geral, meu cadastro (wizard, perfil com salvamento automático, redes, evidências, revisão e envio), mensagens e configurações (dados, senha, privacidade). Menu no topo. Evidências: vários prints de uma vez, dados por Story, um botão salva todos; os que falham ficam marcados ("Não foi salvo") e o botão vira "Tentar enviar de novo".
- **Área interna (`/interno`):** visão geral adaptada a cada função (indicadores sem as contas da equipe; busca por nome público ou do cadastro; filtros por situação, responsável e período), ficha do criador (conferência de redes e evidências, decisão, responsáveis, histórico), gestão de colaboradores (convite, funções, desativação com confirmação, histórico), configurações (critérios e vídeo) e pedidos de privacidade.
- **Padrões:** vocabulário único em `src/lib/labels.ts`; componentes da área interna em `src/app/interno/ui.tsx`; escala visual (título 24–32px, seção 16–20px, texto 14px, campos e botões 38–40px).
- **Prévias sem login (só em desenvolvimento):** `/preview/criador`, `/preview/criador/evidencias`, `/preview/equipe`, `/preview/equipe/colaboradores`.
- **Conferido com login real (conta +adm, só leitura):** visão geral, colaboradores (com e-mails e último acesso), configurações, privacidade e ficha do criador.

## Pendências

### Feito em 2026-10-29 (arquétipo, acessibilidade e avaliação da arquitetura)
- [x] **Arquétipo do sistema** em `arquetipo/` (8 capítulos): o que foi feito, telas, como funciona, testes, acessibilidade, segurança e avaliação da arquitetura. Documentos antigos de `docs/` ganharam um aviso apontando para ele.
- [x] **Auditoria de acessibilidade** em 16 telas × 2 larguras, com correções (commit `a3757ed`): "Pular para o conteúdo"; campos da ficha do criador com moldura; "Abrir ficha" com 44px no celular.
- [x] Verificações: typecheck, lint, `npm test` 54/54, build, `test:e2e` 55 + 3 pulados, `test:flows` 10/10.
- [x] **Itens da avaliação da arquitetura (segunda rodada, 29/10):** registro de erros, CI no GitHub, tipos gerados do banco, filtro "Responsável" no banco (migration `202610290003`), registro das migrations aplicadas, axe nos testes e erros ligados aos campos, layout da área do criador, cache do vídeo, limpeza de código, textos de auditoria, documentos reescritos, script e primeira cópia de segurança, textos públicos com 12px. Situação item a item em `arquetipo/08-avaliacao-da-arquitetura.md`.
- [x] Login, cadastro e senha não apagam mais o que foi digitado quando o servidor recusa (era o comportamento padrão do React 19).
- [x] **Tela de cadastro:** esfera com botão de play, anel pulsando e órbita; frase "Criadores e marcas, na mesma órbita."; o envio do vídeo recusa arquivos abaixo de HD (commit `f6177ef`).
- [x] **Vídeo de teste tirado da tela** (2026-10-29, a pedido do dono): era um desenho do Pato Donald (Disney), 320×240, sem relação com a Vyrex. Só o campo `site_settings.presentation_video_path` foi esvaziado; o arquivo continua no Storage (`site-media/presentation/e033326e-d9dd-4922-a803-47481dde520b.mp4`). A esfera agora mostra "Conheça a Vyrex" e a janela avisa que o vídeo virá em breve.
- [x] **SMTP próprio** (2026-10-29): Gmail da Vyrex configurado pelo dono; modelos em português aplicados pela Management API (assuntos "Confirme seu e-mail na Vyrex" e "Recupere sua senha da Vyrex"). E-mail de teste chegou (caiu no spam). Modelos refeitos no mesmo dia: faixa preta com "VYREX", texto explicando o pedido, link de reserva e rodapé.
- [x] **Logo oficial nos e-mails** (migration `202610290005`, aplicada no de testes, fluxos 11/11, e no real): PNG branco gerado do SVG, no bucket público `email-assets`; texto "VYREX" como reserva quando o programa bloqueia imagens (o Gmail bloqueia no spam).
- [ ] **E-mails no spam:** a causa principal é o remetente Gmail gratuito, sem reputação, com links para `supabase.co` e "Site URL" ainda em `localhost:3000`. Solução definitiva: domínio próprio + Resend com SPF, DKIM e DMARC (guia, parte A2-Resend) e "Site URL" do endereço real quando o site for publicado.
- **Troca das chaves: não será feita (decisão do dono, 2026-10-29).** O guia (`docs/GUIA_SMTP_E_CHAVES.md`, parte B) e o script `scripts/trocar-chaves.ps1` continuam disponíveis caso ele mude de ideia. Não tratar como pendência.
- [x] **Vídeo de apresentação da Vyrex enviado pelo dono** (conferido em 2026-10-29: 1920×1080, 61 s, 10,5 MB).
- [x] **Suspender e reativar cadastros** (migration `202610290004`, aplicada no de testes e no real): só administrador, só aprovados, motivo obrigatório, aviso ao criador, histórico e auditoria. Seção na ficha do criador; teste PGlite e etapa 9 do fluxo completo.
- [ ] **Decisões do dono:** onde guardar as cópias de segurança e com que frequência (e se os prints do Storage entram); hospedagem (limite de envio por requisição, ex.: 4,5 MB na Vercel, contra prints de até 8 MB); regra da situação `suspended`; serviço de alertas para o log (ex.: Sentry).
- [x] Verificações em 29/10 (fim): `npm test` 61/61, `test:e2e` 85 + 3 pulados (com axe), `test:flows` 10/10, CI aprovado.

### Feito em 2026-10-29 (histórico, evidências repetidas, visual e desempenho)
- [x] **Histórico da Visão geral recolhido** (`<details>` nativo, com contagem de registros); mostra até 15 registros.
- [x] **Evidências "repetidas" no histórico:** cada conferência de evidência é um registro próprio, mas as telas não liam qual Story era (`review_history.evidence_id`) e mostravam linhas idênticas. Visão geral e ficha da equipe agora mostram "Evidência aprovada · Story N" (`src/lib/history.ts`). Teste PGlite e unitário novos. Nenhum dado alterado.
- [x] **Meu cadastro e Mensagens com visual refinado.** Apresentação separada em `CreatorProfileView` e `CreatorMessages`, usadas pela tela real e pelas prévias (nova: `/preview/criador/mensagens`, `?vazio=1` para o estado vazio).
- [x] **Desempenho:** conexões com o Supabase mantidas abertas por até 60 s (`src/instrumentation.ts`, dependência `undici`). Medido no site: consulta após 6 s parado caiu de mediana 329 ms (até 552) para 204 ms (até 212).
- [x] `npm run test:e2e` rodado em 2026-10-29 com Chrome e credenciais: 55 aprovados, 3 pulados de propósito.
- [ ] Rodar `npm run test:flows` (servidor de testes na 3001). O passo 8 do fluxo foi atualizado para abrir o histórico recolhido.
- [x] Risco anotado: o painel `/interno` buscava todas as redes e atribuições. O resumo passou a ser somado no banco (`202610290001`); sobra o filtro "Responsável" (item M3 acima).

### Feito em 2026-10-28 (sessão e CPF)
- [x] **Continuar logado:** a página inicial reconhece quem já entrou ("Ir para o meu painel"); `/login` e `/cadastro` levam direto ao painel; o `proxy` renova a sessão também em `/`, `/login` e `/cadastro`.
- [x] **CPF opcional** em Configurações (tabela `user_documents`, só o próprio usuário lê; dígitos e duplicidade conferidos no banco). **Recuperação por CPF ou e-mail:** com CPF, a tela mostra o e-mail mascarado e envia as instruções para ele; o e-mail completo nunca vai ao navegador. Migration `202610280007` aplicada; 5 testes novos.
- [ ] Testar a recuperação por CPF de ponta a ponta: salvar um CPF real em Configurações e pedir a recuperação informando o CPF (envia e-mail de verdade).

### Feito em 2026-10-28 (logo e celular)
- [x] **Logo oficial em SVG** (`public/vyrex-logo.svg`, componente `VyrexLogo`) em todas as telas; ícone da aba com o "V" do logo.
- [x] **Celular (até 760px), sem mudar o computador:** campos com letra de 16px (sem zoom automático no iPhone); botões e links soltos com 44–52px; nenhum texto abaixo de 12px; menu do criador como barra fixa embaixo, com ícones e espaço do iPhone (safe-area); botões principais na largura toda; janelas da equipe quase em tela cheia. Medido em 390 e 360px: nada sai da tela.
- [x] **Instalar na tela inicial** (`manifest.webmanifest`): abre como aplicativo, começa em `/login`.
- [x] Prévia nova `/preview/criador/cadastro` (Meu cadastro, sem login).
- [ ] Conferir no celular de verdade (iPhone e Android): barra de baixo, teclado sobre os campos, envio de prints pela galeria.

### Feito em 2026-10-28 (colaboradores e vídeo)
- [x] **Cadastrar colaborador com e-mail que já tem conta** (ex.: quem se cadastrou antes como criador): a função de equipe é adicionada à conta existente, sem convite; a pessoa entra com a senha que já usa. Migration `202610280008` aplicada (`user_id_for_email`, só o servidor executa) e 1 teste novo.
- [x] **Envio do vídeo de apresentação** com porcentagem e barra de progresso, aviso ao sair da página no meio do envio e "Salvando…" ao final. O vídeo atual (24 MB) já toca rápido; a demora era o envio sem retorno visual.
- [x] **Visão geral do criador em duas colunas** (computador): próximo passo, jornada em 5 etapas e histórico à esquerda; mensagens e avisos à direita. Celular continua em uma coluna.
- [x] **Histórico administrativo agrupado e recolhido** (Colaboradores e Configurações): alterações no mesmo alvo com até 10 minutos entre elas viram subalterações da primeira; a seção começa sempre fechada. Regra em `src/lib/audit-groups.ts`, com teste.
- [ ] Sobrou no Storage uma cópia do vídeo enviada duas vezes (`presentation/112708a0-…mp4`, 24 MB, sem uso). Só apagar se o usuário autorizar.

### Feito em 2026-10-28 (textos, acessibilidade e segurança)
- [x] **Textos revisados:** página inicial sem promessas sem base (não existe área para marcas; a aprovação não garante campanha), 4 etapas reais em "Como funciona", dúvidas novas (custo, critérios da análise); cadastro explica o que vem depois; login com saudação neutra; confirmação de e-mail orienta sobre spam; envio para análise explica as consequências; critérios das evidências (3 obrigatórias, 4 e 5 opcionais, prazo, visualizações, formatos e 8 MB) junto do quadro; mensagens técnicas trocadas por orientações; reticências padronizadas.
- [x] **Situações:** Enviado para análise, Correções solicitadas, Não aprovado, Cadastro suspenso (vocabulário único em `src/lib/labels.ts`; a ficha da equipe deixou de ter uma lista própria).
- [x] **Busca e compartilhamento:** título e descrição reais, Open Graph, `robots.txt` e `X-Robots-Tag: noindex` nas áreas com login, prévias e retornos de autenticação.
- [x] **Confirmações que sumiam:** rede social salva, encaminhamento e decisão final (depois da decisão, a equipe volta à lista com aviso).
- [x] **Limite de tentativas compartilhado** entre instâncias (no banco). Feito em 2026-10-29.
- [x] **CSP com *nonce*** (2026-10-29): `src/lib/security/csp.ts` monta a política e `src/proxy.ts` sorteia um nonce por página; o layout usa `connection()` para montar as páginas na hora. Scripts sem nonce e HTML injetado com `onerror` são bloqueados (conferido no build de produção em `localhost:3002`); estilos seguem com `'unsafe-inline'` (o React grava `style=`). Build de teste: `$env:NEXT_DIST_DIR=".next-prod"; npm run build`.
- [x] **Termos e Política de privacidade reescritos** (2026-10-29, LGPD, sem advogado, por decisão do dono). Dados em `src/lib/legal.ts`.
- [ ] **Nome do responsável** nos Termos e na Política: preencher `ownerName` em `src/lib/legal.ts` (hoje é um texto de exemplo). Obrigatório antes de publicar.

### Decisões do usuário
- [x] **Fonte:** Figtree servida pelo site (texto e marca); Georgia nos títulos, com Gelasio como substituta em aparelhos sem Georgia. Decidido em 2026-10-28.
- [x] **"Desfazer envio"** e **apagar evidência no rascunho** implementados (migration `202610280005`, 4 testes PGlite). Regra do usuário: depois que a equipe começa a análise, o criador não altera nada. Migration já aplicada no banco real.
- [x] **Home:** texto corrido em 16px, títulos de seção em 28px, contraste corrigido. Os demais apontamentos do inspetor (sem sombras, sem linhas finas, mais fotos) são regras da skill que conflitam com a identidade atual e não foram aplicados.
- [ ] **Link "Área do criador"** no menu da equipe foi removido; recolocar se for útil.

### Dependem do usuário ou de serviços externos
- [x] **Migration `202610280005` aplicada no Supabase** em 2026-10-28 pela Management API (token salvo na variável do Windows `SUPABASE_ACCESS_TOKEN`). Conferido: funções criadas, só usuários logados executam, a API já as reconhece.
- [ ] **Testes com contas reais de todas as funções:** convidar recrutador, gestor de relacionamento e analista de validação pela tela de colaboradores; criar uma conta de criador em rascunho para testar o salvamento real das evidências e o fluxo completo (envio, triagem, validação, correção, decisão).
- [x] **E-mails em português** com remetente da Vyrex: SMTP próprio e modelos aplicados em 2026-10-29.
- [ ] **SMS** (recuperação por celular): exige provedor (Twilio, MessageBird ou Vonage).
- [ ] **Termos e política (opcional):** revisão por advogado, se o dono quiser.
- [ ] **Publicação:** só com autorização. Antes: configurar as variáveis de ambiente na hospedagem, Site URL e callbacks do Auth.
- **Segurança das chaves: o dono decidiu não trocar (2026-10-29).** Registro histórico: a chave secreta e a `service_role` antiga foram coladas na conversa em 2026-10-28. Trocar a secreta; migrar a chave pública para `sb_publishable_` e então desativar as chaves antigas (JWT). O token de acesso (`sbp_`) também foi colado na conversa: apagar e gerar outro em supabase.com/dashboard/account/tokens.

### Técnicas (podem ser feitas sem o usuário)
- [x] **Testes automáticos de navegador** (Playwright, `npm run test:e2e`): públicas, proteção de rotas, recuperação neutra, área do criador e da equipe só leitura, em computador e celular. Liberado pelo usuário em 2026-10-28.
- [x] Usuário guardou as senhas das contas de teste com `scripts/set-test-credentials.ps1` (testes com login liberados).
- [x] **Projeto Supabase de testes** e fluxo completo do cadastro (`npm run test:flows`, 10/10).
- [ ] Mostrar `creatorStatusDescriptions` (`src/lib/labels.ts`, ainda sem uso) na visão geral do criador.
- [ ] **Busca sem acento:** "joao" não encontra "João". Exige a extensão `unaccent` (migration aditiva) ou uma coluna normalizada.
- [ ] **Barra de progresso por arquivo** no envio de evidências: as Server Actions não informam o progresso do upload; exigiria enviar direto ao Storage pelo navegador.
- [ ] **Painéis separados por função:** hoje `/interno` é um painel único que se adapta à função; avaliar se a operação precisa de telas próprias.
- [ ] **Pedidos de privacidade:** exportação e exclusão de dados continuam manuais.
- [ ] **Monitoramento e retenção de dados** para produção.
