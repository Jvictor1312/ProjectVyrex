> ## ⚠️ LEIA ANTES: ESTE DOCUMENTO É UMA BASE, NÃO UMA REGRA 100%
>
> Estas diretrizes foram escritas no início do projeto para orientar o desenvolvimento. Elas **não são uma regra absoluta**:
>
> - **Muita coisa descrita aqui já foi feita.** Confira o código, o banco e `docs/TASKS.md` antes de assumir que algo falta.
> - **Algumas coisas foram alteradas depois.** Exemplo: os critérios de elegibilidade iniciais citados na seção 14 (3.000 seguidores e 2.000 visualizações) foram mudados pela migration `202610150004_creator_growth_criteria.sql`. No banco atual, os valores são 0 seguidores e 1.000 visualizações.
> - **Em caso de divergência, vale esta ordem:** (1) o que o usuário pedir na conversa; (2) o estado real do código e do banco; (3) este documento.
> - **A seção 26 ("Comece imediatamente") não é uma ordem para executar em toda sessão.** Use este documento como contexto do produto e como padrão de qualidade, e trabalhe no que o usuário pedir.

---

# VYREX — DIRETRIZ MESTRA DE DESENVOLVIMENTO, AUTONOMIA, REESTRUTURAÇÃO, DESEMPENHO, TESTES E EXECUÇÃO LOCAL

**Projeto:** Vyrex  
**Tipo:** Plataforma web de recrutamento, agenciamento, validação e gestão de influenciadores digitais  
**Responsável pela execução técnica:** Agente de IA operando no workspace do projeto  
**Objetivo principal:** Transformar a aplicação existente em um sistema completo, funcional, responsivo, seguro, estável, rápido, consistente e preparado para utilização real.

---

# 1. ORDEM PRINCIPAL: ASSUMA A RESPONSABILIDADE PELO PROJETO INTEIRO

A partir desta instrução, você tem autorização para realizar as alterações técnicas necessárias no projeto Vyrex, dentro do workspace disponível, para atingir os objetivos especificados neste documento.

Não considere esta autorização limitada aos arquivos que eu mencionar explicitamente.

Você tem autorização para:

- Examinar todos os arquivos relevantes do projeto.
- Criar arquivos, diretórios, componentes, páginas, serviços e módulos.
- Modificar arquivos existentes.
- Excluir arquivos comprovadamente obsoletos, redundantes ou incorretos, depois de verificar suas referências e dependências.
- Renomear arquivos, pastas, componentes, funções, variáveis, interfaces, tipos, tabelas e outros elementos técnicos.
- Corrigir nomenclaturas inconsistentes.
- Padronizar convenções de código.
- Reorganizar a estrutura de diretórios.
- Refatorar componentes excessivamente grandes.
- Substituir implementações defeituosas por soluções tecnicamente adequadas.
- Remover código morto, duplicações e implementações obsoletas.
- Corrigir dependências incompatíveis.
- Adicionar dependências necessárias, desde que sejam adequadas ao projeto.
- Atualizar configurações de desenvolvimento.
- Criar e atualizar testes automatizados.
- Corrigir erros de compilação, tipagem, lint e execução.
- Melhorar o desempenho do frontend, do backend e das consultas ao banco.
- Corrigir problemas de navegação, autenticação, estado e persistência.
- Implementar funcionalidades ausentes que estejam previstas nesta especificação.
- Atualizar a documentação técnica.
- Criar scripts de desenvolvimento, verificação e testes.
- Executar comandos locais seguros necessários para desenvolver e verificar a aplicação.
- Iniciar e manter o servidor de desenvolvimento local em execução.
- Utilizar o navegador de desenvolvimento disponível para verificar o resultado visual, quando houver suporte no ambiente.

Você não precisa pedir autorização para cada alteração técnica comum.

Se identificar uma solução claramente melhor, implemente-a, desde que preserve os objetivos do produto, a segurança, os dados e as funcionalidades legítimas existentes.

**A autorização para modificar o código é ampla. Não é, porém, uma autorização para destruir dados, expor segredos, executar operações externas irreversíveis ou realizar publicações sem controle.**

## 1.1. Princípio de autonomia

Não espere que eu encontre os problemas.

Você deve identificar, priorizar e corrigir proativamente:

- Erros visíveis.
- Erros ocultos.
- Travamentos.
- Lentidão.
- Navegação inconsistente.
- Rotas quebradas.
- Componentes que não respondem.
- Formulários que não salvam.
- Dados que desaparecem.
- Problemas de autenticação.
- Problemas de autorização.
- Falhas de responsividade.
- Inconsistências visuais.
- Consultas ineficientes.
- Erros de estado.
- Falhas de integração.
- Problemas de tipagem.
- Dependências obsoletas ou incompatíveis.
- Ausência de testes.
- Falhas de acessibilidade.
- Problemas de segurança.
- Documentação desatualizada.

Não transforme cada descoberta em uma pergunta para mim.

Para decisões técnicas comuns, analise o contexto, escolha uma solução adequada, implemente-a, teste-a e continue.

## 1.2. Não fique apenas planejando

Você não foi contratado para produzir listas de sugestões, diagnósticos intermináveis ou relatórios sem implementação.

A auditoria inicial é necessária, mas deverá ser seguida por alterações concretas.

Não encerre uma tarefa apenas porque identificou o problema.

Sempre que possível:

1. Identifique o problema.
2. Localize sua causa.
3. Implemente a correção.
4. Execute os testes apropriados.
5. Verifique se a correção não prejudicou outras áreas.
6. Registre o resultado.
7. Avance para a próxima tarefa.

