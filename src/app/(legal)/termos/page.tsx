import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermsPage() {
  return (
    <main className="legal-page">
      <Link className="brand" href="/">
        <span className="brand-mark">V</span>
        <span>VYREX</span>
      </Link>
      <article>
        <p className="eyebrow">
          <span /> DOCUMENTO PRELIMINAR
        </p>
        <h1>Termos de uso</h1>
        <p className="legal-alert">
          Rascunho para desenvolvimento. Deve ser revisado e aprovado pela
          empresa e por assessoria jurídica antes de qualquer operação pública.
        </p>
        <h2>Cadastro e análise</h2>
        <p>
          A plataforma permite que criadores apresentem informações sobre seus
          perfis e enviem evidências para análise manual. O usuário é
          responsável por manter os dados corretos e por ter autorização para
          compartilhar os arquivos enviados.
        </p>
        <h2>Elegibilidade não é contratação</h2>
        <p>
          A aprovação significa apenas que o cadastro atende aos critérios de
          elegibilidade vigentes. Não garante campanha, contato, contratação,
          remuneração ou qualquer pagamento. Campanhas futuras, se houver,
          dependerão de condições próprias e aceite específico.
        </p>
        <h2>Integridade das evidências</h2>
        <p>
          Os números informados não são aceitos como verificados
          automaticamente. A equipe poderá solicitar esclarecimentos ou
          correções, aprovar ou rejeitar o cadastro conforme os critérios
          aplicáveis.
        </p>
        <h2>Uso responsável</h2>
        <p>
          Não envie conteúdo de terceiros sem autorização, arquivos maliciosos
          ou informações pessoais desnecessárias. A empresa poderá suspender
          cadastros quando houver necessidade de proteger a plataforma ou seus
          usuários, conforme regras finais a serem publicadas.
        </p>
        <p className="legal-version">
          Versão de desenvolvimento: 2026-10-14. Este texto não substitui os
          termos comerciais e legais finais.
        </p>
      </article>
    </main>
  );
}
