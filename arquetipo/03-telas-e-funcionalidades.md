# 3. Telas e funcionalidades

As 31 rotas do site, agrupadas por quem acessa. Todas têm versão para celular (até 760px).

## Públicas (sem login)

| Endereço | O que tem |
| --- | --- |
| `/` | Página inicial: título, órbitas animadas (param para quem pede menos movimento), "Como funciona" em 4 etapas, dúvidas frequentes, contato para marcas. Quem já entrou vê "Ir para o meu painel". |
| `/cadastro` | Criar conta: nome, e-mail, celular (opcional), senha forte com "mostrar/ocultar", aceite dos termos, vídeo de apresentação. |
| `/cadastro/confirmacao` | "Confira seu e-mail", com orientação sobre a caixa de spam. |
| `/login` | Entrar. Leva ao painel certo: equipe → `/interno`, criador → `/dashboard`. |
| `/recuperar-senha` | Pede e-mail **ou CPF**. A resposta é sempre a mesma, exista ou não a conta. |
| `/redefinir-senha` | Nova senha (chega pelo link do e-mail). |
| `/termos`, `/privacidade` | Rascunhos jurídicos (marcados como "documento preliminar"). |
| `/acesso-negado` | Página 403 (sem permissão). |
| qualquer endereço inexistente | Página 404. Erros inesperados mostram uma página 500 sem detalhes técnicos. |

Também existem `robots.txt` (buscadores não indexam as áreas com login), `manifest.webmanifest` (instalar na tela inicial do celular) e `icon.svg`.

## Área do criador (`/dashboard`, exige login)

Menu no topo (no celular, barra fixa embaixo): **Visão geral · Meu cadastro · Mensagens · Configurações · Sair**.

| Endereço | O que dá para fazer |
| --- | --- |
| `/dashboard` | Ver a situação do cadastro e o que ela significa, o próximo passo, a jornada em 5 etapas, as pendências das evidências, as últimas mensagens e avisos, e o histórico (recolhido). |
| `/dashboard/perfil` | **Meu cadastro**, em 4 etapas: (1) perfil, com salvamento automático; (2) redes sociais; (3) evidências: escolher vários prints de uma vez, informar data e visualizações de cada um, salvar todos com um botão, refazer os que falharem e apagar no rascunho; (4) revisão e envio, com a lista do que falta. Depois do envio dá para **desfazer**, enquanto a equipe não agir. |
| `/dashboard/mensagens` | Mensagens da equipe e avisos, com "marcar como lido". |
| `/dashboard/configuracoes` | Nome, telefone, CPF opcional, troca de senha (pede a atual) e privacidade: pedir cópia ou exclusão dos dados. |
| `/dashboard/notificacoes`, `/dashboard/privacidade` | Endereços antigos; redirecionam para as telas acima. |

O criador só pode editar com o cadastro em **incompleto** ou **correções solicitadas**. Depois que a equipe começa a análise, não altera mais nada.

## Área da equipe (`/interno`, exige login e função de equipe)

Menu lateral (no celular, abas no topo): **Operação** (Visão geral) e, só para o administrador, **Administração** (Colaboradores, Configurações, Pedidos de privacidade). Modo claro ou escuro.

| Endereço | Quem | O que dá para fazer |
| --- | --- | --- |
| `/interno` | toda a equipe | Painel que muda conforme a função. Administrador: indicadores (cadastrados, enviados, em análise, com correção, aprovados, tempo médio), carteira por responsável e redes declaradas. Todos: lista de cadastros com busca sem acento, filtros por situação, responsável e período, e 25 por página. O analista vê só a fila de análise, do mais antigo para o mais novo. |
| `/interno/[id]` | quem tem acesso àquele criador | **Ficha do criador:** dados, redes, prints em tamanho real, histórico, mensagens e contatos. Os controles aparecem conforme a função: triagem e encaminhamento (recrutador); contato, mensagem e pedido de correção (gestor); conferência de cada print e da rede e decisão final (analista); troca de responsáveis (administrador). |
| `/interno/equipe` | administrador | Colaboradores: lista com e-mail e último acesso, convite (ou função adicionada a uma conta que já existe), funções, ativar e desativar com motivo, e histórico agrupado. |
| `/interno/configuracoes` | administrador | Critérios de aprovação, com histórico, e o vídeo de apresentação, com barra de progresso no envio. |
| `/interno/privacidade` | administrador | Pedidos de privacidade dos titulares, para registrar a resolução. |

## Prévias (só em desenvolvimento, sem login)

`/preview/criador`, `/preview/criador/cadastro`, `/preview/criador/evidencias`, `/preview/criador/mensagens` (`?vazio=1` mostra o estado vazio), `/preview/equipe` e `/preview/equipe/colaboradores`. Usam os mesmos componentes das telas reais, com dados fictícios. Em produção, respondem 404.

## Avisos automáticos ao criador

O criador recebe um aviso na área de Mensagens quando a equipe manda mensagem, pede correções ou toma a decisão final (o título do aviso muda conforme a decisão). Por e-mail chegam só os do Supabase: confirmação de conta e recuperação de senha. Eles ainda estão em inglês, até haver SMTP próprio.