Se não puder concluir uma correção, registre o motivo e continue com outras tarefas independentes.

---

# 2. OBJETIVO DE QUALIDADE: ELIMINAR TRAVAMENTOS E PROBLEMAS DE NAVEGAÇÃO

A aplicação apresenta problemas de travamento e dificuldades para navegar entre abas.

Esse problema é prioritário.

Não quero uma plataforma que apenas pareça pronta em capturas de tela. Quero uma aplicação que responda corretamente às ações do usuário e mantenha seu estado de maneira consistente.

## 2.1. Comportamento obrigatório da navegação

Todas as áreas da aplicação devem ser navegáveis sem comportamentos inesperados.

Ao clicar em uma aba, link ou item do menu:

- A rota correta deve ser aberta.
- O conteúdo correspondente deve ser apresentado.
- A indicação visual da página ativa deve ser atualizada.
- A navegação não deve exigir recarregamentos completos desnecessários.
- A sessão do usuário deve ser preservada.
- O estado dos formulários deve ser tratado corretamente.
- A página não deve permanecer indefinidamente carregando.
- O usuário deve conseguir voltar e avançar usando o navegador.
- Links diretos para rotas internas devem funcionar quando a sessão e as permissões forem válidas.
- Rotas inexistentes devem apresentar uma página de erro apropriada.
- A troca de página não deve deixar componentes antigos bloqueando a interface.
- Menus, diálogos e pop-ups devem abrir e fechar corretamente.
- A navegação por teclado deve funcionar.

Não implemente uma solução que esconda erros apenas com spinners ou animações.

## 2.2. Diagnóstico de travamentos

Investigue sistematicamente as possíveis causas, incluindo:

- Loops infinitos de renderização.
- `useEffect` com dependências incorretas.
- Atualizações repetitivas de estado.
- Chamadas de API disparadas a cada renderização.
- Requisições duplicadas.
- Promessas que nunca são resolvidas.
- Falta de cancelamento de requisições obsoletas.
- Consultas lentas.
- Busca de grandes volumes de dados.
- Listagens sem paginação.
- Componentes que renderizam toda a aplicação sem necessidade.
- Dependências circulares.
- Contextos globais que provocam renderizações excessivas.
- Bibliotecas de animação conflitantes.
- Erros de hidratação do Next.js.
- Problemas de sessão ou middleware.
- Redirecionamentos repetitivos.
- Falhas no carregamento de módulos.
- Eventos registrados múltiplas vezes.
- Listeners que não são removidos.
- Estados de carregamento que nunca são finalizados.
- Erros de JavaScript não tratados.
- Problemas de conexão com serviços externos.
- Vazamentos de memória.
- Problemas de concorrência em operações de gravação.

Não presuma a causa. Utilize os logs, o código, os testes e as ferramentas disponíveis para encontrar evidências.

## 2.3. Resultado esperado

Quero:

- Troca de páginas previsível.
- Menus responsivos.
- Formulários que respondem normalmente.
- Operações assíncronas com estados de carregamento adequados.
- Erros apresentados de forma compreensível.
- Nenhuma tela permanentemente bloqueada por uma requisição sem tratamento.
- Nenhum loop de navegação.
- Nenhuma dependência desnecessária de recarregamento manual.
- Nenhum bloqueio da interface causado por processamento evitável.
- Nenhum problema conhecido de navegação deixado sem registro.

Se uma operação demorar, a interface deve continuar utilizável sempre que tecnicamente possível.

---

# 3. EXECUÇÃO LOCAL OBRIGATÓRIA: MANTER O LOCALHOST DISPONÍVEL

Quero acompanhar o desenvolvimento por meio de uma instância local da aplicação.

O servidor de desenvolvimento deve permanecer em execução durante o trabalho, quando o ambiente permitir.

## 3.1. Inicialização

Primeiro, identifique a tecnologia e os comandos reais do projeto.

Examine o `package.json`, os scripts existentes, a documentação e as ferramentas já instaladas.

Não presuma que todo projeto utiliza os mesmos comandos.

Se for um projeto Next.js, utilize o script de desenvolvimento definido no projeto, normalmente equivalente a `npm run dev`.

No Windows PowerShell, utilize `npm.cmd` se o comando `npm` estiver bloqueado pela política de execução de scripts.

Antes de iniciar o servidor:

- Verifique se as dependências estão instaladas.
- Verifique se o projeto compila.
- Verifique se as variáveis de ambiente obrigatórias estão disponíveis.
- Verifique se a porta desejada já está ocupada.
- Verifique se já existe um servidor ativo.
- Evite iniciar múltiplas instâncias desnecessárias.

## 3.2. Endereço local

Utilize preferencialmente:

`http://localhost:3000`

Se essa porta estiver ocupada, identifique a causa antes de selecionar outra.

Se precisar utilizar uma porta alternativa, informe o endereço exato.

Não encerre um processo desconhecido sem verificar o que ele está executando.

## 3.3. Manter o servidor aberto

Utilize o mecanismo de execução em segundo plano, terminal persistente ou ferramenta de desenvolvimento disponível no ambiente.

O terminal que mantém o servidor ativo deve permanecer disponível.

Não inicie o servidor em uma sessão que seja encerrada automaticamente ao terminar uma tarefa, se houver uma alternativa persistente.

Se o servidor cair:

1. Identifique a causa.
2. Examine os logs.
3. Corrija o problema, se possível.
4. Reinicie o servidor.
5. Confirme que a aplicação voltou a responder.

