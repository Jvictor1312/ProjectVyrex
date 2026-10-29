# 8. Avaliação da arquitetura

Avaliação feita em 29/10/2026, lendo o código e o banco, medindo os arquivos e rodando todas as verificações (capítulo 5).

## Veredito

**A arquitetura é boa e adequada ao tamanho do produto.** O mais difícil de corrigir depois, que é a segurança e onde moram as regras, foi feito do jeito certo desde o início: as regras ficam no banco, que barra até chamadas feitas por fora do site, e há testes que provam isso. O site é simples de seguir: cada tela busca os seus dados numa rodada só, e os formulários seguem sempre o mesmo caminho.

O que falta **não é de base**. São três grupos:
1. **Operação:** ninguém fica sabendo quando algo dá errado em produção, os testes não rodam sozinhos no GitHub e não há cópia de segurança própria do banco.
2. **Organização:** documentos antigos desatualizados, código sem uso e o CSS concentrado num arquivo grande.
3. **Preparação para crescer:** tipos do banco gerados automaticamente, o filtro por responsável e o limite de tamanho de envio na hospedagem.

## Situação dos itens (atualizado em 29/10, depois da segunda rodada)

| Item | Situação | Onde |
| --- | --- | --- |
| A1 Registro de erros | **feito** | `src/lib/log.ts`, `src/instrumentation.ts` (falta ligar a um serviço de alertas: depende de conta) |
| A2 CI no GitHub | **feito** | `.github/workflows/verificacoes.yml` |
| A3 Cópia de segurança | **ferramenta pronta, primeira cópia feita** | `scripts/backup-db.ps1` (onde guardar e com que frequência: decisão do dono) |
| A4 Limite de tamanho na hospedagem | **depende da escolha da hospedagem** | ver texto abaixo |
| M1 Tipos gerados do banco | **feito** | `src/lib/supabase/database.types.ts`, `scripts/gen-db-types.ps1` |
| M2 Layouts nas áreas logadas | **feito na área do criador**; equipe mantida por página (decisão 18 em `docs/DECISIONS.md`) | `src/app/dashboard/layout.tsx` |
| M3 Filtro "Responsável" no banco | **feito** | migration `202610290003`, `creator_queue` |
| M4 Custo do nonce | **feito** (vídeo do cadastro em cache) | `src/lib/site-media.ts` |
| M5 Acessibilidade nos testes e erros ligados aos campos | **feito** | `tests/e2e/accessibility.spec.ts`, `FormFeedback` |
| M6 Controle das migrations | **feito** | `supabase_migrations.schema_migrations`, `scripts/migrations.ps1` |
| B1 Código sem uso | **feito** (`seed:local-users` mantido: tem teste e está no README) | |
| B2 Textos de auditoria | **feito** | `src/lib/audit-labels.ts` |
| B3 Tailwind e `globals.css` | **decidido: manter o Tailwind** como reset base (decisão 19); dividir o `globals.css` fica para quando cada tela for mexida | |
| B4 Situação `suspended` | **depende do produto**: suspender cadastro é uma regra nova (quem pode, com que motivo, o que o criador vê) | |
| B5 Documentos antigos | **feito** | `docs/ARCHITECTURE.md`, `SECURITY.md`, `TESTING.md`, `DECISIONS.md` reescritos; `QA_REPORT.txt` em `docs/historico/` |

Com isso, as áreas "Operação" e "Testes" sobem de nível: há registro de erros, CI, cópia de segurança e auditoria de acessibilidade automática. A tabela abaixo é a avaliação original, mantida para referência.

## Avaliação por área (original, antes da segunda rodada)

