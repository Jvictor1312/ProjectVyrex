# Vyrex

Plataforma Next.js que apoia a operação de marketing de influência da VYREX com cadastro, triagem e validação manual de criadores. A aprovação de um perfil representa somente elegibilidade para oportunidades futuras; não garante campanha, contratação ou pagamento.

## Estado da entrega

A base inclui autenticação Supabase, cadastro do criador, redes sociais, upload privado de evidências, decisão manual com histórico, painéis por função, controle de responsáveis, gestão de equipe, critérios de elegibilidade, auditoria, área de privacidade/configurações do criador, solicitações de privacidade tratadas pelo admin e páginas 403/404/erro. O projeto ainda depende de configuração de um projeto Supabase antes de autenticar usuários reais.

> **Vai continuar o projeto?** Comece por [`docs/PASSAGEM.md`](docs/PASSAGEM.md): onde o trabalho parou, o que fica fora do git (chaves e contas de teste), como rodar os testes e as próximas tarefas.

## Requisitos

- Node.js 22.6 ou superior (usado pelo Next.js e pelo runner de testes nativo). Verificado localmente com Node.js 24.20.0.
- npm.
- Projeto Supabase com Auth, PostgreSQL e Storage.
- Chave `SUPABASE_SERVICE_ROLE_KEY` apenas para convites internos por e-mail; o restante da aplicação não depende dessa chave.

## Instalação local

```powershell
npm install
Copy-Item .env.example .env.local
```

Edite `.env.local` com os valores do seu projeto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE_ROLE_PRIVADA
```

`SUPABASE_SERVICE_ROLE_KEY` é opcional para desenvolvimento de telas. Ela é lida somente por `src/lib/supabase/admin.ts`, protegido pelo pacote `server-only`. Nunca use o prefixo `NEXT_PUBLIC_` nessa chave nem a envie ao navegador. Sem ela, a tela de equipe funciona sem e-mails e desabilita convites.

## Configuração Supabase

1. Crie um projeto Supabase e copie Project URL e anon key para `.env.local`.
2. No SQL Editor do projeto, execute **em ordem de nome** todas as migrations de `supabase/migrations/` (13 arquivos, de `202610140001_initial_platform.sql` a `202610280008_user_id_for_email.sql`). A primeira cria tabelas, funções, políticas RLS e o bucket privado `story-evidence`; as seguintes são aditivas (privacidade, redes, critérios, vídeo, 3 evidências obrigatórias, CPF, endurecimento de segurança etc.).
3. Em Authentication > URL Configuration, configure `http://localhost:3000` como Site URL e permita `http://localhost:3000/auth/callback`. Adicione os endereços equivalentes de cada ambiente implantado.
4. Ative confirmação de e-mail e configure o provedor de e-mail/SMTP. Em produção, utilize um provedor e limites de envio adequados.
5. Para convites de colaboradores, configure `SUPABASE_SERVICE_ROLE_KEY` no ambiente server-side do desenvolvimento/hosting, nunca nas variáveis públicas.
6. Crie o primeiro administrador depois do cadastro e da confirmação do seu próprio e-mail. No SQL Editor privilegiado, substitua `UUID_DO_ADMIN_INICIAL` pelo UUID conferido em Authentication > Users e execute uma única vez:

```sql
insert into public.user_roles (user_id, role_id)
select 'UUID_DO_ADMIN_INICIAL'::uuid, id
from public.roles
where key = 'admin'
on conflict do nothing;
```

Esse bootstrap inicial é uma operação administrativa privilegiada; não exponha o UUID ou credenciais em código público. A atribuição normal de funções depois disso deve ser feita pela tela da equipe, que registra auditoria.

A migration mantém o bucket privado e só autoriza leitura de arquivos próprios ou de cadastros visíveis ao colaborador conforme função/atribuição. Não torne `story-evidence` público.

## Executar

```powershell
npm run dev
```

Abra `http://localhost:3000`.

## Contas descartáveis de teste

Com Docker e Supabase CLI instalados, configure um Supabase local, aplique a migration e coloque a URL de loopback e a chave service role local em `.env.local`. Então execute:

```powershell
npm run seed:local-users
```