Não reinicie continuamente o servidor sem investigar a causa de falhas recorrentes.

## 3.4. Verificação de disponibilidade

Depois de iniciar a aplicação, confirme que o endereço local responde de verdade.

Quando houver ferramentas disponíveis, verifique:

- Resposta HTTP.
- Carregamento da página.
- Erros no terminal.
- Erros do navegador.
- Falhas de recursos.
- Erros de renderização.
- Redirecionamentos inesperados.
- Rotas principais.

Não declare que o localhost está funcionando apenas porque o comando de inicialização foi executado.

## 3.5. Visualização em tempo real

Quero que o localhost reflita as alterações feitas no código por meio do mecanismo de atualização automática do framework, quando suportado.

Durante o desenvolvimento:

- Mantenha o servidor ativo.
- Preserve o hot reload.
- Corrija erros de compilação assim que forem detectados.
- Abra a aplicação no navegador de desenvolvimento disponível.
- Verifique visualmente as principais páginas.
- Teste as interações reais.
- Confirme que as alterações apareceram no navegador.

Não afirme que abriu o navegador, que inspecionou uma tela ou que verificou uma interação se o ambiente não oferecer essas ferramentas.

Se não houver navegador automatizado disponível, utilize as verificações alternativas possíveis e registre essa limitação.

## 3.6. Limite importante

O localhost só pode ser mantido aberto enquanto o ambiente de execução estiver disponível e ativo.

Não afirme que continuará funcionando depois que o computador, terminal ou ambiente de desenvolvimento for encerrado.

Não exponha o servidor local à internet sem necessidade.

---

# 4. MÉTODO DE TRABALHO: CONTINUAR MESMO QUANDO ALGO FALHAR

Quero um processo de desenvolvimento contínuo.

Se uma funcionalidade não puder ser concluída por causa de uma dependência externa, falta de credenciais, limitação do ambiente ou problema técnico não resolvido, não abandone todo o trabalho.

Utilize a seguinte regra.

## 4.1. Regra de continuidade

Para cada tarefa:

1. Tente compreender o problema.
2. Execute as verificações disponíveis.
3. Faça uma tentativa de correção baseada em evidências.
4. Se a primeira abordagem falhar, examine os logs e tente uma alternativa tecnicamente justificável.
5. Se a tarefa continuar bloqueada, registre a causa e o que falta.
6. Deixe o código em estado consistente.
7. Passe para a próxima tarefa independente.
8. Retorne ao bloqueio quando a dependência estiver disponível ou quando surgir uma alternativa segura.

Não repita indefinidamente a mesma operação.

Não gaste toda a cota de IA insistindo em um problema que depende de uma credencial inexistente.

Não abandone tarefas que poderiam ser concluídas sem a integração bloqueada.

## 4.2. Classificação de bloqueios

Classifique cada bloqueio como:

- **Bloqueio local:** problema de código, configuração ou dependência que pode ser corrigido no workspace.
- **Bloqueio externo:** depende de serviço, conta, credencial ou autorização de terceiros.
- **Bloqueio de ambiente:** depende de recursos indisponíveis no computador ou no ambiente de execução.
- **Bloqueio de segurança:** exige autorização humana por envolver uma operação sensível ou irreversível.
- **Bloqueio de requisito:** existe uma ambiguidade comercial que realmente impede uma decisão segura.

Não classifique uma tarefa como bloqueada apenas porque exige investigar ou escrever mais código.

## 4.3. Registro de continuidade

Mantenha um arquivo de tarefas atualizado com:

- Nome da tarefa.
- Estado.
- Problema encontrado.
- Causa conhecida.
- Tentativas realizadas.
- Resultado dos testes.
- Bloqueio, se existir.
- Próxima ação.
- Arquivos relevantes.

Isso permitirá retomar o trabalho sem recomeçar toda a auditoria.

---

# 5. AUDITORIA COMPLETA DO WORKSPACE

Antes de grandes alterações, faça uma auditoria real.

Examine:

- Estrutura de diretórios.
- Arquivos de configuração.
- `package.json`.
- Scripts disponíveis.
- Dependências.
- Rotas.
- Páginas.
- Componentes.
- Layouts.
- Hooks.
- Contextos.
- Serviços.
- API routes.
- Server Actions.
- Middleware.
- Autenticação.
- Autorização.
- Acesso ao banco.
- Armazenamento.
- Formulários.
- Uploads.
- Testes.
- Migrations.
- Estilos.
- Recursos estáticos.
- Documentação.
- Variáveis de ambiente, sem imprimir valores secretos.
- Estado do Git, quando disponível.

Identifique quais funcionalidades já existem, quais são parcialmente funcionais e quais estão ausentes.

Não reescreva automaticamente uma implementação válida apenas porque prefere outro padrão.

Preserve o que funciona e melhore o que está defeituoso.

## 5.1. Auditoria sem paralisar o desenvolvimento

A auditoria não deve se transformar em uma tarefa interminável.

Depois de obter uma visão suficiente do projeto:

- Registre os problemas prioritários.
- Corrija primeiro os erros que impedem a execução.
- Resolva problemas de navegação e estabilidade.
- Implemente as funcionalidades fundamentais.
- Continue a auditoria de áreas secundárias enquanto trabalha.

Não é necessário compreender cada linha do projeto antes de corrigir um erro evidente e isolado.

---

# 6. LIBERDADE PARA RENOMEAR E REORGANIZAR

Você tem permissão para alterar nomenclaturas e reorganizar o projeto quando houver uma justificativa técnica.

Exemplos:

- Padronizar nomes em português ou inglês conforme a convenção existente.
- Corrigir erros ortográficos em nomes técnicos.
- Unificar nomenclaturas duplicadas.
- Renomear componentes.
- Renomear hooks.
- Renomear funções.
- Renomear interfaces e tipos.
- Renomear serviços.
- Renomear arquivos e diretórios.
- Ajustar aliases de importação.
- Reorganizar módulos.
- Consolidar utilitários duplicados.
- Separar componentes grandes.
- Corrigir nomes de rotas.
- Padronizar nomes de tabelas e colunas.

Entretanto, toda renomeação deverá preservar as referências e os contratos necessários.

Antes de renomear um elemento:

1. Localize suas referências.
2. Verifique os imports.
3. Verifique as rotas dependentes.
4. Verifique os testes.
5. Verifique as migrations e as consultas ao banco.
6. Atualize a documentação pertinente.
7. Execute as verificações necessárias.

Não renomeie tabelas ou colunas de produção sem avaliar migrações, compatibilidade e impacto nos dados.

Se uma nomenclatura já estiver consolidada e correta, não a altere sem necessidade.

A liberdade para reorganizar o código existe para melhorar o projeto, não para introduzir mudanças cosméticas sem benefício.

---

# 7. REGRAS DE PRESERVAÇÃO E SEGURANÇA

A autorização para realizar mudanças não elimina a obrigação de preservar o trabalho válido.

Antes de alterações amplas:

- Verifique o estado do Git.
- Identifique modificações pendentes.
- Preserve alterações não relacionadas à tarefa.
- Crie um commit de segurança, se apropriado e possível.
- Ou prepare uma cópia de segurança fora das áreas de saída do build.

Não sobrescreva silenciosamente arquivos modificados por mim ou por outros agentes.

Não remova arquivos apenas porque parecem não ser utilizados sem verificar referências, imports dinâmicos, rotas, scripts e configurações.

Não execute operações destrutivas em dados reais.

Não aplique migrations destrutivas remotamente sem autorização específica.

Não apague bancos de dados, buckets, usuários ou arquivos reais para facilitar testes.

Não exponha segredos em logs, relatórios ou mensagens.

Não publique a aplicação em produção sem autorização.

Não desative mecanismos de segurança para fazer um teste passar.

Quando uma mudança for potencialmente destrutiva, procure uma alternativa reversível.

---

# 8. ARQUITETURA E QUALIDADE DO CÓDIGO

Examine a arquitetura existente antes de escolher novas tecnologias.

Se o projeto já estiver baseado em Next.js, React e TypeScript, preserve essa base quando ela for adequada.

Não migre de framework por preferência pessoal.

Organize as responsabilidades em módulos claros:

- Interface.
- Componentes.
- Layouts.
- Rotas.
- Regras de negócio.
- Validação.
- Serviços.
- Banco de dados.
- Autenticação.
- Autorização.
- Uploads.
- Integrações.
- Notificações.
- Auditoria.
- Testes.

Evite:

- Arquivos gigantes.
- Duplicação de código.
- Funções excessivamente complexas.
- Dependências circulares.
- `any` indiscriminado.
- Estados globais desnecessários.
- Efeitos colaterais durante a renderização.
- Acesso direto ao banco em componentes sem necessidade.
- Regras de autorização apenas no frontend.
- Consultas repetitivas.
- Código sem tratamento de erros.
- Dados fictícios em fluxos de produção.
- Botões sem ação.
- Links sem destino.
- Páginas que apenas simulam resultados.

Não substitua uma implementação funcional por uma abstração complexa sem benefício comprovado.

---

# 9. IDENTIDADE VISUAL E EXPERIÊNCIA DO USUÁRIO

Preserve a identidade visual da Vyrex: minimalista, tecnológica, profissional e baseada principalmente em preto e branco.

Utilize os recursos de marca existentes.

Não remova o logotipo oficial quando ele estiver disponível.

Mantenha consistência entre páginas públicas e painéis internos.

## 9.1. Requisitos gerais

Todas as páginas devem apresentar:

- Hierarquia visual clara.
- Tipografia legível.
- Espaçamentos consistentes.
- Navegação previsível.
- Estados de carregamento.
- Estados vazios.
- Feedback de sucesso.
- Feedback de erro.
- Foco visível.
- Formulários organizados.
- Botões com ações reais.
- Confirmação para operações importantes.

Não utilize animações pesadas que prejudiquem o desempenho.

Não esconda problemas de navegação com efeitos visuais.

## 9.2. Home e hero

Preserve os requisitos visuais já definidos para a esfera central VYREX, os anéis orbitais, as pequenas esferas e a interação com o mouse.

A composição deverá manter os anéis visíveis, criar profundidade tridimensional e permitir que as pequenas esferas se movimentem de forma independente.

Se a hero tiver animações interativas:

- Evite loops de renderização.
- Evite atualizações desnecessárias.
- Respeite `prefers-reduced-motion`.
- Mantenha a experiência responsiva.
- Separe as transformações de elementos com animações diferentes.
- Verifique o resultado no navegador.

As seções inferiores devem ser reveladas progressivamente durante a rolagem, sem bloquear a navegação normal.

---

# 10. DESEMPENHO: PRIORIDADE PARA UMA APLICAÇÃO FLUIDA

Investigue o desempenho da aplicação inteira.

Não se limite a otimizar uma única página.

## 10.1. Frontend

Verifique:

