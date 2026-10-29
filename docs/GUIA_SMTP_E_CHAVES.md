# Guia: e-mail próprio (SMTP) e troca das chaves do Supabase

Duas tarefas com senhas que só você pode fazer. Cada parte diz **o que você faz** e **o que o Claude faz depois**. Nada aqui apaga dados.

Projeto real: **Vyrex** (`zofxrohoilwjtzbcruse`). Os links abaixo já abrem a página certa do painel do Supabase.

---

## Parte A — E-mail próprio (SMTP)

**Por quê:** sem SMTP próprio, o Supabase envia os e-mails de confirmação e de recuperação de senha em inglês, com remetente do Supabase e limite de poucos envios por hora. Os modelos em português já estão prontos em `supabase/templates/`.

### A1. Escolha de onde os e-mails vão sair

| Opção | Quando usar | O que você precisa |
| --- | --- | --- |
| **Resend** (recomendado) | se a Vyrex tem um domínio próprio (ex.: `vyrex.com.br`) | conta gratuita em resend.com (3.000 e-mails/mês) e acesso ao DNS do domínio |
| **Gmail** | enquanto não houver domínio | uma conta Gmail com verificação em duas etapas ligada (até ~500 e-mails/dia) |

### A2-Resend. Se escolheu Resend

1. Crie a conta em **resend.com** e entre.
2. Menu **Domains** → **Add Domain** → digite o domínio da Vyrex.
3. O Resend mostra alguns registros DNS (TXT e MX). Copie-os para o painel onde o domínio foi comprado (Registro.br, GoDaddy, Hostinger…). Volte ao Resend e clique em **Verify**. Pode levar de minutos a algumas horas.
4. Menu **API Keys** → **Create API Key** → nome "Supabase Vyrex", permissão **Sending access** → copie a chave (`re_...`). Ela é a senha do passo seguinte.
5. Siga para **A3** com estes dados:
   - Host: `smtp.resend.com` · Porta: `465`
   - Usuário: `resend` · Senha: a chave `re_...`
   - E-mail do remetente: algo como `nao-responda@seudominio` · Nome do remetente: `Vyrex`

### A2-Gmail. Se escolheu Gmail

1. Em **myaccount.google.com** → **Segurança** → confirme que a **Verificação em duas etapas** está ligada.
2. Abra **myaccount.google.com/apppasswords** → nome "Supabase Vyrex" → **Criar**. O Google mostra uma senha de 16 letras: ela é a senha do passo seguinte (não é a senha normal do Gmail).
3. Siga para **A3** com estes dados:
   - Host: `smtp.gmail.com` · Porta: `465`
   - Usuário: o endereço Gmail completo · Senha: a senha de 16 letras
   - E-mail do remetente: **o mesmo** endereço Gmail · Nome do remetente: `Vyrex`

### A3. Ligue o SMTP no Supabase

1. Abra **https://supabase.com/dashboard/project/zofxrohoilwjtzbcruse/auth/smtp**
2. Ligue **Enable Custom SMTP**.
3. Preencha remetente, nome, host, porta, usuário e senha com os dados do passo anterior.
4. Clique em **Save**.

### A4. Avise o Claude

Escreva apenas "SMTP configurado". **Não cole a senha na conversa.** O Claude então:
- aplica os modelos em português de `supabase/templates/` (confirmação de e-mail e recuperação de senha) com os assuntos "Confirme seu e-mail na Vyrex" e "Recupere sua senha da Vyrex";
- confere o limite de envios por hora do Auth;
- pede que você crie uma conta de teste ou peça uma recuperação de senha com o seu e-mail, para ver o e-mail chegar em português.

Se o sistema de permissões impedir o Claude de aplicar os modelos, ele te passa o conteúdo para colar em **https://supabase.com/dashboard/project/zofxrohoilwjtzbcruse/auth/templates**.

---

## Parte B — Troca das chaves e do token

**Por quê:** em 28/10 a chave secreta, a `service_role` antiga e o token de acesso foram colados numa conversa. Quem tiver esses valores consegue ler e alterar o banco inteiro. A troca invalida os valores antigos.

**Ordem importa:** primeiro cria as novas e coloca no site, depois desliga as antigas. Assim o site não fica fora do ar.

### B1. Crie as chaves novas

1. Abra **https://supabase.com/dashboard/project/zofxrohoilwjtzbcruse/settings/api-keys**
2. Na aba das chaves novas (**API Keys**):
   - **Publishable key** (`sb_publishable_...`): se já existir uma, use-a; se não, crie.
   - **Secret keys**: clique em **Add new secret key** (nome "site-2026-10"). Copie a chave nova (`sb_secret_...`) assim que ela aparecer.

### B2. Coloque as chaves no site (sem colar em lugar nenhum)

1. No **terminal do VS Code** (não na conversa), rode:
   ```
   powershell -ExecutionPolicy Bypass -File scripts\trocar-chaves.ps1
   ```
2. O script pede as chaves uma por uma, **às escondidas** (o que você cola não aparece). Cole a publicável, depois a secreta. Quando pedir o token, aperte **Enter** por enquanto (ele é trocado no B4).
3. O script confere no Supabase se cada chave funciona antes de gravar no `.env.local`. Se alguma estiver errada, nada é alterado.

### B3. Feche e abra o VS Code e avise o Claude

O servidor só lê as chaves ao ligar. Escreva "chaves trocadas". O Claude confere o site com as chaves novas (login, painel, envio de prints, área da equipe) e roda os testes de navegador.

### B4. Desligue as chaves antigas (só depois do OK do Claude)

1. Na mesma página de API Keys:
   - **Secret keys**: apague a chave secreta **antiga** (a que não é "site-2026-10").
   - Aba **Legacy API keys**: clique em **Disable JWT-based API keys**. Isso desliga a `anon` e a `service_role` antigas (as que começam com `eyJ`), inclusive a que foi exposta.
2. **Token de acesso** (`sbp_...`):
   - Abra **https://supabase.com/dashboard/account/tokens** → **Generate new token** (nome "claude-vyrex") → copie.
   - Rode de novo `scripts\trocar-chaves.ps1`, aperte **Enter** nas duas chaves e cole o token novo no terceiro pedido.
   - Na lista de tokens, **revogue o antigo**.
3. Feche e abra o VS Code e escreva "chaves antigas desligadas". O Claude confere tudo de novo, incluindo os scripts de migrations e de cópia de segurança, que usam o token.

### Se algo der errado

- O site parou depois do B2: rode o script de novo com a chave certa. As antigas continuam valendo até o B4, então dá para voltar.
- Perdeu a chave secreta nova antes de copiar: crie outra (B1) e repita o B2.
- O projeto de **testes** (`ukwnnrrqmrvfwtbjjrbi`) não teve chaves expostas; não precisa mexer nele.
