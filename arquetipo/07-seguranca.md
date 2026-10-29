# 7. Segurança

Estado em 29/10/2026. Este capítulo substitui a primeira parte de `docs/SECURITY.md`, que está desatualizada (ver capítulo 8).

## Proteções em vigor

### Quem pode o quê
- **Regras no banco.** Todas as 21 tabelas têm RLS. Pelo site, o usuário só tem permissão de leitura e, em poucas colunas, de alteração. Situação do cadastro, funções, responsáveis e critérios mudam **apenas** por funções do banco que conferem a permissão.
- **Funções do banco** são `security definer` com `search_path` fixo e travam a linha antes de mudar. Ninguém tira o último administrador nem desativa a própria conta.
- **Conta desativada** perde o acesso em todas as políticas, mesmo com um token ainda válido.
- **Chave de serviço** (`SUPABASE_SERVICE_ROLE_KEY`) só no servidor (`src/lib/supabase/admin.ts`, marcado `server-only`), em quatro usos: convites e funções da equipe, e-mail e último acesso dos colaboradores, recuperação por CPF e limite de tentativas. Antes de usá-la, o servidor confere a permissão de quem pediu.

### Login e contas
- Senha com 11 ou mais caracteres, maiúscula, minúscula, número e símbolo (no site e no Supabase).
- Token conferido pela assinatura (ES256) no servidor; sessão renovada pelo `proxy` antes das telas com login.
- **Limite de tentativas no banco** (vale para todos os servidores): login com 8 por e-mail e 30 por endereço a cada 15 min; cadastro com 5 por hora; recuperação com 3 envios por hora por identificador; troca de senha com 5 a cada 15 min por conta. As chaves são gravadas resumidas (SHA-256).
- **Respostas neutras:** cadastro e recuperação não revelam se um e-mail ou CPF existe, nem pela demora (mínimo de 1,2 s).
- A troca de senha exige a senha atual.

### Navegador
- **Política de conteúdo com nonce** (`src/proxy.ts` + `src/lib/security/csp.ts`): a cada visita é sorteado um código, e só os scripts com esse código rodam. Código injetado numa página é bloqueado (conferido em 29/10). Imagens, vídeos e conexões só do próprio site e do Supabase do projeto. `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
- Outros cabeçalhos (`next.config.ts`): `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (câmera, microfone, localização etc. bloqueados), HSTS de 2 anos, `Cross-Origin-Opener-Policy`.
- `X-Robots-Tag: noindex` nas áreas com login, nas prévias e nos retornos de autenticação.
- Redirecionamentos só para caminhos do próprio site (`safeLocalRedirectPath`).

### Arquivos
- Prints em bucket **privado**, com até 8 MB e só imagem; cada um é **refeito em WebP no servidor**, o que remove metadados e conteúdo escondido. A pasta é a do próprio usuário, com cota de 10 envios a cada 10 min. A equipe vê por links assinados de 10 min.
- Vídeo de apresentação em bucket público, mas só quem configura os critérios envia ou remove.

### Dados e segredos
- Nenhum `.env*` no git (exceto `.env.example`). As senhas das contas de teste ficam em variáveis do Windows e nunca entram em arquivo.
- CPF em tabela própria, que só o dono lê; nem a equipe vê.
- Auditoria (`audit_logs`) de decisões, funções, critérios, atribuições, desativações e pedidos de privacidade.

## O que falta antes de publicar

| Item | Por quê | Depende de |
| --- | --- | --- |
| **Trocar as chaves do Supabase e o token de acesso** | foram coladas numa conversa em 28/10 | dono (decidido: fim do projeto) |
| Migrar a chave pública para o formato `sb_publishable_` e desligar as chaves antigas (JWT) | padrão novo do Supabase | dono |
| SMTP próprio | e-mails de autenticação em português e com remetente da Vyrex | conta de e-mail |
| Configurar `site_url` e redirecionamentos do Auth para o domínio real | links dos e-mails | publicação |
| CAPTCHA no cadastro e no login (ex.: Cloudflare Turnstile) | barrar robôs | conta no provedor |
| Bloqueio de senhas vazadas | Supabase só oferece no plano pago | plano |
| Revisão jurídica dos termos e da política | LGPD | jurídico |
| Exportação e exclusão de dados por pedido de privacidade | hoje o site registra o pedido; a execução é manual | decisão operacional e jurídica |
| Apagar as contas `+adm` e `+user` | são de teste | fim do projeto |

## Riscos aceitos (pedidos do produto)

- A ficha de um criador sem permissão responde HTTP 200 com o conteúdo de "não encontrado" (limitação do carregamento progressivo do Next). Nenhum dado vaza.
- A política de conteúdo mantém `'unsafe-inline'` só para **estilos**, porque o React grava `style="..."` nos elementos. Estilo não executa código.