| Área | Situação | Comentário |
| --- | --- | --- |
| Segurança e permissões | **Forte** | RLS em todas as tabelas; mudanças de estado só por funções do banco; chave de serviço isolada; nonce nos scripts; limite de tentativas compartilhado; respostas neutras. Os testes do banco provam o isolamento entre funções. |
| Regras de negócio | **Forte** | Máquina de estados no banco, com histórico, auditoria e aviso na mesma transação. Critérios editáveis sem mexer no código. |
| Modelo de dados | **Bom** | 21 tabelas coerentes; histórico preservado (revogar ≠ apagar); pronto para receber marcas e campanhas. A situação `suspended` existe sem função que a aplique. |
| Testes | **Bom** | 4 camadas (banco, unidade, navegador, fluxo completo) e um projeto Supabase separado para testes que alteram dados. Faltam CI e a auditoria de acessibilidade dentro da suíte. |
| Desempenho | **Bom** | Uma rodada por tela, contagens e relatórios somados no banco, conexões reaproveitadas, paginação de 25. Com a política de nonce, todas as páginas passaram a ser montadas a cada visita (ver item M4). |
| Organização do código | **Adequada** | Pastas claras, vocabulário único (`labels.ts`), padrões repetidos em todas as telas. Pontos fracos: sem tipos gerados do banco, sem `layout.tsx` nas áreas logadas e um pouco de código sem uso. |
| Estilos | **Adequada** | Visual consistente, mas há duas abordagens: `globals.css` com 2.757 linhas (público e criador) e CSS Modules (equipe). O Tailwind está instalado e importado, mas quase não é usado. |
| Acessibilidade | **Boa** | Ver capítulo 6. Falta ligar os erros de formulário aos campos. |
| Operação e monitoramento | **Fraca** | Nenhum registro de erros no servidor (0 `console.error` em `src/`), nenhum serviço de alerta e nenhum CI. Em produção, um erro só seria descoberto se um usuário reclamasse. |
| Documentação | **Boa, com partes velhas** | `MAPA_DO_CODIGO`, `PASSAGEM`, `TASKS` e este arquétipo estão em dia; quatro documentos antigos contradizem o código (lista no fim). |

## O que falta, por prioridade

### Alta: antes de publicar

**A1. Registro de erros no servidor.**
Hoje, quando uma Server Action ou uma página falha, o usuário vê uma mensagem neutra, o que está certo, mas o erro **não é registrado em lugar nenhum**. Em produção ninguém saberia que o envio de prints está falhando, por exemplo.
*Sugestão:* uma função `logServerError(contexto, erro)` em `src/lib/` chamada nos pontos onde hoje o erro vira mensagem neutra. Depois, um serviço de alertas como o Sentry, que tem plano gratuito. Sem dados pessoais nos registros.

**A2. Testes rodando sozinhos no GitHub (CI).**
`typecheck`, `lint`, `npm test` e `build` não precisam de nenhuma senha e podem rodar a cada `push` com GitHub Actions. Assim, um erro não chega à `main` sem ninguém ver.
*Esforço:* um arquivo `.github/workflows/verificacoes.yml`. Os testes de navegador continuam locais, porque precisam das contas.

**A3. Cópia de segurança do banco.**
A regra do dono é nunca perder dados, mas no plano gratuito do Supabase as cópias automáticas são limitadas (confira em *Database → Backups* no painel). Um `pg_dump` periódico, guardado fora do Supabase, protege contra erro humano e contra problemas na conta.
*Depende do dono:* onde guardar e com que frequência.

**A4. Limite de tamanho na hospedagem escolhida.**
Os prints (até 8 MB) passam pelo servidor do Next, porque o `sharp` precisa deles ali, e o limite das Server Actions é 10 MB. Algumas hospedagens têm limite menor por requisição: na Vercel, por exemplo, são 4,5 MB, e prints maiores falhariam.
*Antes de escolher a hospedagem:* confirmar o limite ou reduzir o máximo do print. Outra saída é o navegador enviar direto ao Storage e o servidor processar depois.

### Média: próximas semanas

**M1. Tipos gerados do banco.**
O código não usa os tipos do Supabase (`supabase gen types typescript`). Por isso há conversões manuais (`as string`, `Array.isArray(x) ? x[0] : x`) e, se uma coluna mudar de nome, o TypeScript não avisa.
*Sugestão:* gerar `src/lib/supabase/database.types.ts` e passar `<Database>` aos clientes. O compilador passa a conferir cada consulta.

**M2. Layouts nas áreas logadas.**
Não existe `layout.tsx` em `dashboard/` nem em `interno/`: cada página monta a moldura (`CreatorShell`, `InternalShell`) e refaz a leitura do usuário. Com um layout por área, o menu não é refeito a cada clique, e a moldura e o link de pular ficam num lugar só.
*Cuidado:* o layout não substitui a conferência de login em cada página, porque layouts não rodam de novo em toda navegação. Mudança média, que precisa dos testes de navegador.

