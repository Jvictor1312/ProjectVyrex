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
          <h1 id="confirmation-title">Agora, confirme seu e-mail.</h1>
          <p>
            Se o cadastro puder ser concluído, enviamos um link de confirmação
            para o e-mail informado. Abra a mensagem e toque no link; depois,
            entre na sua conta para completar o perfil. Não chegou em alguns
            minutos? Confira as pastas de spam e promoções. Já tem uma conta com esse e-mail? Entre com sua senha ou use{" "}
            <Link href="/recuperar-senha">Esqueci minha senha</Link>.
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
