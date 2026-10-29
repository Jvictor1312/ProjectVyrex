# 1. Visão geral

## O produto

A Vyrex é uma agência de marketing de influência. O site faz a **entrada de criadores** na base da agência:

1. O criador cria a conta (gratuita), preenche o perfil e informa as redes sociais.
2. Envia prints de **3 Stories** (até 5), com a data e as visualizações de cada um.
3. Envia o cadastro para análise.
4. A equipe confere: o recrutador faz a triagem, o analista confere cada print e a rede, e o gestor de relacionamento conversa com o criador.
5. O analista decide: aprovado, não aprovado ou correções solicitadas.
6. Aprovado, o criador entra na base que a Vyrex considera ao montar campanhas com marcas. A aprovação não garante campanha.

Ainda **não existe**: área para marcas, campanhas, contratos e pagamentos. É a evolução prevista, e o banco foi pensado para recebê-la sem refazer o que existe.

## Quem usa

| Pessoa | Função no sistema | O que faz |
| --- | --- | --- |
| Criador de conteúdo | `influencer` | Cadastra perfil, redes e prints; acompanha a análise; lê mensagens |
| Administrador | `admin` | Tudo: vê todos os cadastros, define responsáveis, gerencia a equipe, critérios, vídeo e pedidos de privacidade |
| Recrutador | `recruiter` | Vê os criadores atribuídos a ele, anota a triagem, encaminha para validação |
| Gestor de relacionamento | `relationship_manager` | Vê os seus criadores, registra contatos, manda mensagens, pede correções |
| Analista de validação | `validator` | Vê a fila de análise, confere cada print e rede, decide |

Uma pessoa pode ter mais de uma função. **Toda conta nova nasce como criador**; quem é da equipe recebe a função pelo administrador.

## Critérios atuais (no banco, editáveis pelo administrador)

| Critério | Valor |
| --- | --- |
| Seguidores mínimos | 0 |
| Stories obrigatórios | 3 (posições 1 a 3; a 4ª e a 5ª são opcionais) |
| Visualizações mínimas por Story | 1.000 |
| Idade máxima do Story | 7 dias |
| Tamanho máximo do print | 8 MB (JPEG, PNG ou WebP) |

## Tecnologia

| Peça | O que é | Para que serve aqui |
| --- | --- | --- |
| **Next.js 16** (App Router) | Framework de sites em React | Monta as telas no servidor e recebe os formulários |
| **React 19** | Biblioteca de interface | Partes interativas (formulários, quadro de prints) |
| **TypeScript** (modo estrito) | JavaScript com tipos | Pega erros antes de rodar |
| **Supabase** | Serviço com login, banco Postgres e arquivos | Contas, dados e prints |
| **Zod** | Validação | Confere tudo o que chega dos formulários |
| **sharp** | Processamento de imagem | Refaz cada print em WebP limpo |
| **CSS próprio** | `globals.css` + CSS Modules | Visual preto e branco e minimalista (o Tailwind está instalado, mas não é usado nas telas) |
| **Playwright** e **PGlite** | Ferramentas de teste | Navegador automático e Postgres de teste na memória |

## Números do projeto (29/10/2026)

| Item | Quantidade |
| --- | --- |
| Commits | 110 |
| Linhas de código em `src/` (TS, TSX) | ~9.800 |
| Linhas de SQL nas migrations | ~2.200 (16 migrations) |
| Rotas (telas e endereços) | 31 |
| Tabelas no banco | 21 |
| Testes automáticos | 61 (regras, banco e registro) + 43 de navegador × 2 aparelhos (15 telas com auditoria de acessibilidade) + 10 etapas de fluxo |

## Ambientes

| | Real | Testes | Produção |
| --- | --- | --- | --- |
| Endereço | `localhost:3000` | `localhost:3001` | não publicado |
| Banco Supabase | `zofxrohoilwjtzbcruse` | `ukwnnrrqmrvfwtbjjrbi` ("Vyrex Testes") | — |
| Pode alterar dados? | **Não** (só leitura; nunca apagar) | Sim | — |
| Como ligar | `npm run dev` (o VS Code liga sozinho) | `scripts\dev-test.ps1` | — |

Para conferir um build de produção sem publicar: `$env:NEXT_DIST_DIR=".next-prod"; npm run build`, e depois `npx next start -p 3002` com a mesma variável.
