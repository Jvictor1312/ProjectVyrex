# Verificação das métricas do Instagram

Escrito em 2026-10-31. Dois caminhos, ambos **opcionais** para o criador e sem mudar o envio nem a aprovação do cadastro:

1. **Conexão oficial pela API da Meta** ("Instagram API with Instagram Login").
2. **Gravação de tela** enviada pelo criador e conferida pela equipe de validação.

## 1. O que a API oficial permite hoje (documentação conferida em 2026-10-31)

Fontes: [Business Login for Instagram](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login), [Get started](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started), [Insights](https://developers.facebook.com/docs/instagram-platform/insights), [IG Media Insights](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights), [IG User Insights](https://developers.facebook.com/documentation/instagram-platform/api-reference/instagram-user/insights.md), [IG User Stories](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/stories/), [Overview](https://developers.facebook.com/docs/instagram-platform/overview), [App Review](https://developers.facebook.com/documentation/instagram-platform/app-review.md).

| Dado | Como a Vyrex consulta | Limites informados pela Meta |
| --- | --- | --- |
| Seguidores, @, tipo de conta, nº de publicações | `GET /me?fields=user_id,username,account_type,followers_count,media_count` | Só contas **profissionais** (comercial ou de criador de conteúdo) |
| Visualizações e alcance da conta | `GET /<IG_ID>/insights?metric=views` e `reach`, `period=day`, `metric_type=total_value`, últimos 28 dias | Podem atrasar até 48 h; sem dado, a API devolve vazio (não zero). `impressions` foi descontinuada (v22+), por isso não é usada |
| Stories no ar e suas métricas | `GET /<IG_ID>/stories` e `GET /<STORY_ID>/insights?metric=reach` e `views` | **Só durante as 24 h em que o Story está no ar.** Menos de 5 espectadores dá o erro 10 ("Not enough viewers"). `views` aparece como "em desenvolvimento" na documentação |

Pontos importantes:

- **Contas pessoais não funcionam pela API.** Para elas, só a gravação de tela.
- A documentação da lista de Stories (`/stories`) só mostra exemplos com login do Facebook; para o login do Instagram ela não confirma nem nega. A Vyrex tenta e, se a Meta recusar, mostra "Indisponível" com o motivo. **Só um teste real com o app configurado vai dizer se funciona.**
- Os Stories antigos usados como evidência (até 7 dias) **não podem** ser conferidos pela API depois das 24 h. Por isso os prints e a gravação continuam necessários.
- Webhooks de métricas de Stories não existem no login do Instagram (só no login do Facebook).

## 2. Permissões e requisitos da Meta

- Permissões pedidas: `instagram_business_basic` e `instagram_business_manage_insights`. A Vyrex não pede publicação, mensagens nem comentários.
- App do tipo **Business** em Meta for Developers, com o produto Instagram e a "API setup with Instagram login".
- **Standard Access** (padrão): funciona só para contas do Instagram adicionadas ao app como testadoras. Serve para testar.
- **Advanced Access** (necessário para qualquer criador): exige **App Review** e **Business Verification** (verificação da empresa). No App Review: ícone 1024×1024, URL da política de privacidade, categoria, e-mail comercial, instruções de teste, um vídeo (screencast) por permissão e pelo menos uma chamada bem-sucedida de cada permissão.
- Token longo vale **60 dias**; a Vyrex renova a cada atualização feita depois de 24 h. Sem uso por 60 dias, o criador precisa conectar de novo.

## 3. O que depende de você (passo a passo)

Nada abaixo foi feito pela Vyrex: são contas e configurações suas.

1. Entre em <https://developers.facebook.com/apps> com a conta do Facebook da empresa e clique em **Criar app**. Escolha o tipo **Business** (Empresa).
2. No painel do app, adicione o produto **Instagram** e abra **Instagram > API setup with Instagram login**.
3. Anote o **Instagram app ID** e o **Instagram app secret** dessa tela (não são os do app do Facebook).
4. Em **3. Set up Instagram business login > Business login settings**, preencha:
   - **OAuth redirect URIs:** `https://SEU-DOMINIO/api/instagram/callback` (para testar no computador: `http://localhost:3000/api/instagram/callback`, se a Meta aceitar `localhost`; se não aceitar, só dá para testar com o site publicado em HTTPS).
   - **Deauthorize callback URL:** `https://SEU-DOMINIO/api/instagram/deauthorize`
   - **Data deletion request URL:** `https://SEU-DOMINIO/api/instagram/data-deletion`
5. Em **Funções do app > Funções**, adicione as contas de teste do Instagram como **Instagram Tester** e aceite o convite no Instagram (Configurações > Apps e sites > Convites de teste). As contas precisam ser profissionais.
6. Gere a chave que cifra os tokens: no terminal do VS Code, `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
7. Coloque no `.env.local` (nunca no git, nunca com `NEXT_PUBLIC_`): `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_TOKEN_ENCRYPTION_KEY` e, se o endereço de retorno for diferente de `NEXT_PUBLIC_SITE_URL/api/instagram/callback`, `INSTAGRAM_REDIRECT_URI`. Reinicie o servidor.
8. Autorize a aplicação da migration `202610310001_instagram_metric_verification.sql`: primeiro no projeto de testes (`scripts\migrations.ps1 -Banco testes -Aplicar` e `npm run test:flows`), depois no real, e então `scripts\gen-db-types.ps1`.
9. Teste com uma conta testadora: Meu cadastro > Redes sociais > **Conectar com o Instagram**.
10. Para abrir a todos os criadores: complete a **Business Verification** (Configurações da empresa no Meta Business) e envie o **App Review** pedindo Advanced Access para as duas permissões (Instagram > API setup > Complete app review). Precisa do site publicado e da política de privacidade citando o Instagram.

Até lá, a tela mostra "A conexão com o Instagram ainda não está disponível" e oferece a gravação de tela.

## 4. Como foi encaixado na arquitetura

- **Banco** (migration `202610310001`, aditiva): `instagram_connections` (sem token), `instagram_tokens` (token cifrado, **nenhuma** permissão para o navegador; só o servidor com a chave de serviço), `instagram_metric_snapshots` (cada consulta é um registro; métrica sem dado fica nula com o motivo em `unavailable`), `metric_recordings` (uma gravação por criador), bucket privado `metric-recordings` (50 MB, MP4/MOV), RPCs `save_creator_metric_recording` (só o servidor executa, para o criador da sessão) e `review_metric_recording`, ações novas no histórico (`recording_approved`, `recording_rejected`). Leitura: o próprio criador e a equipe com `can_access_creator`. Uma conta do Instagram só fica ligada a um criador por vez.
- **Servidor:** `src/lib/instagram/graph.ts` (chamadas à Meta, sem token em erros ou logs), `service.ts` (troca de código, token longo, renovação, reconexão, desconexão, revogação), `token-crypto.ts` (AES-256-GCM), `signed-request.ts` (assinatura dos avisos da Meta). Rotas `src/app/api/instagram/{connect,callback,deauthorize,data-deletion}`. O `state` da autorização vai num cookie `httpOnly` de 10 minutos ligado ao usuário logado.
- **Gravação:** o navegador confere tipo, tamanho e duração e envia direto ao Storage (com barra de progresso); o servidor baixa o arquivo, confere que é MP4/MOV de verdade, lê a duração (10 s a 3 min) e só então registra. Se algo não bater, o arquivo enviado é removido.
- **Telas:** "Meu cadastro", etapa Redes sociais (`#metricas`); ficha do criador na equipe, seção "Verificação das métricas" (métricas com origem, comparação com o número informado, alerta se o @ conectado for diferente do declarado, vídeo e aprovação/recusa da gravação pela validação). Prévia: `/preview/criador/cadastro?verificacao=conectado` (ou `vazio`, `indisponivel`).
- **Origem sempre visível:** "Verificado pela API do Instagram", "Informado pelo criador" e "Gravação de tela". Métrica indisponível aparece como "Indisponível" com o motivo, nunca como número.

## 5. Estado e pendências

- [x] Código, migration, 7 testes PGlite e 10 unitários (cifra, assinatura, cliente da API com respostas simuladas, duração do vídeo).
- [ ] **Migration não aplicada** em nenhum banco (aguarda sua autorização). Os tipos dela foram acrescentados à mão em `database.types.ts`. Até aplicar, o bloco aparece com "Não foi possível carregar a verificação" na tela real.
- [ ] **Integração real não testada:** depende do app na Meta (seção 3). Nada foi simulado como funcionando.
- [ ] Avisos da Meta (remoção do app, exclusão de dados) revogam a conexão e apagam o token. As métricas já consultadas seguem o processo de privacidade da Vyrex (pedido tratado pela equipe); ajuste a política de privacidade para citar isso antes do App Review.
- [x] Registro da gravação só pelo servidor: `save_creator_metric_recording` não é executável por visitantes nem por usuários logados; o servidor confere o vídeo e passa o criador da sessão. Testado no PGlite.
- [x] Sem a migration, as telas mostram "verificação ainda não disponível" (código PGRST205 tratado como estado próprio, com aviso no log nomeando a migration; outros erros continuam como erro).
- [ ] O registro de gravações e a conexão com o Instagram dependem de `SUPABASE_SERVICE_ROLE_KEY` no servidor. Sem ela, a tela não oferece o envio da gravação nem a conexão.
- [x] A migration termina com `notify pgrst, 'reload schema'` para as tabelas ficarem visíveis à API logo após a aplicação.
- [ ] Decisão sua: hoje a verificação é opcional e não trava o envio nem a aprovação. Se quiser exigir um dos dois métodos, é uma mudança pequena em `submit_creator_application`/`record_review_decision`.