- Quantidade de renderizações.
- Componentes desnecessariamente grandes.
- Código carregado no cliente sem necessidade.
- Dependências pesadas.
- Carregamento de imagens.
- Tamanho dos bundles.
- Transições entre páginas.
- Suspense e limites de erro.
- Hidratação.
- Listagens grandes.
- Tabelas.
- Menus.
- Modais.
- Animações.
- Consultas disparadas por componentes.
- Requisições redundantes.

Utilize Server Components quando apropriado em Next.js.

Mantenha componentes de cliente apenas onde a interatividade exigir.

Não transforme indiscriminadamente toda a aplicação em Client Components.

Utilize carregamento sob demanda quando houver benefício real.

Não adicione memoização indiscriminadamente: identifique primeiro os gargalos.

## 10.2. Requisições e dados

Evite:

- Buscar o mesmo dado repetidamente.
- Recarregar toda a página para atualizar um único campo.
- Fazer requisições em cascata desnecessárias.
- Buscar registros que não serão exibidos.
- Carregar todas as evidências de uma vez.
- Consultar dados de outros usuários sem necessidade.
- Manter requisições obsoletas atualizando o estado.

Utilize paginação, filtros no servidor e seleção explícita de colunas quando apropriado.

Trate erros e timeouts.

Quando uma consulta falhar, não deixe a interface travada.

## 10.3. Banco de dados

Examine as consultas e os índices.

Verifique:

- Consultas repetitivas.
- Ausência de índices em filtros frequentes.
- Problemas de paginação.
- Consultas N+1.
- Ordenações ineficientes.
- Índices redundantes.
- Políticas RLS que provoquem consultas excessivas.
- Transações incompletas.
- Concorrência nas atualizações.

Crie índices somente quando houver justificativa para a consulta ou operação.

Não altere o banco de produção sem avaliar o impacto.

## 10.4. Metas de desempenho

Busque uma interface que responda rapidamente e sem travamentos perceptíveis.

Quando for possível medir, registre tempos de carregamento, navegação e operações relevantes.

Utilize métricas reais, não estimativas inventadas.

Não declare que o sistema está otimizado sem executar verificações apropriadas.

Se não for possível atingir uma meta por limitação de hardware, rede ou serviço externo, registre a limitação.

---

# 11. TECNOLOGIAS E INTEGRAÇÕES EXISTENTES

Não substitua tecnologias sem necessidade.

Inspecione as versões e configurações atuais.

Se o projeto já utilizar Next.js, React, TypeScript, Tailwind e Supabase de maneira adequada, continue utilizando-os.

Se encontrar incompatibilidades, corrija-as com mudanças localizadas.

Não atualize todas as dependências de uma só vez.

Antes de atualizar uma dependência:

1. Verifique sua função.
2. Verifique a versão atual.
3. Verifique a compatibilidade.
4. Avalie o risco.
5. Atualize apenas quando houver justificativa.
6. Execute os testes relacionados.

Não invente integrações externas.

Se uma integração depender de uma conta, credencial, permissão ou aprovação, implemente o que puder localmente e documente a configuração pendente.

---

# 12. SUPABASE E PERSISTÊNCIA REAL

O Supabase deve ser integrado de verdade quando a configuração e as credenciais estiverem disponíveis.

Verifique:

- Supabase Auth.
- PostgreSQL.
- Storage.
- Variáveis de ambiente.
- Migrations.
- RLS.
- Tipos TypeScript.
- Políticas de acesso.
- Tratamento de erros.
- Persistência de formulários.
- Sessões.
- Permissões por papel.

Não declare uma integração funcional sem verificar uma operação real.

Não crie tabelas apenas para fazer a interface parecer conectada.

Não substitua dados reais por arrays fixos ou armazenamento local sem necessidade.

Se o Supabase não estiver configurado, prepare as migrations, os clientes, os tipos, a documentação e as verificações locais.

Não invente credenciais.

Nunca exponha chaves privilegiadas no navegador.

---

# 13. AUTENTICAÇÃO, PAPÉIS E AUTORIZAÇÃO

Preserve e implemente o modelo de acesso da Vyrex.

Papéis principais:

- Administrador.
- Recrutador.
- Gestor de Relacionamento.
- Analista de Validação.
- Influenciador.

O sistema deve respeitar as permissões de cada função.

A autorização deve ser aplicada no servidor e, quando aplicável, no banco por meio de RLS.

Não confie exclusivamente em esconder botões ou menus.

Teste acessos diretos a rotas e chamadas manuais.

Nenhum usuário deve conseguir alterar o próprio papel ou aprovar o próprio cadastro sem autorização explícita.

Múltiplas funções podem ser permitidas quando configuradas de forma segura.

---

# 14. FLUXO DO INFLUENCIADOR

O influenciador deverá conseguir:

1. Criar uma conta.
2. Autenticar-se.
3. Preencher seu perfil.
4. Informar suas redes sociais.
5. Informar métricas declaradas.
6. Enviar cinco evidências de Stories.
7. Salvar e retomar o cadastro.
8. Revisar as informações.
9. Enviar o cadastro.
10. Acompanhar o estado.
11. Consultar pendências.
12. Corrigir dados quando solicitado.
13. Receber mensagens e notificações.
14. Consultar o histórico permitido.
15. Atualizar informações autorizadas.
16. Encerrar a sessão.

O sistema deverá persistir os dados reais.

Não considere métricas declaradas automaticamente verificadas.

Não considere cinco uploads suficientes para aprovar um cadastro.

Os critérios de elegibilidade devem ser configuráveis, com valores iniciais de 3.000 seguidores e 2.000 visualizações por evidência, salvo configuração administrativa válida em contrário.

---

# 15. PAINÉIS INTERNOS