**M3. Filtro "Responsável" escalável.**
Em `/interno`, o filtro busca todos os ids atribuídos e os coloca no endereço da consulta. Com milhares de cadastros, a consulta fica grande demais. A solução é uma função no banco (ou um `join`) que filtre lá dentro, como já é feito com o resumo do painel.

**M4. Custo do nonce em todas as páginas.**
Para os scripts levarem o código de cada visita, o layout raiz chama `connection()`, e **todas** as páginas passaram a ser montadas a cada visita. `/cadastro` deixou de ser gerada com antecedência (o `revalidate = 300` dela ficou sem efeito) e agora consulta o vídeo a cada visita. Hoje o custo é pequeno. Se o tráfego público crescer, dá para guardar a URL do vídeo em cache (`"use cache"`) ou avaliar uma política por *hash* nas páginas públicas.

**M5. Acessibilidade automática nos testes.**
Acrescentar `@axe-core/playwright` aos testes de `tests/e2e/`, para a auditoria do capítulo 6 rodar sempre, e ligar os erros de formulário aos campos (`aria-describedby` e `aria-invalid`).

**M6. Controle de quais migrations foram aplicadas.**
Não existe a tabela `supabase_migrations.schema_migrations`: as migrations são aplicadas pela Management API e anotadas à mão no `CLAUDE.md`. Com dois projetos (real e testes), é fácil um ficar diferente do outro. *Sugestão:* registrar cada migration aplicada numa tabela, ou usar `supabase migration repair` e passar a aplicar com `supabase db push`.

### Baixa: limpeza

**B1. Código sem uso.**
`InfoHelp` (`components/info-help.tsx`), `maskPhone` (`lib/validation/phone.ts`), a função `recovery_phone_hint` do banco (fica, mas pode ser marcada como obsoleta, nunca apagada sem autorização) e o script `seed:local-users`.

**B2. Textos de auditoria que faltam.**
`lib/audit-labels.ts` não tem texto para `creator.application.withdrawn`, `creator.evidence.removed`, `user.cpf.changed` e `creator.social_account.verification_reset`. Essas ações aparecem como "Ação administrativa" genérica.

**B3. Estilos.**
Decidir entre remover o Tailwind (instalado e importado, mas sem uso real) ou adotá-lo, e ir dividindo o `globals.css` (2.757 linhas) em módulos por área, como já é feito na área da equipe.

**B4. Situação `suspended`.**
Ou criar a função que suspende (com motivo, histórico e aviso), ou documentar que ela fica reservada.

**B5. Documentos desatualizados.**
Atualizar ou marcar como históricos:

| Documento | O que está errado |
| --- | --- |
| `docs/ARCHITECTURE.md` | migrations só até `202610150003`; não cita `proxy`, `site_settings`, `user_documents`, `rate_limit_counters` nem `site-media` |
| `docs/SECURITY.md` (primeira parte) | diz que não há limite de tentativas nem cabeçalhos; cita `getUser()` e links de 60 s |
| `docs/TESTING.md` | diz que não há Playwright e que os testes "não foram executados" |
| `docs/DECISIONS.md` nº 3 | critérios antigos (3.000 / 5 / 2.000) |
| `QA_REPORT.txt` (raiz; movido para `docs/historico/`) | relatório de 14/10, anterior a quase tudo |
| `docs/MAPA_DO_CODIGO.md` | ainda cita o limite em memória e a CSP com `'unsafe-inline'` (mudados em 29/10) |

## O que NÃO precisa mudar

- **Next.js + Supabase:** a combinação é adequada; trocar não traria ganho.
- **Regras no banco:** é o ponto mais forte do projeto; manter.
- **Painel único da equipe que se adapta à função:** evita quatro telas quase iguais. Separar só se o produto pedir.
- **Prévias com os mesmos componentes das telas reais:** bom padrão, que permite ver telas sem login e sem dados reais.
- **Projeto Supabase separado para testes que alteram dados:** protege o banco real; manter.

## Ordem sugerida

1. A1 (registro de erros) e A2 (CI): sem custo e sem risco, protegem tudo o que vem depois.
2. B5 (documentos) e B2 (textos de auditoria): rápidos.
3. M1 (tipos do banco) e M5 (acessibilidade nos testes).
4. A3 e A4, quando houver decisão sobre backup e hospedagem.
5. M2, M3, M6 e o restante, conforme a base crescer.
