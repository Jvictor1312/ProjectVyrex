import Link from "next/link";
import { BrandContact } from "./components/brand-contact";
import { SkipLink } from "./components/skip-link";
import { VyrexLogo } from "./components/vyrex-logo";
import styles from "./home.module.css";
import { getSignedInUser } from "@/lib/auth";

const facts = [
  { title: "Cadastro gratuito", text: "Não custa nada" },
  { title: "Sem mínimo de seguidores", text: "Quem está começando também pode" },
  { title: "Análise humana", text: "Pessoas conferem cada perfil" },
];

// As etapas reais do cadastro, na ordem em que acontecem.
const steps = [
  { title: "Crie sua conta", text: "Leva poucos minutos e é gratuito." },
  { title: "Complete seu perfil", text: "Conte sobre seu conteúdo e informe sua rede social." },
  { title: "Envie 3 Stories", text: "Prints de até 7 dias, com pelo menos 1.000 visualizações cada." },
  { title: "Acompanhe a análise", text: "A equipe confere tudo e responde pela sua conta." },
];

const faq = [
  {
    question: "Preciso pagar alguma coisa?",
    answer: "Não. Criar a conta e enviar o cadastro para análise é gratuito.",
  },
  {
    question: "Ser aprovado garante campanha ou pagamento?",
    answer:
      "Não. A aprovação coloca seu perfil na base de criadores que a Vyrex considera ao planejar campanhas. A participação em cada campanha depende do perfil que a marca procura.",
  },
  {
    question: "O que conta na análise?",
    answer:
      "A equipe confere sua rede social e os prints de 3 Stories recentes (de até 7 dias), cada um com pelo menos 1.000 visualizações. Não existe número mínimo de seguidores.",
  },
  {
    question: "Quem vê os prints que eu envio?",
    answer:
      "Só você e as pessoas da equipe responsáveis pela análise. Os arquivos ficam em armazenamento privado, sem endereço público.",
  },
  {
    question: "E se faltar alguma coisa no meu cadastro?",
    answer:
      "A equipe pede a correção, você ajusta o que foi indicado e envia de novo. Tudo fica registrado na sua conta.",
  },
];

// Três órbitas inclinadas, cada uma com um elétron, como um átomo.
const orbits = [
  { tilt: 0, duration: 46, electron: 9 },
  { tilt: 60, duration: 58, electron: 12 },
  { tilt: 120, duration: 52, electron: 10.5 },
];

export default async function HomePage() {
  // Quem já entrou vê o atalho para o painel em vez de "Entrar" e "Criar conta".
  // /login leva ao painel certo (criador ou equipe) sem pedir a senha de novo.
  const signedIn = await getSignedInUser();
  const firstName = signedIn?.user.name?.trim().split(/\s+/)[0] ?? null;

  return (
    <main className="landing">
      <SkipLink />
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Vyrex, página inicial">
          <VyrexLogo decorative />
        </Link>
        <nav className="topnav" aria-label="Navegação principal">
          <Link href="#como-funciona">Como funciona</Link>
          <Link href="#publicos">Para marcas</Link>
          <Link href="#perguntas">Dúvidas</Link>
          {signedIn ? (
            <Link className="button button-dark button-small" href="/login">
              {firstName ? `${firstName}, ir para o meu painel` : "Ir para o meu painel"}
            </Link>
          ) : (
            <>
              <Link href="/login">Entrar</Link>
              <Link className="button button-dark button-small" href="/cadastro">
                Quero me cadastrar
              </Link>
            </>
          )}
        </nav>
      </header>

      <section
        id="conteudo"
        tabIndex={-1}
        className={styles.hero}
        aria-labelledby="hero-title"
      >
        <div className={styles.heroCopy}>
          <h1 id="hero-title" className={styles.heroTitle}>
            Criadores e marcas, na mesma órbita.
          </h1>
          <p className={styles.heroText}>
            A Vyrex é uma agência de marketing de influência. Crie seu perfil
            de criador, mostre o alcance dos seus Stories e, depois da análise
            da nossa equipe, passe a fazer parte da base de criadores que
            consideramos ao planejar campanhas com marcas.
          </p>
          <div className={styles.heroActions}>
            {signedIn ? (
              <Link className={styles.primary} href="/login">
                Ir para o meu painel
              </Link>
            ) : (
              <>
                <Link className={styles.primary} href="/cadastro">
                  Criar meu perfil grátis
                </Link>
                <Link className={styles.secondary} href="/login">
                  Já tenho conta
                </Link>
              </>
            )}
          </div>
          <ul className={styles.facts}>
            {facts.map((fact) => (
              <li key={fact.title}>
                <span className={styles.check} aria-hidden="true">
                  ✓
                </span>
                <span>
                  <strong>{fact.title}</strong>
                  {fact.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.atom} aria-hidden="true">
          {orbits.map((orbit) => (
            <div
              key={orbit.tilt}
              className={styles.orbitTilt}
              style={{ transform: `rotate(${orbit.tilt}deg)` }}
            >
              <div
                className={styles.orbit}
                style={{ animationDuration: `${orbit.duration}s` }}
              >
                <span
                  className={styles.electron}
                  style={{ animationDuration: `${orbit.electron}s` }}
                />
              </div>
            </div>
          ))}
          <div className={styles.nucleus}>
            <VyrexLogo className={styles.nucleusLogo} decorative />
          </div>
        </div>
      </section>

      <section className={styles.steps} id="como-funciona" aria-label="Como funciona">
        <h2>Como funciona</h2>
        <ol>
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <span>
                <strong>{step.title}</strong>
                {step.text}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.audiences} id="publicos">
        <article className={styles.audienceDark}>
          <h2>Para criadores</h2>
          <p>
            Um cadastro simples, analisado por pessoas, para você ser
            considerado nas campanhas que a Vyrex planeja.
          </p>
          <Link className={styles.linkLight} href="/cadastro">
            Começar meu cadastro →
          </Link>
        </article>
        <article className={styles.audienceLight}>
          <h2>Para marcas</h2>
          <p>
            Planejamos a campanha a partir do seu público e selecionamos
            criadores compatíveis, com entregas acompanhadas.
          </p>
          <BrandContact className={styles.linkDark} />
        </article>
      </section>

      <section className={styles.closing} id="perguntas">
        <div className={styles.faq}>
          <h2>Dúvidas</h2>
          {faq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
        <div className={styles.finalCta}>
          <h2>Seu perfil pode ser o próximo.</h2>
          <Link className={styles.primaryLight} href="/cadastro">
            Criar meu perfil grátis
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <Link className="brand" href="/" aria-label="Vyrex, página inicial">
          <VyrexLogo decorative />
        </Link>
        <span>© 2026 Vyrex</span>
      </footer>
    </main>
  );
}