Implemente e teste os painéis correspondentes aos papéis autorizados.

## 15.1. Administrador

Deve permitir gerenciar usuários, papéis, critérios, atribuições, cadastros, configurações e auditoria, de acordo com as permissões.

## 15.2. Recrutador

Deve permitir visualizar a carteira, pesquisar candidatos, registrar observações internas, acompanhar etapas e encaminhar cadastros para validação.

## 15.3. Gestor de Relacionamento

Deve permitir consultar a carteira, registrar contatos, gerenciar mensagens, acompanhar pendências e comunicar decisões registradas.

## 15.4. Analista de Validação

Deve permitir analisar evidências individualmente, registrar resultados, solicitar correções e tomar decisões autorizadas.

## 15.5. Influenciador

Deve permitir consultar o próprio perfil, evidências, pendências, mensagens e estado do cadastro.

Não implemente apenas dashboards com números estáticos.

Todos os dados apresentados devem vir das fontes corretas.

---

# 16. WORKFLOW, AUDITORIA E CONSISTÊNCIA

Implemente transições válidas para os estados:

- Rascunho.
- Incompleto.
- Aguardando triagem.
- Em triagem.
- Aguardando validação.
- Em validação.
- Correção solicitada.
- Aprovado.
- Rejeitado.
- Suspenso, quando aplicável.

A mudança de estado deve ser validada no servidor.

Registre as alterações críticas com responsável, data, resultado e justificativa.

Preserve o histórico de decisões.

Evite submissões duplicadas.

Trate conflitos de edição concorrente.

Não permita que uma atualização parcial deixe o cadastro em um estado impossível.

---

# 17. SEGURANÇA E DADOS PRIVADOS

Não reduza a segurança para facilitar o desenvolvimento.

Implemente validação de entrada, controle de sessão, autorização no servidor, RLS e políticas de Storage apropriadas.

Proteja os arquivos privados.

Não exponha dados de outros influenciadores.

Não revele notas internas em interfaces públicas.

Não armazene segredos no código.

Não registre tokens ou senhas.

Evite erros que permitam escalada de privilégios.

Não desative a autenticação ou as políticas RLS para fazer os testes passarem.

Se precisar de dados de teste, use um ambiente local ou de teste separado dos dados reais.

---

# 18. ESTRATÉGIA DE TESTES: TESTAR TUDO O QUE FOR POSSÍVEL

Você tem autorização para criar e executar testes locais necessários para validar o projeto.

Utilize as ferramentas que já existem e adicione as necessárias quando houver benefício claro.

Não se limite a executar o build.

## 18.1. Verificações estáticas

Execute os scripts disponíveis para:

- ESLint.
- TypeScript.
- Formatação, quando configurada.
- Build de produção.
- Análise de dependências, quando apropriada.
- Verificação de imports.
- Validação de configuração.

Utilize os scripts reais definidos no `package.json`.

Não invente scripts que não existem sem implementá-los.

## 18.2. Testes unitários

Teste:

- Funções de validação.
- Regras de elegibilidade.
- Transições de estado.
- Verificações de permissão.
- Utilitários.
- Formatação de dados.
- Tratamento de erros.
- Funções críticas de negócio.

## 18.3. Testes de integração

Teste, conforme a infraestrutura disponível:

- Autenticação.
- Persistência.
- Consultas.
- Criação de registros.
- Atualizações.
- Uploads.
- Políticas de acesso.
- Fluxo de validação.
- Atribuição de responsáveis.
- Notificações.
- Tratamento de erros.

Não utilize produção para testes destrutivos.

## 18.4. Testes ponta a ponta

Utilize Playwright ou ferramenta equivalente, quando possível.

Teste os fluxos principais pelo navegador:

- Abrir a home.
- Navegar entre as páginas.
- Abrir o cadastro.
- Validar formulários.
- Autenticar-se em ambiente de teste.
- Acessar páginas protegidas.
- Verificar redirecionamentos.
- Consultar o dashboard.
- Navegar entre abas.
- Abrir e fechar menus e diálogos.
- Verificar mensagens de erro.
- Verificar carregamentos.
- Testar a experiência responsiva.
- Verificar estados vazios.
- Simular falhas de rede quando possível.

Utilize contas e dados de teste apropriados.

## 18.5. Testes de autorização

Tente acessar recursos com usuários de papéis diferentes.

Verifique se o backend realmente impede ações não autorizadas.

Teste requisições diretas, sem depender dos botões da interface.

## 18.6. Testes de desempenho

Investigue e meça, quando houver ferramentas disponíveis:

- Tempo de carregamento.
- Tempo de navegação.
- Número de requisições.
- Requisições duplicadas.
- Renderizações excessivas.
- Travamentos.
- Vazamentos de memória.
- Tempo de resposta do backend.
- Comportamento com listas maiores.
- Uso de recursos pelo navegador.

Não invente números de desempenho.

## 18.7. Testes visuais

Se houver navegador automatizado ou ferramentas de inspeção visual:

- Abra as páginas principais.
- Verifique a composição.
- Confira responsividade.
- Teste os controles.
- Observe erros de console.
- Verifique se as animações não bloqueiam a interface.
- Confirme que o layout não se quebra em larguras menores.

Se não houver suporte a inspeção visual, registre isso e execute as verificações alternativas.

---

# 19. REGRA FUNDAMENTAL: SE ALGO FALHAR, CONTINUE

Não interrompa todo o desenvolvimento por causa de um único erro.

Se um teste falhar:

1. Identifique a falha.
2. Determine se ela é causada pelo código, configuração ou ambiente.
3. Corrija se estiver dentro do escopo e houver uma solução segura.
4. Execute novamente o teste afetado.
5. Se continuar bloqueado, documente a limitação.
6. Execute os outros testes independentes.
7. Passe para a próxima tarefa útil.

Se uma integração externa estiver indisponível, continue com as páginas, componentes, validações e testes que não dependam dela.

Se um comando não existir, examine os scripts disponíveis e selecione uma alternativa válida.

Se uma dependência não puder ser instalada, verifique o motivo e tente uma alternativa compatível quando justificável.

Se uma página não puder ser testada por falta de credenciais, teste os componentes e regras independentes.

Se a execução local falhar, investigue os logs e tente restaurar o ambiente.

Não declare sucesso quando o teste não foi executado.

Não esconda testes falhos.

Não deixe uma tarefa pendente sem registrar seu motivo.

## 19.1. Ordem de prioridade durante falhas

Priorize nesta ordem:

1. Preservar dados e código válido.
2. Manter a aplicação em estado consistente.
3. Corrigir erros que impedem a execução.
4. Corrigir segurança e permissões.
5. Corrigir travamentos e navegação.
6. Corrigir funcionalidades principais.
7. Executar testes independentes.
8. Implementar melhorias secundárias.
9. Documentar bloqueios restantes.

---

# 20. AUTONOMIA SOBRE COMANDOS E FERRAMENTAS

Você pode executar os comandos locais necessários para desenvolver, verificar e testar o projeto.

Isso inclui instalação de dependências, execução de testes, build, lint, verificações de tipos e inicialização do servidor local, quando apropriado.

Antes de instalar uma dependência, avalie se ela é realmente necessária.

Antes de alterar configurações, preserve os valores existentes que ainda forem válidos.

Não use comandos destrutivos de maneira indiscriminada.

Não execute comandos obtidos de fontes desconhecidas sem inspecionar seu propósito.

Não ignore avisos de segurança sem compreender suas consequências.

Não contorne restrições do ambiente.

Se o terminal não permitir uma operação, tente uma alternativa segura e compatível.

Não solicite confirmação para cada comando de desenvolvimento rotineiro que possa ser executado com segurança no workspace.

Entretanto, operações como publicação em produção, exclusão de dados reais, rotação de credenciais, alteração de permissões externas e outras ações potencialmente irreversíveis continuam exigindo a autorização apropriada.

---

# 21. CONTROLE DE DEPENDÊNCIAS

Antes de adicionar, remover ou atualizar pacotes:

- Consulte as dependências existentes.
- Verifique a compatibilidade com o projeto.
- Avalie o impacto.
- Prefira bibliotecas maduras e mantidas.
- Evite dependências redundantes.
- Preserve o gerenciador de pacotes utilizado pelo projeto.
- Não misture gerenciadores sem necessidade.
- Não apague o lockfile indiscriminadamente.
- Execute as verificações após mudanças relevantes.

Se uma biblioteca estiver causando travamentos, investigue se o problema está em sua utilização antes de substituí-la.

Não introduza uma biblioteca pesada para resolver um problema simples.

---

# 22. DOCUMENTAÇÃO E MEMÓRIA DE EXECUÇÃO

Utilize ou crie a seguinte documentação, adaptando os caminhos aos padrões existentes:

- `AGENTS.md`: instruções permanentes para agentes.
- `README.md`: instalação e uso.
- `docs/PRODUCT_SPEC.md`: requisitos do produto.
- `docs/ARCHITECTURE.md`: arquitetura.
- `docs/DECISIONS.md`: decisões técnicas importantes.
- `docs/TASKS.md`: tarefas e progresso.
- `docs/SECURITY.md`: requisitos de segurança.
- `docs/TESTING.md`: estratégia e comandos de testes.
- `docs/KNOWN_ISSUES.md`: problemas conhecidos e bloqueios.

Não duplique documentos existentes sem necessidade.

Mantenha o registro de tarefas atualizado após cada conjunto significativo de alterações.

Registre:

- O que foi alterado.
- Por que foi alterado.
- Quais problemas foram corrigidos.
- Quais testes foram executados.
- Quais testes falharam.
- Quais limitações permanecem.
- Qual é a próxima tarefa.

Não gaste tempo reescrevendo documentação inteira a cada ciclo.

Atualize somente o que mudou.

---

# 23. PLANO DE EXECUÇÃO CONTÍNUA

Execute o trabalho em ciclos pequenos, completos e verificáveis.

## Fase 1 — Auditoria e estabilidade

- Examinar a estrutura.
- Verificar o estado do Git.
- Verificar scripts.
- Identificar os erros de execução.
- Identificar os travamentos.
- Corrigir problemas que impedem a aplicação de funcionar.
- Iniciar o servidor local.
- Confirmar o funcionamento básico.

## Fase 2 — Navegação e experiência

- Corrigir rotas.
- Corrigir menus e abas.
- Corrigir estados de carregamento.
- Corrigir redirecionamentos.
- Corrigir erros de renderização.
- Testar navegação.
- Testar responsividade.
- Melhorar o desempenho das páginas principais.

## Fase 3 — Autenticação e autorização

- Verificar a sessão.
- Verificar o login.
- Verificar o logout.
- Verificar as rotas protegidas.
- Verificar os papéis.
- Corrigir falhas de permissão.

## Fase 4 — Fluxo de cadastro

- Verificar os formulários.
- Verificar persistência.
- Verificar salvamento.
- Verificar retomada.
- Verificar redes sociais.
- Verificar uploads.
- Verificar submissão.
- Verificar os estados do cadastro.

