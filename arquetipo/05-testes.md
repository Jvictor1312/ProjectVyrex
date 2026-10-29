# 5. Testes

## Resultado de hoje (29/10/2026)

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Tipos | `npm run typecheck` | sem erros |
| Padrões de código | `npm run lint` | sem erros |
| Regras, banco e registro de erros | `npm test` | **61 de 61** |
| Build de produção | `$env:NEXT_DIST_DIR=".next-prod"; npm run build` | concluído (31 rotas) |
| Navegador, banco real, só leitura | `npm run test:e2e` | **85 aprovados**, 3 pulados de propósito |
| Acessibilidade (axe, WCAG 2.2 AA) em 15 telas × 2 aparelhos | dentro do `test:e2e` | nenhum problema sério ou crítico |
| Fluxo completo, banco de testes | `npm run test:flows` | **10 de 10** (com a etapa nova do filtro "Responsável") |
| CI no GitHub | a cada envio | aprovado |
| Proteção de scripts no build de produção | manual, no Chrome (`localhost:3002`) | scripts do site rodam; HTML injetado com código é bloqueado |

## As quatro camadas

### 1. Regras e banco — `npm test` (61 testes, ~6 s)

Roda com o executor de testes do próprio Node, sem internet.

- **`tests/log.test.mjs` (6):** o registro de erros anota recusas e falhas, não registra senha errada nem dados pessoais (detalhes do banco, parâmetros do endereço, id do usuário no Storage) e devolve a resposta intacta.
- **`supabase/tests/initial-platform.test.mjs` (35):** inclui o filtro "Responsável" (`creator_queue`). aplica **todas** as migrations num Postgres que roda na memória (PGlite), com imitações de `auth` e `storage`. Testa como cada função age: o criador só vê o que é dele; o recrutador encaminha mas não decide; não dá para aprovar sem as evidências; não dá para tirar o último administrador; desativação; cota de upload; CPF; desfazer envio; busca sem acento; limite de tentativas.
- **`supabase/tests/data-requests.test.mjs` (4):** pedidos de privacidade (duplicidade, isolamento, só o admin resolve, justificativa obrigatória).
- **`tests/validation.test.mjs` (16):** validação dos formulários, senha forte, CPF, destino do login por função, redirecionamento seguro, normalização de imagem, agrupamento do histórico, texto de busca.

### 2. Navegador no banco real — `npm run test:e2e` (43 testes × computador e celular)

- `accessibility.spec.ts` (15): auditoria **axe-core** com as regras WCAG 2.0, 2.1 e 2.2 (A e AA) nas telas públicas, do criador e da equipe. Falha em problema sério ou crítico; os menores vão anexados ao relatório (`playwright-report/`).

Playwright no Chrome instalado, nos projetos "computador" e "celular" (Pixel 7). **Só lê**: nunca salva nada no banco real.

- `public.spec.ts`: páginas públicas abrem com logo e título, sem rolagem lateral; 404; campos do login com rótulo e letra de 16px no celular; áreas com login mandam para `/login`; o link de retorno não leva para outro site; recuperação com resposta neutra (2 testes pulados de propósito para não disparar e-mails).
- `creator.spec.ts`: menu do criador, voltar e avançar do navegador, sessão após recarregar, criador barrado na área da equipe, menu fixo embaixo no celular.
- `admin.spec.ts`: lista e filtros, menu da administração, histórico recolhido, configurações, ficha inexistente.
- `auth.setup.ts` entra nas contas `+adm` e `+user` (senhas lidas das variáveis do Windows, nunca do código) e guarda a sessão por 30 min em `playwright/.auth/`.

### 3. Fluxo completo no banco de testes — `npm run test:flows` (10 etapas)

Sobe o servidor `localhost:3001` ligado ao projeto **Vyrex Testes** e se recusa a rodar se estiver ligado ao banco real.

1. O servidor está no banco de testes.
2. Criador novo preenche perfil, rede e evidências e envia.
3. Administrador atribui recrutador e gestora; o filtro "Responsável" mostra o criador para o recrutador e o esconde em "Sem responsável".
4. Outro criador não consegue abrir a ficha.
5. Recrutador encaminha e não vê a decisão final.
6. Gestora manda mensagem.
7. Analista confere rede e evidências e aprova.
8. Criador vê a aprovação, a mensagem e o histórico.
9. (`signup.spec.ts`) Visitante cria conta pela tela e cai no painel.

### 4. Conferência visual

- Prints das telas alteradas, no Chrome (Claude in Chrome) ou com `agent-browser`.
- Inspetor de design (`.claude/skills/design-taste-frontend/scripts/inspect.mjs`) em 1440, 768 e 390 px.
- Auditoria de acessibilidade (capítulo 6).

## Como rodar tudo

```powershell
npm run typecheck; npm run lint; npm test
npm run test:e2e        # precisa das variáveis VYREX_TEST_* (scripts\set-test-credentials.ps1)
npm run test:flows      # precisa do .env.test.local
$env:NEXT_DIST_DIR=".next-prod"; npm run build
git checkout -- next-env.d.ts tsconfig.json   # desfaz o que os servidores de teste regravam
```

## Regra para mudanças no banco

1. Escreva a migration nova (só aditiva).
2. Inclua-a no `before()` de `supabase/tests/initial-platform.test.mjs` e escreva o teste.
3. `npm test`.
4. `scripts\migrations.ps1 -Banco testes -Aplicar` e `npm run test:flows`.
5. Só então `scripts\migrations.ps1 -Banco real -Aplicar` e `scripts\gen-db-types.ps1`.

## O que ainda não é testado automaticamente

- **Componentes React isolados:** a cobertura vem dos testes de navegador.
- **E-mails de verdade** (confirmação e recuperação): dependem de SMTP próprio.
- **Celular de verdade** (iPhone e Android): só o simulado do Chrome.
- **Carga:** comportamento com milhares de cadastros (o painel já soma e filtra no banco, mas não houve teste de volume).
- **Acessibilidade com leitor de tela real** (NVDA, VoiceOver).
- **Testes de navegador no CI:** precisam das contas de teste, por isso rodam só nesta máquina. O CI roda tipos, lint, `npm test`, build e audit.
