# Testes

## Como executar (na máquina de desenvolvimento)

```powershell
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

`npm test` executa, com o runner nativo do Node: `supabase/tests/initial-platform.test.mjs`, `supabase/tests/data-requests.test.mjs` e `tests/validation.test.mjs`.

## Cobertura atual

- Migration inicial, RLS, RPCs de decisão/atribuição/papéis/critérios, cota de upload, desativação de conta (22 testes na entrega de 2026-10-14, 26 em 2026-10-15).
- Migration de privacidade: criação, duplicidade, tipo inválido, escrita direta negada, isolamento entre usuários, resolução somente por admin, justificativa obrigatória, encerramento definitivo (`data-requests.test.mjs`, 4 testes).
- Correção de rede social verificada pelo titular: a verificação anterior é removida e o reset fica auditado (`initial-platform.test.mjs`, adicionado nesta sessão; ainda não executado).
- Submissão sem nome público é bloqueada pelo banco (`202610150003_submission_profile_name.sql`; teste PGlite adicionado, ainda não executado).
- Categorias de conteúdo: lista da especificação aceita e valor fora da lista recusado (`validation.test.mjs`, adicionado nesta sessão; ainda não executado).
- Senhas: mínimo de 11 caracteres, letra maiúscula, minúscula e caractere especial, também na redefinição.
- Revisão de critérios dinâmicos, resumo pré-envio e gating visual por estado: diagnósticos do editor sem erros; falta typecheck e teste de interface/comportamento.
- Cadastro: wizard, ajuda contextual, salvamento automático do perfil e upload com prévia; a tela `/cadastro` foi vista no navegador em desktop e celular, incluindo o diálogo da esfera e a alternância de visibilidade da senha. Testes automatizados continuam pendentes.
- Schemas de validação, normalização de imagem e redirecionamento de callback.
- Política de senha: mínimo de 11 caracteres, maiúscula, minúscula e caractere especial (`validation.test.mjs`; testes adicionados/atualizados nesta alteração).

## Estado da verificação (2026-10-15, sessão 2)

| Item                                                                            | Resultado                                                                                                                            |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Migrations 1 + 2 aplicadas em PostgreSQL 16 real com stubs de `auth`/`storage`  | OK; 13 verificações de comportamento passaram (script de apoio, fora do repositório; migration 3 ainda não incluída nessa validação) |
| Sintaxe de todos os `.ts`/`.tsx` (TS 6.0.3, erros TS1xxx)                       | 0 erros                                                                                                                              |
| `node --check` do novo arquivo de teste                                         | OK                                                                                                                                   |
| `npm run typecheck`, `lint`, `build`, `npm test` com as alterações desta sessão | **NÃO executados** (o ambiente da sessão não alcançou o registro do npm)                                                             |

Na sessão 3/4, os testes focados do PGlite e de validação não puderam ser iniciados pelo executor porque `node` não está disponível nele. O navegador compartilhado já servia `http://localhost:3000`; o comando para iniciar o servidor pelo executor falhou porque ele não acessa o diretório Windows do projeto.

## Lacunas

- Sem testes ponta a ponta (Playwright) nem testes de componentes React.
- Sem teste contra um projeto Supabase real (Auth, e-mail, Storage, URLs assinadas).
- Fluxos novos de UI (privacidade, configurações, 403/404/erro) só têm verificação de sintaxe; faltam inspeção visual e teste manual.