## Fase 5 — Painéis internos

- Verificar painel administrativo.
- Verificar painel do recrutador.
- Verificar painel do gestor de relacionamento.
- Verificar painel do analista.
- Verificar painel do influenciador.
- Corrigir inconsistências.
- Testar permissões.

## Fase 6 — Integração e dados

- Verificar Supabase.
- Verificar migrations.
- Verificar RLS.
- Verificar Storage.
- Verificar consistência.
- Verificar consultas.
- Verificar tratamento de erros.

## Fase 7 — Testes e desempenho

- Executar lint.
- Executar verificações de tipos.
- Executar testes unitários.
- Executar testes de integração disponíveis.
- Executar testes ponta a ponta disponíveis.
- Executar build.
- Investigar travamentos.
- Corrigir falhas.
- Executar novamente os testes afetados.

## Fase 8 — Continuidade

Depois de concluir cada fase, selecione a próxima tarefa pendente de maior impacto.

Não espere que eu solicite a próxima tarefa.

Continue até que todas as tarefas executáveis tenham sido concluídas ou até que exista um bloqueio real que exija intervenção externa.

---

# 24. CRITÉRIOS DE ACEITAÇÃO

O projeto só poderá ser considerado funcional quando as funcionalidades correspondentes forem verificadas.

## Estabilidade

- A aplicação inicia corretamente.
- O servidor local responde.
- Não existem loops de navegação conhecidos.
- Não existem travamentos reproduzíveis sem tratamento.
- Erros são registrados e apresentados de forma apropriada.

## Navegação

- As rotas principais funcionam.
- Os menus funcionam.
- As abas funcionam.
- O navegador consegue voltar e avançar.
- As rotas protegidas respeitam a sessão.
- Os estados de carregamento são finalizados corretamente.

## Persistência

- Formulários gravam dados reais.
- Uploads são persistidos.
- Atualizações permanecem após recarregar a página.
- Falhas de gravação não são apresentadas como sucesso.

## Segurança

- Os papéis são verificados no servidor.
- Dados privados não podem ser acessados indevidamente.
- Arquivos privados respeitam as permissões.
- Operações críticas deixam histórico.
- Segredos não são expostos.

## Qualidade

- As verificações estáticas disponíveis foram executadas.
- Os testes disponíveis foram executados.
- As falhas conhecidas foram corrigidas ou documentadas.
- O build foi verificado quando possível.
- A documentação está atualizada.

## Execução local

- O servidor de desenvolvimento permanece ativo quando o ambiente permite.
- O endereço local exato foi confirmado.
- O navegador de desenvolvimento foi utilizado quando disponível.
- As alterações aparecem no ambiente de desenvolvimento.
- Limitações do ambiente foram registradas honestamente.

Não declare a conclusão geral apenas porque alguns desses critérios foram atendidos.

---

# 25. FORMATO DO RELATÓRIO DE PROGRESSO

Ao finalizar cada ciclo significativo, apresente um relatório conciso contendo:

**1. Alterações realizadas**
- Arquivos modificados.
- Funcionalidades corrigidas.
- Refatorações relevantes.

**2. Problemas resolvidos**
- Causa identificada.
- Correção aplicada.
- Resultado observado.

**3. Verificações**
- Comandos executados.
- Testes aprovados.
- Testes falhos.
- Testes não executados e seus motivos.

**4. Estado do localhost**
- Servidor ativo ou inativo.
- Endereço local.
- Confirmação de resposta.
- Erros conhecidos.

**5. Pendências**
- Bloqueios externos.
- Credenciais ausentes.
- Problemas ainda não resolvidos.
- Próxima tarefa prioritária.

Não repita a auditoria completa em cada relatório.

Não use porcentagens inventadas para descrever o progresso.

Não declare que o sistema está 100% funcional sem evidências suficientes.

---

# 26. INSTRUÇÃO FINAL DE EXECUÇÃO

> Lembrete: esta seção descreve o espírito do trabalho. Ela não é uma ordem para recomeçar tudo a cada sessão (veja o aviso no topo).

Comece imediatamente.

Não me responda apenas com um plano.

Primeiro, examine o workspace existente e preserve o trabalho válido.

Depois:

1. Identifique os problemas que impedem a execução.
2. Corrija os erros prioritários.
3. Investigue e resolva os travamentos.
4. Corrija a navegação entre abas e páginas.
5. Inicie o servidor local e confirme que ele responde.
6. Continue com a autenticação, os formulários, a persistência, os uploads e os painéis.
7. Execute todos os testes que forem possíveis no ambiente.
8. Corrija as falhas encontradas.
9. Se uma tarefa continuar bloqueada, documente a causa e passe para a próxima.
10. Mantenha o progresso registrado para permitir continuidade sem recomeçar do zero.

Você tem autonomia para alterar, criar, refatorar, renomear e reorganizar os arquivos técnicos necessários dentro do escopo estabelecido.

Não fique preso a nomenclaturas antigas quando estiverem incorretas.

Não preserve código defeituoso apenas porque ele já existe.

Não destrua código funcional apenas para impor sua preferência arquitetural.

Não simule integrações.

Não esconda erros.

Não interrompa todo o desenvolvimento por causa de uma tarefa bloqueada.

Não invente resultados de testes.

Não publique em produção sem autorização.

**A meta é uma Vyrex realmente utilizável, com navegação fluida, funcionamento consistente, segurança adequada, funcionalidades completas e testes verificáveis. Priorize a qualidade real do produto, não a aparência de conclusão.**
