# Decisões técnicas

| # | Decisão | Motivo |
| --- | --- | --- |
| 1 | Regras de negócio e autorização em RLS + RPCs `security definer` | A interface não é barreira de segurança; requisições manuais não contornam regras. |
| 2 | Imagens de evidência reencodadas em WebP no servidor (`sharp`) | Valida conteúdo real, limita dimensões e remove metadados. |
| 3 | Critérios de elegibilidade em tabela singleton editável por admin, com auditoria | Valores (3.000 / 5 / 2.000 / idade máx.) configuráveis sem reescrever código. |
| 4 | Estados do cadastro controlados por RPC, não por `update` direto | Garante histórico e transações consistentes. |
| 5 | Painel interno único e adaptável ao papel (em vez de 4 painéis) | Menos duplicação na primeira versão; separar por função é uma pendência de produto. |
| 6 | Solicitações de privacidade como registro + RPCs (migration 2) | Dá ao titular um canal rastreável sem simular exportação/eliminação automática, que dependem de decisão jurídica/operacional. |
| 7 | Um pedido ativo por tipo e titular (índice único parcial) | Evita enchente de pedidos repetidos. |
| 8 | Páginas 403/404/erro com CSS Module próprio | Consistência visual sem depender de componentes de página específicos. |
| 9 | Navegação do criador como componente cliente (`usePathname`) incluído em cada página | Permite destacar a página atual (`aria-current`) mantendo o cabeçalho existente de cada página. |
