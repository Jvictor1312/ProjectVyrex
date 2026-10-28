import Link from "next/link";
import styles from "./home.module.css";

const steps = [
  {
    title: "Você se cadastra",
    text: "Perfil, redes sociais e prints dos seus Stories.",
  },
  {
    title: "A equipe analisa",
    text: "Cada perfil é conferido por uma pessoa, não por robô.",
  },
  {
    title: "Conectamos às marcas",
    text: "Perfis aprovados entram na base para campanhas compatíveis.",
  },
];

const criteria = [
  { title: "Sem mínimo de seguidores", text: "Quem está começando também entra." },
  { title: "3 Stories obrigatórios", text: "Prints recentes, até 5 no total." },
  { title: "1.000 visualizações", text: "Por Story enviado." },
  { title: "Análise humana", text: "Números conferidos pela equipe." },
];

const faq = [
  {
    question: "Como funciona o cadastro?",
    answer:
      "Crie a conta, informe seu perfil e suas redes, envie os prints dos Stories e mande para análise.",
  },
  {
    question: "Ser aprovado garante campanha ou pagamento?",
    answer:
      "Não. A aprovação coloca seu perfil na base de criadores elegíveis para futuras campanhas.",
  },
  {
    question: "Quem vê as evidências que eu envio?",
    answer:
      "Só você e a equipe autorizada. Os arquivos ficam em armazenamento privado.",
  },
  {
    question: "E se houver uma pendência?",
    answer:
      "A equipe pede a correção e você acompanha tudo pelas mensagens da plataforma.",
  },
  {
    question: "O que a Vyrex faz por uma marca?",
    answer:
      "Planeja a campanha, seleciona criadores compatíveis, coordena as entregas e reúne os resultados.",
  },
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
          <Link href="#criterios">Critérios</Link>
          <Link href="#perguntas">Dúvidas</Link>
          <Link href="/login">Entrar</Link>
          <Link className="button button-dark button-small" href="/cadastro">
            Quero me cadastrar <span aria-hidden="true">↗</span>
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

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">
            Marketing de influência <em>com estratégia.</em>
          </h1>
          <p className="hero-description">
            Conectamos marcas a criadores compatíveis, com análise humana do
            cadastro à campanha.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" href="/cadastro">
              Fazer meu cadastro <span aria-hidden="true">↗</span>
            </Link>
            <a className="text-link" href="#como-funciona">
              Conheça a Vyrex <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <div className="hero-art" aria-label="Identidade Vyrex">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="brand-disc">
            <span>VYREX</span>
          </div>
        </div>
      </section>

      <section className={styles.section} id="como-funciona">
        <h2 className={styles.title}>Como funciona</h2>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li className={styles.step} key={step.title}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} id="publicos">
        <div className={styles.audiences}>
          <article className={`${styles.audience} ${styles.audienceDark}`}>
            <h2>Para criadores</h2>
            <p>
              Monte seu perfil, envie seus Stories e acompanhe a análise da
              equipe pela plataforma.
            </p>
            <Link className={styles.ctaLight} href="/cadastro">
              Criar minha conta
            </Link>
          </article>
          <article className={styles.audience}>
            <h2>Para marcas</h2>
            <p>
              Planejamos a campanha a partir do seu público e objetivo, e
              selecionamos criadores compatíveis.
            </p>
            <a className={styles.ctaDark} href="#perguntas">
              Saiba como funciona
            </a>
          </article>
        </div>
      </section>

      <section className={styles.section} id="criterios">
        <h2 className={styles.title}>Critérios para criadores</h2>
        <ul className={styles.criteria}>
          {criteria.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} id="perguntas">
        <h2 className={styles.title}>Dúvidas</h2>
        <div className={styles.faq}>
          {faq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.finalCta}>
        <h2>Pronto para começar?</h2>
        <Link className={styles.ctaLight} href="/cadastro">
          Criar minha conta
        </Link>
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
