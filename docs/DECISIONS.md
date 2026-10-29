# Decisões técnicas

Registro do **porquê** de cada escolha estrutural. O retrato completo do sistema está em [arquetipo/](../arquetipo/README.md).

| # | Data | Decisão | Motivo |
| --- | --- | --- | --- |
| 1 | 10/2026 | Regras de negócio e autorização em RLS + RPCs `security definer` | A interface não é barreira de segurança; chamadas feitas por fora do site não contornam as regras. |
| 2 | 10/2026 | Imagens de evidência refeitas em WebP no servidor (`sharp`) | Confere o conteúdo real, limita dimensões e remove metadados. |
| 3 | 10/2026 | Critérios de elegibilidade numa tabela de linha única, editável pelo admin, com auditoria | Mudar valores sem mexer no código. Hoje: 0 seguidores, 3 Stories obrigatórios, 1.000 visualizações, 7 dias. |
| 4 | 10/2026 | Situação do cadastro só muda por RPC, nunca por `update` direto | Histórico, auditoria e aviso na mesma transação. |
| 5 | 10/2026 | Painel interno único que se adapta à função (em vez de 4 painéis) | Menos duplicação; separar só se o produto pedir. |
| 6 | 10/2026 | Pedidos de privacidade como registro + RPCs | Canal rastreável para o titular, sem simular exportação ou exclusão automáticas, que dependem de decisão jurídica. |
| 7 | 10/2026 | Um pedido de privacidade ativo por tipo e titular | Evita pedidos repetidos. |
| 8 | 10/2026 | Páginas 403, 404 e erro com CSS próprio | Visual consistente sem depender de outras telas. |
| 9 | 10/2026 | Menu do criador como componente de cliente (`usePathname`) | Destaca a página atual (`aria-current`). |
| 10 | 28/10 | Projeto Supabase separado para testes que alteram dados | O banco real nunca recebe dados de teste nem perde dados. |
| 11 | 28/10 | Prévias (`/preview/*`) com os mesmos componentes das telas reais | Ver telas sem login e sem dados reais; só em desenvolvimento. |
| 12 | 29/10 | Limite de tentativas no banco (`consume_rate_limit`), com memória como reserva | Vale para todos os servidores; a chave é gravada resumida (SHA-256). |
| 13 | 29/10 | Política de conteúdo com nonce por página (`src/proxy.ts`) | Bloqueia scripts injetados. Custo aceito: todas as páginas são montadas a cada visita (`connection()` no layout raiz). |
| 14 | 29/10 | Registro de erros pelo `fetch` dos clientes Supabase e por `onRequestError` (`src/lib/log.ts`) | Um ponto só cobre ~40 lugares onde o erro virava mensagem neutra. Sem dados pessoais nos registros. |
| 15 | 29/10 | Tipos do banco gerados (`database.types.ts`, `scripts/gen-db-types.ps1`) | O TypeScript confere tabelas, colunas e parâmetros das RPCs. |
| 16 | 29/10 | Filtro "Responsável" do painel dentro do banco (`creator_queue`, security invoker) | A consulta não cresce com a base; a RLS continua valendo. |
| 17 | 29/10 | Migrations registradas em `supabase_migrations.schema_migrations` e aplicadas por `scripts/migrations.ps1` | Saber o que está aplicado em cada banco; migration e registro na mesma transação. |
| 18 | 29/10 | `layout.tsx` só na área do criador | A moldura do criador não depende de dados. A da equipe depende das funções e permissões que cada página já confere; um layout dobraria consultas para pouco ganho. |
| 19 | 29/10 | Tailwind mantido apenas como reset base (preflight); visual em CSS próprio | Nenhuma classe utilitária é usada; tirá-lo mudaria o visual de todas as telas. Não usar classes utilitárias novas sem decidir antes. |
| 21 | 29/10 | Suspensão só por administrador, só de cadastros aprovados, com motivo; reativar volta para aprovado | Tira alguém da base sem apagar nada; regra simples e reversível (decidida pelo Claude com aval do dono, pode mudar). |
| 20 | 29/10 | Login, cadastro e senha enviam pelo `onSubmit` (com `action` como reserva) | O React limpa o formulário quando o envio vem do `action`; assim o que foi digitado não se perde quando o servidor recusa. |
