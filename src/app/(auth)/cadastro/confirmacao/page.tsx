import type { Metadata } from "next";
import Link from "next/link";
import { VyrexLogo } from "@/app/components/vyrex-logo";

export const metadata: Metadata = { title: "Confirme seu cadastro" };

export default function SignupConfirmationPage() {
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/">
        <VyrexLogo />
      </Link>
      <section className="auth-form" aria-labelledby="confirmation-title">
        <div className="auth-heading">
          <p className="eyebrow">
            <span /> VYREX / CRIADORES
          </p>
          <h1 id="confirmation-title">Confira seu e-mail.</h1>
          <p>
            Se o cadastro puder ser concluído, as próximas instruções serão
            enviadas ao endereço informado. Após confirmar o e-mail, entre para
            continuar seu perfil.
          </p>
        </div>
        <nav className="auth-links" aria-label="Próximos passos">
          <Link href="/login">Ir para entrar</Link>
          <Link href="/">Voltar ao início</Link>
        </nav>
      </section>
      <p className="auth-footer">Sua presença, novas possibilidades.</p>
    </main>
  );
}
