import Link from "next/link";

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
          <p className="eyebrow">
            <span /> MARKETING DE INFLUÊNCIA
          </p>
          <h1 id="hero-title">
            Marketing de influência <em>com estratégia.</em>
          </h1>
          <p className="hero-description">
            Nossa proposta é combinar tecnologia própria e operação estratégica
            para aproximar marcas de criadores compatíveis, organizar entregas e
            acompanhar os resultados disponíveis.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" href="/cadastro">
              Fazer meu cadastro <span aria-hidden="true">↗</span>
            </Link>
            <a className="text-link" href="#como-funciona">
              Conheça a Vyrex <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="hero-note">
            Estamos estruturando a operação e formando a rede de criadores. O
            cadastro é gratuito e não garante campanha, contratação ou renda.
          </p>
        </div>
        <div className="hero-art" aria-label="Identidade Vyrex">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="brand-disc">
            <span>VYREX</span>
          </div>
          <span className="art-label label-top">CRIADORES, EM MOVIMENTO</span>
          <span className="art-label label-bottom">
            MARCAS&nbsp; · &nbsp;CRIADORES
          </span>
          <span className="art-index">01 — 05</span>
        </div>
      </section>

      <section className="principles" id="como-funciona">
        <div className="principles-intro">
          <p className="eyebrow">A PROPOSTA VYREX</p>
          <h2>Tecnologia própria. Estratégia e execução.</h2>
        </div>
        <article className="principle">
          <span className="principle-number">01</span>
          <h3>Entender o objetivo</h3>
          <p>
            Público, região, nicho, formato e orçamento orientam o planejamento
            de cada campanha.
          </p>
        </article>
        <article className="principle">
          <span className="principle-number">02</span>
          <h3>Selecionar com contexto</h3>
          <p>
            Seguidores não contam sozinhos. Nicho, localização, métricas e
            compatibilidade também importam.
          </p>
        </article>
        <article className="principle">
          <span className="principle-number">03</span>
          <h3>Acompanhar a entrega</h3>
          <p>
            A proposta é coordenar publicações, conferir entregas e reunir os
            resultados disponíveis para a marca.
          </p>
        </article>
      </section>

      <section className="public-info audience-section" id="publicos">
        <div>
          <p className="eyebrow">DOIS LADOS, UMA OPERAÇÃO</p>
          <h2>Conexões que começam com compatibilidade.</h2>
          <p>
            A plataforma está sendo construída para organizar a rede e apoiar a
            futura operação comercial da VYREX.
          </p>
        </div>
        <ul className="audience-points">
          <li>
            <strong>Para marcas</strong>
            <span>
              A proposta é planejar, selecionar e coordenar criadores alinhados
              ao público, objetivo e orçamento da campanha.
            </span>
          </li>
          <li>
            <strong>Para criadores</strong>
            <span>
              Um perfil organizado para análise manual e possíveis campanhas
              compatíveis. A aprovação não garante trabalho ou pagamento.
            </span>
          </li>
        </ul>
      </section>

      <section className="public-info eligibility-section" id="criterios">
        <div>
          <p className="eyebrow">CRITÉRIOS DE ELEGIBILIDADE</p>
          <h2>Uma análise humana, com critérios claros.</h2>
          <p>
            Seguidores ajudam a orientar a prioridade conforme cada campanha,
            mas não são um corte para entrar na rede. Criadores em início de
            jornada também podem se cadastrar.
          </p>
        </div>
        <div>
          <ul className="eligibility-points">
            <li>
              <strong>Sem mínimo de seguidores</strong>
              <span>
                Audiências maiores podem ter prioridade conforme a campanha, sem
                excluir quem está começando.
              </span>
            </li>
            <li>
              <strong>Cinco evidências</strong>
              <span>Stories recentes, identificados individualmente.</span>
            </li>
            <li>
              <strong>1.000 visualizações por Story</strong>
              <span>
                Cinco evidências recentes, analisadas individualmente pela
                equipe.
              </span>
            </li>
            <li>
              <strong>Validação manual</strong>
              <span>
                A equipe confere perfis e evidências. Imagens não comprovam
                métricas automaticamente.
              </span>
            </li>
          </ul>
          <p className="public-note">
            O limite inicial de idade das evidências é de sete dias. Os valores
            de visualizações e idade podem ser alterados por um administrador
            autorizado. Seguidores não são um requisito mínimo para cadastro ou
            aprovação.
          </p>
        </div>
      </section>

      <section className="public-info faq-section" id="perguntas">
        <div>
          <p className="eyebrow">PERGUNTAS FREQUENTES</p>
          <h2>O que esperar do processo.</h2>
        </div>
        <div className="faq-list">
          <details>
            <summary>Como funciona o cadastro?</summary>
            <p>
              Você cria uma conta, informa seu perfil e suas redes, envia cinco
              evidências e encaminha os dados para análise manual.
            </p>
          </details>
          <details>
            <summary>Os números são verificados automaticamente?</summary>
            <p>
              Não. Seguidores e visualizações são informados por você e
              conferidos pela equipe. Uma captura de tela não é validação
              automática.
            </p>
          </details>
          <details>
            <summary>O que acontece se houver uma pendência?</summary>
            <p>
              A equipe pode solicitar uma correção. Você acompanha a solicitação
              e as mensagens na sua área da plataforma.
            </p>
          </details>
          <details>
            <summary>Ser aprovado garante uma campanha ou pagamento?</summary>
            <p>
              Não. A aprovação indica elegibilidade para integrar a base da
              Vyrex; não garante campanha, contratação, trabalho ou pagamento.
            </p>
          </details>
          <details>
            <summary>O que a VYREX faz para uma marca?</summary>
            <p>
              A proposta é partir do objetivo e do público da empresa para
              planejar a campanha, selecionar criadores compatíveis, coordenar
              entregas e reunir resultados disponíveis. Vendas não são
              garantidas.
            </p>
          </details>
          <details>
            <summary>Quem pode ver as evidências que envio?</summary>
            <p>
              Os arquivos ficam em armazenamento privado e são acessíveis ao
              titular e à equipe autorizada para a análise.
            </p>
          </details>
          <details>
            <summary>Como faço um pedido sobre meus dados?</summary>
            <p>
              Depois de entrar, acesse Privacidade para registrar um pedido. A
              equipe analisa e responde pela plataforma; o atendimento não é
              automático.
            </p>
          </details>
        </div>
      </section>

      <footer className="site-footer">
        <Link className="brand" href="/" aria-label="Vyrex">
          <span className="brand-mark">V</span>
          <span>VYREX</span>
        </Link>
        <p>Presença que abre caminhos.</p>
        <span>© 2026 VYREX</span>
      </footer>
    </main>
  );
}
