# Segurança

## Princípios aplicados

- **Autorização no banco.** RLS em todas as tabelas privadas; mutações sensíveis (decisões, atribuições, papéis, critérios, privacidade) somente por RPCs `security definer` com `search_path` fixo e checagem de permissão. O cliente recebe `grant select` e, em poucas colunas, `update`/`insert`.
- **Sessão no servidor.** `requireUser()` valida a sessão (`auth.getUser()`) e que a conta está ativa antes de cada página/ação protegida. Conta desativada perde acesso mesmo com token válido (`account_is_active()` nas políticas).
- **Sem chave privilegiada no navegador.** `SUPABASE_SERVICE_ROLE_KEY` só em `src/lib/supabase/admin.ts` (`server-only`), opcional.
- **Evidências privadas.** Bucket `story-evidence` não público, MIME e tamanho limitados; leitura apenas pelo dono ou equipe com acesso ao cadastro; URLs assinadas curtas (60 s) na interface do criador; cota de uploads por janela de 10 minutos; imagem reencodada (remove metadados e conteúdo não imagem).
- **Entradas.** Zod no servidor para todas as ações; URL de rede social só HTTPS e domínio compatível; redirecionamento de callback só local.
- **Senhas novas.** Cadastro, redefinição e troca exigem pelo menos 11 caracteres, uma letra maiúscula, uma minúscula e um caractere especial. A senha nunca é armazenada em tabelas próprias.
- **Auditoria.** Decisões, mudança de papéis/critérios, atribuições e solicitações de privacidade gravam `audit_logs`.
- **Mensagens de erro** genéricas ao usuário; detalhes ficam no servidor.

## Solicitações de privacidade (migration 2)

- O titular só cria pedidos para si (RPC `create_data_request`), no máximo um ativo por tipo; só vê os próprios.
- Somente quem tem `privacy.requests.manage` (padrão: admin) vê todos e atualiza (`resolve_data_request`); encerrar exige justificativa e é definitivo.
- **Limite importante:** a plataforma registra e notifica. Exportar ou eliminar dados continua sendo um procedimento manual que a empresa precisa definir (inclusive retenção legal).

## Riscos e lacunas conhecidos

- RLS/Storage só foram testados contra substitutos locais (PGlite / PG16 com stubs de `auth`/`storage`), nunca contra um projeto Supabase real. Validar em staging com um usuário de cada papel, incluindo acesso cruzado e URL de arquivo de outro usuário.
- Não há limitação de taxa em login/cadastro/recuperação além dos limites padrão do Supabase Auth; configurar no painel do Supabase e/ou na hospedagem.
- Cabeçalhos de segurança (CSP, HSTS etc.) não estão configurados em `next.config.ts`; definir na publicação.
- A confirmação de e-mail depende de configuração do Supabase (SMTP).
- Textos jurídicos são rascunhos.
