import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CreatorProfileForm,
  CreatorWizard,
  SocialAccountForm,
} from "@/app/components/creator-forms";
import { CreatorNav } from "@/app/components/creator-nav";
import { EvidenceBoard } from "@/app/components/evidence-board";
import { VyrexLogo } from "@/app/components/vyrex-logo";

// "Meu cadastro" com os mesmos componentes da tela real e dados fictícios,
// sem login (para conferir o layout, principalmente no celular). Salvar exige
// login.
export default function CreatorProfilePreview() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="dashboard-page">
      <header className="dashboard-header creator-header">
        <Link className="brand" href="/">
          <VyrexLogo />
        </Link>
        <CreatorNav />
        <Link className="quiet-button" href="/login">
          Entrar na conta
        </Link>
      </header>
      <section className="profile-content">
        <h1>Meu cadastro</h1>
        <p className="profile-lede">
          Prévia com dados fictícios. Tudo é salvo enquanto você preenche.
        </p>
        <CreatorWizard
          steps={[
            { title: "Perfil", panelId: "perfil", complete: true, help: "Como você quer ser apresentado." },
            { title: "Redes sociais", panelId: "redes", complete: false, help: "Seu perfil público e quantos seguidores você tem." },
            { title: "Evidências", panelId: "evidencias", complete: false, help: "Os Stories mais recentes. Os 3 primeiros são obrigatórios." },
            { title: "Revisão e envio", panelId: "revisao", complete: false, help: "Confira tudo e envie para a equipe." },
          ]}
        >
          <section className="profile-section" id="perfil" data-wizard-step="0">
            <div className="section-heading">
              <span className="principle-number">01</span>
              <div>
                <h2>Seu perfil</h2>
                <p>Informações essenciais para apresentar seu trabalho.</p>
              </div>
            </div>
            <CreatorProfileForm
              initial={{
                publicName: "Marina Costa",
                city: "Campinas",
                region: "SP",
                biography: "Rotina, moda acessível e viagens curtas.",
                categories: ["lifestyle", "fashion"],
              }}
            />
          </section>
          <section className="profile-section" id="redes" data-wizard-step="1">
            <div className="section-heading">
              <span className="principle-number">02</span>
              <div>
                <h2>Redes sociais</h2>
                <p>Seguidores são informados por você e conferidos pela equipe.</p>
              </div>
            </div>
            <SocialAccountForm />
          </section>
          <section className="profile-section" id="evidencias" data-wizard-step="2">
            <div className="section-heading">
              <span className="principle-number">03</span>
              <div>
                <h2>Evidências</h2>
                <p>Escolha os prints dos Stories e salve tudo junto.</p>
              </div>
            </div>
            <EvidenceBoard
              slots={[1, 2, 3, 4, 5].map((position) => ({
                position,
                uploaded: false,
                statusLabel: "Pendente",
                needsAttention: false,
              }))}
              socialAccounts={[{ id: "demo", platform: "instagram", handle: "marina.demo" }]}
              minimumViews={1000}
              maxStoryAgeDays={7}
              canEdit
            />
          </section>
          <section className="profile-section" id="revisao" data-wizard-step="3">
            <div className="section-heading">
              <span className="principle-number">04</span>
              <div>
                <h2>Revise seu cadastro</h2>
                <p>Na tela real, aqui aparecem o resumo e o botão de envio.</p>
              </div>
            </div>
          </section>
        </CreatorWizard>
      </section>
    </main>
  );
}
