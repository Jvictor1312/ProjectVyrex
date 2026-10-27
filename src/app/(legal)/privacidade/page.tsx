import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
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
        <h1>Privacidade</h1>
        <p className="legal-alert">
          Rascunho para desenvolvimento. Controlador, contato de privacidade,
          prazos de retenção e fornecedores devem ser confirmados antes da
          operação pública.
        </p>
        <h2>Dados tratados</h2>
        <p>
          O cadastro pode tratar nome, e-mail, contato, cidade e estado
          opcionais, descrição do perfil, categorias, endereços públicos de
          redes sociais, métricas informadas e imagens enviadas como evidência.
        </p>
        <h2>Finalidades</h2>
        <p>
          Esses dados são usados para autenticar a conta, manter o perfil,
          analisar manualmente a elegibilidade, comunicar pendências e registrar
          decisões da equipe.
        </p>
        <h2>Acesso e proteção</h2>
        <p>
          O desenho técnico restringe o acesso do criador aos próprios dados,
          limita o acesso interno por função e atribuição, e guarda imagens em
          armazenamento privado. Imagens não são prova automática de métricas.
        </p>
        <h2>Direitos e retenção</h2>
        <p>
          Os meios de atendimento aos direitos previstos na legislação, os
          prazos de retenção e o canal responsável precisam ser definidos pela
          empresa e incluídos nesta política antes do lançamento.
        </p>
        <p className="legal-version">
          Versão de desenvolvimento: 2026-10-14. A política final deve
          identificar o controlador e os operadores efetivamente contratados.
        </p>
      </article>
    </main>
  );
}
