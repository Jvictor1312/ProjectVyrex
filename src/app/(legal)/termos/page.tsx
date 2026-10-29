import type { Metadata } from "next";
import Link from "next/link";
import { VyrexLogo } from "@/app/components/vyrex-logo";
import { legal } from "@/lib/legal";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermsPage() {
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
          <span /> TERMOS
        </p>
        <h1>Termos de uso</h1>
        <p>
          Estes termos são as regras para usar a Vyrex. Ao criar sua conta,
          você declara que leu e concorda com eles e com a{" "}
          <Link href="/privacidade">Política de privacidade</Link>.
        </p>

        <h2>1. O que é a Vyrex</h2>
        <p>
          A Vyrex é uma plataforma operada por {legal.ownerName}, pessoa
          física, que recruta e avalia criadores de conteúdo digital para
          possíveis parcerias com marcas. O criador se cadastra, informa suas
          redes sociais e envia prints de Stories, e a equipe analisa se o
          cadastro atende aos critérios de elegibilidade.
        </p>

        <h2>2. Quem pode se cadastrar</h2>
        <p>
          Pessoas com 18 anos ou mais, que tenham um perfil próprio nas redes
          sociais informadas. Cada pessoa pode ter uma única conta, e a conta
          é pessoal: não compartilhe sua senha.
        </p>

        <h2>3. Suas responsabilidades</h2>
        <ul>
          <li>Informar dados verdadeiros e mantê-los atualizados.</li>
          <li>
            Enviar apenas prints reais, dos seus próprios perfis, sem edição
            dos números.
          </li>
          <li>
            Não enviar conteúdo de terceiros sem autorização, arquivos
            maliciosos ou dados pessoais de outras pessoas.
          </li>
          <li>
            Não tentar acessar dados de outros usuários nem burlar as regras da
            plataforma.
          </li>
        </ul>

        <h2>4. Como funciona a análise</h2>
        <p>
          Os números que você informa não são considerados verdadeiros
          automaticamente: a equipe confere cada print e cada rede. Durante a
          análise, a equipe pode pedir correções ou esclarecimentos. A decisão
          final (aprovado ou não aprovado) leva em conta os critérios em vigor,
          que podem mudar com o tempo.
        </p>

        <h2>5. Aprovação não é contratação</h2>
        <p>
          A aprovação significa apenas que o cadastro atende aos critérios da
          Vyrex. Ela não garante campanha, contato de marcas, contratação,
          remuneração ou qualquer pagamento. Parcerias com marcas, se
          acontecerem, terão condições próprias, combinadas e aceitas à parte.
        </p>

        <h2>6. Compartilhamento com marcas</h2>
        <p>
          Ao se cadastrar, você autoriza a Vyrex a apresentar seu nome completo
          e os perfis de redes sociais informados a marcas parceiras, conforme
          a Política de privacidade. Nenhum outro dado seu é repassado.
        </p>

        <h2>7. Suspensão e encerramento</h2>
        <p>
          A Vyrex pode suspender ou encerrar um cadastro que descumpra estes
          termos, que tenha informações falsas ou que coloque em risco a
          plataforma ou outros usuários. A suspensão é registrada com o motivo,
          e você é avisado pela plataforma. Você também pode pedir o
          encerramento da sua conta a qualquer momento, em Configurações →
          Privacidade ou pelo e-mail {email}.
        </p>

        <h2>8. Disponibilidade</h2>
        <p>
          Trabalhamos para manter a plataforma no ar e segura, mas ela pode
          ficar indisponível por manutenção ou por falhas de fornecedores. Não
          nos responsabilizamos por perdas causadas por essas interrupções,
          exceto nos casos em que a lei determinar.
        </p>

        <h2>9. Mudanças nestes termos</h2>
        <p>
          Estes termos podem ser atualizados. Mudanças importantes serão
          avisadas pela plataforma ou por e-mail, e continuar usando a Vyrex
          depois do aviso significa concordar com a nova versão.
        </p>

        <h2>10. Contato e foro</h2>
        <p>
          Dúvidas ou reclamações: {email}. Estes termos seguem as leis
          brasileiras. Eventuais disputas serão resolvidas no foro da cidade
          onde você mora.
        </p>

        <p className="legal-version">Versão de {legal.versionLabel}.</p>
      </article>
    </main>
  );
}
