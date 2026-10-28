# Vyrex - acompanhamento de tarefas

Atualizado em: 2026-10-28. Reescrito para mostrar só o estado atual e as pendências reais; o registro detalhado das sessões anteriores está no histórico do git (`git log -- docs/TASKS.md`).

## Estado atual (verificado)

- **Ambiente:** Supabase na nuvem (`zofxrohoilwjtzbcruse`) com as 8 migrations aplicadas; `.env.local` com URL, chave pública (formato antigo `eyJ`) e chave de serviço nova (`sb_secret_`). Servidor local em `localhost:3000`.
- **Verificações:** `npm run typecheck`, `npm run lint`, `npm test` (35/35, PGlite) e `npm run build` passam.
- **Área do criador (`/dashboard`):** visão geral, meu cadastro (wizard, perfil com salvamento automático, redes, evidências, revisão e envio), mensagens e configurações (dados, senha, privacidade). Menu no topo. Evidências: vários prints de uma vez, dados por Story, um botão salva todos; os que falham ficam marcados ("Não foi salvo") e o botão vira "Tentar enviar de novo".
- **Área interna (`/interno`):** visão geral adaptada a cada função (indicadores sem as contas da equipe; busca por nome público ou do cadastro; filtros por situação, responsável e período), ficha do criador (conferência de redes e evidências, decisão, responsáveis, histórico), gestão de colaboradores (convite, funções, desativação com confirmação, histórico), configurações (critérios e vídeo) e pedidos de privacidade.
- **Padrões:** vocabulário único em `src/lib/labels.ts`; componentes da área interna em `src/app/interno/ui.tsx`; escala visual (título 24–32px, seção 16–20px, texto 14px, campos e botões 38–40px).
- **Prévias sem login (só em desenvolvimento):** `/preview/criador`, `/preview/criador/evidencias`, `/preview/equipe`, `/preview/equipe/colaboradores`.
- **Conferido com login real (conta +adm, só leitura):** visão geral, colaboradores (com e-mails e último acesso), configurações, privacidade e ficha do criador.

## Pendências

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

### Decisões do usuário
- [x] **Fonte:** Figtree servida pelo site (texto e marca); Georgia nos títulos, com Gelasio como substituta em aparelhos sem Georgia. Decidido em 2026-10-28.
- [x] **"Desfazer envio"** e **apagar evidência no rascunho** implementados (migration `202610280005`, 4 testes PGlite). Regra do usuário: depois que a equipe começa a análise, o criador não altera nada. Migration já aplicada no banco real.
- [x] **Home:** texto corrido em 16px, títulos de seção em 28px, contraste corrigido. Os demais apontamentos do inspetor (sem sombras, sem linhas finas, mais fotos) são regras da skill que conflitam com a identidade atual e não foram aplicados.
- [ ] **Link "Área do criador"** no menu da equipe foi removido; recolocar se for útil.

### Dependem do usuário ou de serviços externos
- [x] **Migration `202610280005` aplicada no Supabase** em 2026-10-28 pela Management API (token salvo na variável do Windows `SUPABASE_ACCESS_TOKEN`). Conferido: funções criadas, só usuários logados executam, a API já as reconhece.
- [ ] **Testes com contas reais de todas as funções:** convidar recrutador, gestor de relacionamento e analista de validação pela tela de colaboradores; criar uma conta de criador em rascunho para testar o salvamento real das evidências e o fluxo completo (envio, triagem, validação, correção, decisão).
- [ ] **E-mails em português** com remetente da Vyrex: exige SMTP próprio no Supabase. Modelos prontos em `supabase/templates/`.
- [ ] **SMS** (recuperação por celular): exige provedor (Twilio, MessageBird ou Vonage).
- [ ] **Termos e política de privacidade:** rascunhos; precisam de revisão jurídica.
- [ ] **Publicação:** só com autorização. Antes: configurar as variáveis de ambiente na hospedagem, Site URL e callbacks do Auth.
- [ ] **Segurança das chaves (fim do projeto, decisão do usuário):** a chave secreta e a `service_role` antiga foram coladas na conversa em 2026-10-28. Trocar a secreta; migrar a chave pública para `sb_publishable_` e então desativar as chaves antigas (JWT). O token de acesso (`sbp_`) também foi colado na conversa: apagar e gerar outro em supabase.com/dashboard/account/tokens.

### Técnicas (podem ser feitas sem o usuário)
- [ ] **Testes automáticos de navegador** (cadastro, envio, análise, correção). Fora do escopo por decisão do usuário em 2026-10-28.
- [ ] **Busca sem acento:** "joao" não encontra "João". Exige a extensão `unaccent` (migration aditiva) ou uma coluna normalizada.
- [ ] **Barra de progresso por arquivo** no envio de evidências: as Server Actions não informam o progresso do upload; exigiria enviar direto ao Storage pelo navegador.
- [ ] **Painéis separados por função:** hoje `/interno` é um painel único que se adapta à função; avaliar se a operação precisa de telas próprias.
- [ ] **Pedidos de privacidade:** exportação e exclusão de dados continuam manuais.
- [ ] **Monitoramento e retenção de dados** para produção.
