# 6. Acessibilidade

Meta: **WCAG 2.2, nível AA**, com regras extras de celular definidas pelo dono do projeto (a maioria dos usuários vem do celular).

## O que já está implementado

| Item | Como |
| --- | --- |
| Idioma | `<html lang="pt-BR">` |
| Um título principal por tela | conferido nas 16 telas auditadas |
| Rótulos nos campos | todos os campos visíveis têm `<label>` (51 no código) |
| Mensagens lidas pelo leitor de tela | 43 avisos com `role="status"` ou `role="alert"` (salvo, erro, enviando) |
| Página atual no menu | `aria-current` no menu do criador e no da equipe |
| Foco visível no teclado | contorno em 44 pontos do CSS; conferido com Tab em todas as telas |
| **Pular para o conteúdo** | primeiro item do Tab na home, na área do criador e na área da equipe (novo, 29/10) |
| Botões só com ícone | `aria-label` (50 no código), por exemplo "Abrir ficha de Fulano" |
| Seções recolhíveis | `<details>` nativo ou `aria-expanded` |
| Movimento | as órbitas da home e as transições param com `prefers-reduced-motion` |
| Contraste | textos secundários escurecidos (28/10); a auditoria de hoje não achou nenhum texto abaixo de 4,5:1 |
| Celular | campos com 16px (o iPhone não dá zoom), toques de 44px ou mais, nenhum texto abaixo de 12px, nenhuma rolagem lateral em 390 e 360 px |
| Imagens | logo com descrição ou marcado como decorativo; prints com texto alternativo |
| Confirmações | ações graves (desativar conta, decisão final) pedem confirmação dentro da página, não em janela do navegador |
| Erros | mensagens em português simples, sem código técnico |

## Auditoria de hoje (29/10/2026)

Feita com um verificador automático rodando dentro do Chrome em **16 telas** (públicas, criador e equipe, com as contas de teste), em **1440 px e 390 px**, e com um Tab em cada tela para ver para onde o foco vai.

Itens conferidos: idioma, título principal, saltos na ordem dos títulos, regiões (`main`, `nav`, `header`), imagens sem descrição, campos e botões sem nome, ids repetidos, `tabindex` positivo, texto menor que 12px, contraste (WCAG 1.4.3), alvos menores que 24px (WCAG 2.5.8), rolagem lateral, foco visível e link de pular.

### Encontrado e corrigido hoje (commit `a3757ed`)

| Problema | Onde | Correção |
| --- | --- | --- |
| Faltava "Pular para o conteúdo" | todas as telas com menu | link novo (`src/app/components/skip-link.tsx`) |
| **Campos sem moldura** e lista com 17px de altura (WCAG 1.4.11 e 2.5.8) | ficha do criador, formulários da equipe | moldura e 40px (44px no celular) |
| "Abrir ficha" com 21px de altura no celular | lista de cadastros | 44px de toque |
| Etiqueta "Equipe" com 11px | menu da equipe | 12px |

### Conferido e aceito (não são problemas)

- Os seletores de arquivo "sem nome" estão escondidos de propósito (`aria-hidden`, fora do Tab). Quem os aciona é um botão visível, com nome.
- As caixas de marcar com 16–22px têm o texto ao lado clicável, então a área de toque real é maior.
- Links dentro de frases ("Esqueci minha senha") ficam na exceção de texto corrido da WCAG 2.5.8.

### Ainda pendente

| Item | Impacto | Sugestão |
| --- | --- | --- |
| Erros de formulário não ficam ligados ao campo (`aria-describedby` e `aria-invalid` só existem no campo de senha) | médio: o leitor de tela anuncia o erro, mas não diz em qual campo está | ligar cada mensagem de campo ao seu `input` |
| Três textos com menos de 12px no computador: "© 2026 Vyrex", "Conheça a empresa" e "DOCUMENTO PRELIMINAR" | baixo | subir para 12px |
| Telas de login, cadastro e recuperação não têm link de pular | baixo: o menu dessas telas é só o logo | opcional |
| Teste com leitor de tela real (NVDA no Windows, VoiceOver no iPhone) | não feito | uma rodada manual antes de publicar |
| Modo escuro só na área da equipe; o site não segue o tema do sistema (`prefers-color-scheme`) | preferência, não exigência | decisão de produto |

## Como repetir a auditoria

O roteiro usado hoje ficou fora do projeto, na pasta temporária da sessão. Para tornar a auditoria permanente, a recomendação (capítulo 8) é acrescentar o `@axe-core/playwright` aos testes de navegador. Assim, cada `npm run test:e2e` também confere a acessibilidade.
