# 2. O que foi feito

Linha do tempo tirada do histórico do git (97 commits). O detalhe de cada mudança está em `git log`; aqui ficam os marcos, agrupados por tema.

## Antes de 27/10 — base do sistema

- Esquema do banco completo (migration `202610140001`): contas, funções e permissões, cadastro do criador, redes, evidências, responsáveis, histórico, mensagens, avisos, critérios, auditoria e o bucket privado dos prints.
- Pedidos de privacidade (LGPD), edição de rede que zera a verificação, bloqueio de envio sem nome público e os critérios novos (0 seguidores e 1.000 visualizações).
- Relatório de QA inicial (`QA_REPORT.txt`, 14/10).

## 27/10 — organização e primeira rodada de correções

- Projeto entra no GitHub; skills do assistente, `CLAUDE.md` e diretrizes.
- Next.js atualizado para 16.4.3.
- **Correções:** cadastro duplicado, navegação lenta, barra do cadastro, envio de prints.
- **Velocidade:** as telas passam a fazer **uma rodada só até o banco** (consultas em paralelo), na área do criador e na da equipe.
- **Visual:** home nova com o "átomo" animado, padrão visual único em login e recuperação, área da equipe com modo escuro opcional.
- **Regras:** só os 3 primeiros Stories são obrigatórios; celular opcional no cadastro.
- Vídeo de apresentação na tela de cadastro; contato para marcas sem expor o e-mail.

## 28/10 — segurança, equipe, celular e testes

- **Revisão completa de segurança:** permissões do banco fechadas, senhas fortes, limite de tentativas, cabeçalhos de segurança, sessão renovada no servidor, respostas que não revelam se uma conta existe.
- **Área da equipe reformulada:** visão geral, colaboradores (convite, funções, desativação com confirmação), configurações, privacidade, histórico administrativo agrupado; ficha do criador legível; busca por nome e filtros.
- **Área do criador:** menu fixo, vários prints de uma vez com "Tentar enviar de novo", desfazer envio, apagar evidência no rascunho, visão geral em duas colunas com a jornada do cadastro.
- **Conta:** quem já entrou continua logado; CPF opcional e recuperação de senha por CPF ou e-mail.
- **Marca:** logo oficial em SVG; fonte Figtree servida pelo próprio site.
- **Celular primeiro:** todas as telas adaptadas (campos de 16px, toques de 44px, menu do criador embaixo).
- **Acessibilidade:** contraste dos textos secundários corrigido.
- **Testes:** Playwright com contas de teste fora do código (55 de 55); projeto Supabase só de testes e fluxo completo do cadastro (10 de 10).
- **Documentação:** guia de passagem e mapa do código.

## 29/10 — refinamento, desempenho e segurança final

- Histórico mostra **qual Story** foi aprovado ou recusado (antes as linhas pareciam repetidas).
- Visual de "Meu cadastro" e "Mensagens" refinado.
- **Desempenho:** conexões com o Supabase ficam abertas por até 60 s (consulta após pausa: de ~330 ms para ~200 ms).
- **Busca sem acento** ("joao" acha "João") e resumo do painel somado no banco (migration `202610290001`).
- Visão geral do criador explica cada situação do cadastro.
- **Limite de tentativas compartilhado no banco** (migration `202610290002`): vale para todos os servidores ao mesmo tempo.
- **Política de conteúdo com nonce** (commit `0dbcc96`): o navegador só roda scripts que o próprio site marcou naquela visita. HTML injetado com código é bloqueado (conferido no build de produção).
- **Acessibilidade** (commit `a3757ed`): link "Pular para o conteúdo"; campos da ficha do criador com moldura e altura adequada; "Abrir ficha" com toque de 44px no celular.
- Este arquétipo.
