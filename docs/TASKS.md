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

### Decisões do usuário
- [ ] **Fonte "Avenir Next":** declarada, mas não carregada (no Windows aparece outra). Hospedar uma fonte própria ou assumir a do sistema.
- [ ] **"Desfazer envio":** permitir que o criador retire um cadastro enviado por engano enquanto ninguém começou a análise.
- [ ] **Apagar evidência já salva:** hoje só dá para trocar o print. Apagar exige nova regra no banco (política de exclusão em `metric_evidence`) e contraria a regra de nunca apagar dados; só fazer com autorização.
- [ ] **Home, apontamentos de estilo do inspetor** (`design-taste-frontend`): texto de 14px (sugere 16px+), muitos tamanhos de fonte, sombras e linhas finas. O contraste já foi corrigido.
- [ ] **Link "Área do criador"** no menu da equipe foi removido; recolocar se for útil.

### Dependem do usuário ou de serviços externos
- [ ] **Testes com contas reais de todas as funções:** convidar recrutador, gestor de relacionamento e analista de validação pela tela de colaboradores; criar uma conta de criador em rascunho para testar o salvamento real das evidências e o fluxo completo (envio, triagem, validação, correção, decisão).
- [ ] **E-mails em português** com remetente da Vyrex: exige SMTP próprio no Supabase. Modelos prontos em `supabase/templates/`.
- [ ] **SMS** (recuperação por celular): exige provedor (Twilio, MessageBird ou Vonage).
- [ ] **Termos e política de privacidade:** rascunhos; precisam de revisão jurídica.
- [ ] **Publicação:** só com autorização. Antes: configurar as variáveis de ambiente na hospedagem, Site URL e callbacks do Auth.
- [ ] **Segurança das chaves (fim do projeto, decisão do usuário):** a chave secreta e a `service_role` antiga foram coladas na conversa em 2026-10-28. Trocar a secreta; migrar a chave pública para `sb_publishable_` e então desativar as chaves antigas (JWT).

### Técnicas (podem ser feitas sem o usuário)
- [ ] **Testes automáticos de navegador** (cadastro, envio, análise, correção). Fora do escopo por decisão do usuário em 2026-10-28.
- [ ] **Busca sem acento:** "joao" não encontra "João". Exige a extensão `unaccent` (migration aditiva) ou uma coluna normalizada.
- [ ] **Barra de progresso por arquivo** no envio de evidências: as Server Actions não informam o progresso do upload; exigiria enviar direto ao Storage pelo navegador.
- [ ] **Painéis separados por função:** hoje `/interno` é um painel único que se adapta à função; avaliar se a operação precisa de telas próprias.
- [ ] **Pedidos de privacidade:** exportação e exclusão de dados continuam manuais.
- [ ] **Monitoramento e retenção de dados** para produção.
