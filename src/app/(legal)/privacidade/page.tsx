import type { Metadata } from "next";
import Link from "next/link";
import { VyrexLogo } from "@/app/components/vyrex-logo";
import { legal } from "@/lib/legal";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  const email = (
    <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>
  );

  return (
    <main className="legal-page">
      <Link className="brand" href="/">
        <VyrexLogo />
      </Link>
      <article>
        <p className="eyebrow">
          <span /> PRIVACIDADE
        </p>
        <h1>Política de privacidade</h1>
        <p>
          Esta política explica, em linguagem simples, quais dados a Vyrex
          coleta, para que usa, com quem compartilha, por quanto tempo guarda e
          como você pode exercer seus direitos, conforme a Lei Geral de Proteção
          de Dados (Lei 13.709/2018, a LGPD).
        </p>

        <h2>1. Quem é o responsável pelos seus dados</h2>
        <p>
          A Vyrex é operada por {legal.ownerName}, pessoa física, que é o
          controlador dos dados tratados na plataforma. Para qualquer assunto
          sobre seus dados, escreva para {email}.
        </p>

        <h2>2. Quais dados coletamos</h2>
        <ul>
          <li>
            <strong>Conta:</strong> nome completo, e-mail, senha (guardada de
            forma cifrada; ninguém da equipe consegue vê-la), celular e CPF,
            estes dois opcionais.
          </li>
          <li>
            <strong>Perfil de criador:</strong> nome público, descrição, cidade,
            estado e categorias de conteúdo.
          </li>
          <li>
            <strong>Redes sociais:</strong> plataforma, nome de usuário, endereço
            do perfil e número de seguidores que você informar.
          </li>
          <li>
            <strong>Evidências:</strong> as imagens (prints de Stories) que você
            enviar, com a data e as visualizações informadas.
          </li>
          <li>
            <strong>Histórico da análise:</strong> situação do cadastro,
            mensagens trocadas com a equipe, pedidos de correção, decisões e
            seus motivos.
          </li>
          <li>
            <strong>Dados técnicos:</strong> data do aceite destes documentos,
            registros de acesso e um resumo cifrado do endereço de rede, usado
            só para limitar tentativas repetidas de login e de recuperação de
            senha.
          </li>
        </ul>

        <h2>3. Para que usamos</h2>
        <ul>
          <li>Criar e proteger sua conta e permitir que você entre nela.</li>
          <li>
            Analisar seu cadastro: conferir se você atende aos critérios de
            elegibilidade da Vyrex.
          </li>
          <li>
            Falar com você sobre o cadastro: pendências, correções, decisões e
            recuperação de senha.
          </li>
          <li>
            Apresentar criadores aprovados a marcas parceiras (veja o item 4).
          </li>
          <li>
            Cumprir obrigações legais e nos defender em eventuais processos.
          </li>
        </ul>
        <p>
          As bases legais são a execução do contrato e dos procedimentos
          preliminares que você pede ao se cadastrar (art. 7º, V, da LGPD), o
          cumprimento de obrigação legal (art. 7º, II), o exercício regular de
          direitos (art. 7º, VI) e o legítimo interesse em manter a plataforma
          segura (art. 7º, IX). Não vendemos seus dados.
        </p>

        <h2>4. Com quem compartilhamos</h2>
        <ul>
          <li>
            <strong>Marcas parceiras:</strong> recebem apenas o seu{" "}
            <strong>nome completo</strong> e os{" "}
            <strong>perfis nas redes sociais</strong> que você informou, para
            avaliar parcerias. E-mail, celular, CPF, prints e mensagens não são
            repassados.
          </li>
          <li>
            <strong>Supabase:</strong> empresa que hospeda o banco de dados, os
            arquivos e o login da plataforma, com servidores nos Estados Unidos.
          </li>
          <li>
            <strong>Google (Gmail):</strong> usado para enviar os e-mails de
            confirmação de conta e de recuperação de senha.
          </li>
          <li>
            <strong>Autoridades:</strong> somente quando a lei ou uma ordem
            judicial exigir.
          </li>
        </ul>
        <p>
          Como o Supabase e o Google guardam ou processam dados fora do Brasil,
          há transferência internacional de dados. Ela ocorre para a execução
          do serviço que você pediu (art. 33, IX, da LGPD), com fornecedores
          que adotam medidas de segurança reconhecidas no mercado.
        </p>

        <h2>5. Por quanto tempo guardamos</h2>
        <ul>
          <li>
            Enquanto sua conta estiver ativa, os dados ficam guardados para o
            funcionamento da plataforma.
          </li>
          <li>
            Depois que a conta é encerrada, ou depois da decisão final de um
            cadastro, guardamos os dados por até {legal.retentionYears} anos,
            para cumprir obrigações legais, responder a dúvidas e nos defender
            em eventuais processos (é o prazo geral para reclamações de
            consumo).
          </li>
          <li>
            Passado esse prazo, os dados são apagados ou tornados anônimos.
          </li>
        </ul>

        <h2>6. Como protegemos</h2>
        <p>
          Cada criador só vê os próprios dados. Na equipe, cada pessoa só acessa
          o que a função dela exige. Os prints ficam em armazenamento privado,
          e as ações importantes ficam registradas com data e responsável. A
          conexão com o site é cifrada (HTTPS).
        </p>

        <h2>7. Seus direitos</h2>
        <p>
          Você pode, a qualquer momento: confirmar se tratamos seus dados,
          acessá-los, corrigir dados errados ou desatualizados, pedir uma cópia,
          pedir a exclusão, saber com quem os compartilhamos e revogar um
          consentimento.
        </p>
        <p>
          Para isso, entre na sua conta e use <strong>Configurações →
          Privacidade</strong>, ou escreva para {email}. Respondemos em até 15
          dias. Alguns dados podem ser mantidos mesmo após um pedido de
          exclusão, quando a lei permitir (item 5). Se não ficar satisfeito,
          você pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>

        <h2>8. Cookies</h2>
        <p>
          Usamos apenas cookies necessários: os que mantêm você conectado e o
          que lembra o modo claro ou escuro do painel da equipe. Não usamos
          cookies de publicidade nem de rastreamento.
        </p>

        <h2>9. Idade mínima</h2>
        <p>
          A Vyrex é destinada a maiores de 18 anos. Se soubermos que um
          cadastro foi feito por menor de idade, ele poderá ser encerrado.
        </p>

        <h2>10. Mudanças nesta política</h2>
        <p>
          Se esta política mudar de forma importante, avisaremos pela
          plataforma ou por e-mail. A data da versão em vigor fica abaixo.
        </p>

        <p className="legal-version">
          Versão de {legal.versionLabel}. Veja também os{" "}
          <Link href="/termos">Termos de uso</Link>.
        </p>
      </article>
    </main>
  );
}
