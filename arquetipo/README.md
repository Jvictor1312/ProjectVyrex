# Arquétipo da Vyrex

Retrato completo do sistema em **2026-10-29** (commit `a3757ed` e seguintes): o que foi feito, o que existe, como funciona, como é testado, como está a acessibilidade e uma avaliação da arquitetura.

Tudo aqui foi conferido no código, no banco e nas telas nesta data. Quando algum documento antigo de `docs/` disser outra coisa, vale o que está nesta pasta (a lista dos documentos desatualizados está em [08-avaliacao-da-arquitetura.md](08-avaliacao-da-arquitetura.md)).

## Como ler

| # | Arquivo | Para quem | O que responde |
| --- | --- | --- | --- |
| 1 | [01-visao-geral.md](01-visao-geral.md) | todos | O que é a Vyrex, quem usa, com que tecnologia, em que ambientes |
| 2 | [02-o-que-foi-feito.md](02-o-que-foi-feito.md) | todos | Linha do tempo do projeto (97 commits, de 27 a 29/10/2026) |
| 3 | [03-telas-e-funcionalidades.md](03-telas-e-funcionalidades.md) | todos | Cada tela, quem acessa e o que dá para fazer nela |
| 4 | [04-como-funciona.md](04-como-funciona.md) | técnico | Camadas, login, banco, permissões, situações do cadastro, envio de prints |
| 5 | [05-testes.md](05-testes.md) | técnico | As 4 camadas de testes, os números de hoje e como rodar |
| 6 | [06-acessibilidade.md](06-acessibilidade.md) | todos | O que já atende, a auditoria feita hoje e o que falta |
| 7 | [07-seguranca.md](07-seguranca.md) | técnico | Todas as proteções em vigor e o que falta antes de publicar |
| 8 | [08-avaliacao-da-arquitetura.md](08-avaliacao-da-arquitetura.md) | todos | A arquitetura está boa? O que falta, em ordem de prioridade |

## Resumo em 30 segundos

- **O que é:** site onde criadores de conteúdo se cadastram e mostram o alcance dos seus Stories. A equipe da Vyrex confere, conversa com o criador e aprova ou não.
- **Quem usa:** criadores e uma equipe com quatro funções (administrador, recrutador, gestor de relacionamento e analista de validação).
- **Como é feito:** Next.js 16 (site) + Supabase (login, banco de dados e arquivos). As regras de quem pode o quê ficam **dentro do banco**, então nem uma chamada feita "por fora" do site consegue burlá-las.
- **Estado:** funcional e testado. Hoje passaram 61 testes de regras e banco, 85 testes de navegador (incluindo a auditoria de acessibilidade em 15 telas) e 10 de 10 etapas do fluxo completo; o GitHub repete as verificações a cada envio. **Ainda não foi publicado.** Faltam SMTP próprio (e-mails em português), a revisão jurídica dos termos e a troca das chaves.
- **Arquitetura:** sólida no que importa (segurança, regras no banco, testes). Dos 15 itens da avaliação, 13 foram resolvidos ou decididos em 29/10; os 2 restantes (limite de envio da hospedagem e regra de suspensão) dependem de decisões do dono. Detalhes no arquivo 8.

## Mapa de outros documentos

- `CLAUDE.md`: regras do dono do projeto (nunca apagar dados, como testar, como mostrar o trabalho).
- `docs/TASKS.md`: pendências do dia a dia.
- `docs/MAPA_DO_CODIGO.md`: mapa técnico arquivo por arquivo (de 28/10; as mudanças de 29/10 estão nesta pasta).
- `docs/PASSAGEM.md`: o que fica fora do GitHub e como obter.
