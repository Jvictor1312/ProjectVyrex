# Segurança

> **Atualização de 2026-10-29:** a versão atual e conferida deste assunto está em [arquetipo/](../arquetipo/README.md). Este documento é mantido como histórico e pode estar desatualizado.

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

## Revisão de segurança de 2026-10-28

Aplicado:

- **Banco:** a tabela interna de cota (`evidence_upload_events`) não tem mais permissões para `anon`/`authenticated` (o TRUNCATE ignorava RLS); funções de gatilho não podem ser chamadas pela API; `recovery_phone_hint` só é executada pelo servidor (chave de serviço). Migration `202610280004_security_hardening.sql`. Nenhuma função fica aberta ao público.
- **Isolamento verificado:** um criador só lê os próprios perfil, redes, evidências, funções e mensagens; não lê auditoria nem arquivos de outros.
- **Senhas:** o Supabase passou a exigir 11 caracteres com minúscula, maiúscula, número e símbolo (antes aceitava 6 pela API). A troca de senha exige a senha atual.
- **Limite de tentativas** (`src/lib/rate-limit.ts`): login (8 por e-mail e 30 por endereço a cada 15 min), cadastro (5 por hora), recuperação (10 consultas a cada 15 min e 3 envios por hora por e-mail), troca de senha (5 a cada 15 min).
- **Sessão:** `src/proxy.ts` renova o token antes das telas com login. O login é conferido pela assinatura ES256 (`getClaims`).
- **Cabeçalhos:** Content-Security-Policy (scripts, imagens, vídeos e conexões só do site e do Supabase; `frame-ancestors 'none'`), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy e HSTS.
- **Ferramentas:** aprovação automática de comandos do assistente do VS Code desligada.

Pendente (depende de plano pago, conta externa ou publicação):

- Bloqueio de senhas vazadas (HaveIBeenPwned) exige plano pago do Supabase.
- CAPTCHA no cadastro/login (ex.: Cloudflare Turnstile) exige uma conta no provedor.
- SMTP próprio, para os e-mails de autenticação.
- Ao publicar: trocar `site_url` e a lista de redirecionamentos do Supabase para o domínio real e cadastrar as chaves nas variáveis de ambiente da hospedagem.
- O aviso "e-mail já cadastrado" no cadastro revela se um e-mail existe (pedido do produto). A dica do celular na recuperação revela os 4 últimos dígitos (pedido do produto), agora com limite de tentativas.
