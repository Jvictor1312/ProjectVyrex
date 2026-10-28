import Link from "next/link";
import { BrandContact } from "./components/brand-contact";
import styles from "./home.module.css";

const facts = [
  { title: "Cadastro gratuito", text: "Leva poucos minutos" },
  { title: "Sem mínimo de seguidores", text: "Quem está começando entra" },
  { title: "Análise humana", text: "Cada perfil é conferido" },
];

const steps = [
  { title: "Crie seu perfil", text: "Conte quem você é e informe suas redes." },
  { title: "Envie 3 Stories", text: "Prints recentes com 1.000+ visualizações." },
  { title: "Entre na rede", text: "Aprovado, seu perfil fica visível às marcas." },
];

const faq = [
  {
    question: "Ser aprovado garante campanha ou pagamento?",
    answer:
      "Não. A aprovação coloca seu perfil na base de criadores elegíveis para futuras campanhas.",
  },
  {
    question: "Quem vê os prints que eu envio?",
    answer:
      "Só você e a equipe autorizada. Os arquivos ficam em armazenamento privado.",
  },
  {
    question: "E se faltar alguma coisa no meu cadastro?",
    answer:
      "A equipe pede a correção e você acompanha tudo pelas mensagens da plataforma.",
  },
];

// Três órbitas inclinadas, cada uma com um elétron, como um átomo.
const orbits = [
  { tilt: 0, duration: 46, electron: 9 },
  { tilt: 60, duration: 58, electron: 12 },
  { tilt: 120, duration: 52, electron: 10.5 },
];

export default function HomePage() {
  return (
    <main className="landing">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Vyrex, página inicial">
          <span className="brand-mark">V</span>
          <span>VYREX</span>
        </Link>
        <nav className="topnav" aria-label="Navegação principal">
          <Link href="#como-funciona">Como funciona</Link>
          <Link href="#publicos">Para marcas</Link>
          <Link href="#perguntas">Dúvidas</Link>
          <Link href="/login">Entrar</Link>
          <Link className="button button-dark button-small" href="/cadastro">
            Quero me cadastrar
          </Link>
        </nav>
      </header>

      {process.env.NODE_ENV === "development" && (
        <nav className="preview-strip" aria-label="Pré-visualizações locais">
          <span>DEMONSTRAÇÕES LOCAIS</span>
          <Link href="/preview/criador">Painel do criador</Link>
          <Link href="/preview/equipe">Painel da equipe</Link>
        </nav>
      )}

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <h1 id="hero-title" className={styles.heroTitle}>
            Criadores e marcas, na mesma órbita.
          </h1>
          <p className={styles.heroText}>
            A Vyrex é uma agência de marketing de influência. Cadastre seu
            perfil de criador, mostre seus resultados e entre na rede que as
            marcas consultam para suas campanhas.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primary} href="/cadastro">
              Criar meu perfil grátis
            </Link>
            <Link className={styles.secondary} href="/login">
              Já tenho conta
            </Link>
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
            <span>VYREX</span>
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
            Um perfil organizado, analisado por pessoas, pronto para ser
            encontrado por marcas.
          </p>
          <Link className={styles.linkLight} href="/cadastro">
            Começar agora →
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
        <Link className="brand" href="/" aria-label="Vyrex">
          <span className="brand-mark">V</span>
          <span>VYREX</span>
        </Link>
        <span>© 2026 VYREX</span>
      </footer>
    </main>
  );
}