O comando cria ou renova uma conta de criador e uma de administrador, gera senhas aleatórias e grava as credenciais em `logins.txt`, que é ignorado pelo Git. O seed recusa URLs que não sejam `localhost`/loopback e não deve ser usado em staging ou produção. Cada execução troca as senhas anteriores.

As contas não foram criadas neste ambiente: não há Supabase CLI, Docker nem `.env.local` configurados. Os previews `/preview/criador` e `/preview/equipe` permitem visualizar as interfaces locais sem login e sem persistir dados.

## Qualidade

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Os testes usam PostgreSQL embutido PGlite para executar a migration, com substitutos mínimos de Auth/Storage para testes locais; também testam validação de formulários, isolamento por RLS, funções, upload, decisões e redirecionamentos. Eles não substituem uma execução de integração contra um projeto Supabase de staging.

## Documentação

`docs/TASKS.md` (estado e próximos passos, com o que foi ou não verificado), `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DECISIONS.md` e `docs/TESTING.md`.

## Arquitetura

- `src/app`: App Router, interface pública, autenticação, dashboards e ações do servidor.
- `src/app/actions`: mutações de Auth, cadastro e rotinas internas; cada ação valida entrada e sessão.
- `src/lib/validation`: schemas Zod reutilizados no servidor.
- `src/lib/supabase`: clientes server-side, incluindo o cliente Admin isolado.
- `supabase/migrations`: esquema relacional, RBAC, RLS, funções RPC e Storage privado.
- `supabase/tests`: testes PostgreSQL locais para migration e autorização.
- `tests`: testes de validação, imagem e redirect.

## Funções e limites

- `admin`: acesso gerencial, configuração de critérios, auditoria, equipe e atribuições.
- `recruiter`: triagem, anotações e encaminhamento de cadastros atribuídos.
- `relationship_manager`: contatos, mensagens e solicitações de correção em cadastros atribuídos.
- `validator`: revisão de redes/evidências e decisão final, com responsável, horário e motivo.
- `influencer`: acesso aos próprios dados, evidências, mensagens e histórico.

As permissões são verificadas novamente em RPCs do PostgreSQL e políticas RLS; esconder um botão não é considerado autorização. Contas desativadas perdem o acesso mesmo que mantenham um token de sessão. As decisões são registradas em histórico/auditoria e não podem ser alteradas por gravações diretas do cliente.

## Critérios iniciais de análise

- Pelo menos 3.000 seguidores informados em uma rede; a equipe ainda precisa verificar a contagem.
- Exatamente cinco evidências de Stories, identificadas da mais recente (posição 1) para a mais antiga (posição 5).
- Pelo menos 2.000 visualizações informadas por evidência; as imagens não são consideradas comprovação automática.
- Por padrão, todas as evidências devem ter até sete dias. Um administrador pode alterar ou remover esse limite na configuração.
- A aprovação exige rede social verificada e análise manual aprovada para todas as cinco evidências.

Estes critérios significam elegibilidade para futuras oportunidades, não promessa de campanha, contratação ou remuneração.

## Privacidade e termos

`/termos` e `/privacidade` são rascunhos de desenvolvimento, explicitamente identificados como tal. Antes de uso público, a empresa deve aprovar juridicamente os textos, identificar o controlador e contato de privacidade, definir retenção, fornecedores e procedimentos para direitos dos titulares.

## Limitações conhecidas

- Não há credenciais Supabase incluídas; cadastro, login, envio de e-mail, persistência e RLS real só funcionam após configurar o projeto.
- Convites dependem de SMTP/Email Auth configurado e da chave service role guardada no servidor.
- Os valores de seguidores e visualizações são informados pelo criador; a aplicação não os verifica por API. A equipe valida manualmente.
- A imagem é decodificada, limitada e reencodada como WebP antes do Storage, mas não comprova a autenticidade da métrica mostrada.
- Não há campanhas, marcas, pagamentos ou remunerações nesta etapa.
- O teste de RLS local simula as superfícies `auth` e `storage`; execute a migration e os testes de integração em um Supabase de staging antes da publicação.
- A auditoria de dependências foi executada no workspace e está limpa na entrega atual; repita `npm audit` antes de cada deploy.
- A chave service role não foi configurada nem exercitada nesta máquina.
