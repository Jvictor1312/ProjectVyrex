"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";

export function SignupExperience({ children }: { children: ReactNode }) {
  const [showcaseVisible, setShowcaseVisible] = useState(true);

  return (
    <main
      className={`signup-layout${showcaseVisible ? "" : " signup-layout--showcase-hidden"}`}
    >
      {showcaseVisible && (
        <SignupShowcase onCollapse={() => setShowcaseVisible(false)} />
      )}
      <section className="signup-form-panel">
        <header className="signup-form-header">
          <Link className="brand" href="/" aria-label="Vyrex, página inicial">
            <span className="brand-mark">V</span>
            <span>VYREX</span>
          </Link>
          <div className="signup-form-header-actions">
            {!showcaseVisible && (
              <button
                className="signup-showcase-reopen"
                type="button"
                onClick={() => setShowcaseVisible(true)}
              >
                Mostrar apresentação
              </button>
            )}
            <p>
              Já tem uma conta? <Link href="/login">Entrar</Link>
            </p>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

function SignupShowcase({ onCollapse }: { onCollapse: () => void }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && dialogOpen && !dialog.open) dialog.showModal();
  }, [dialogOpen]);

  function moveOrb(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    setPosition({ x: x * 16, y: y * 16 });
  }

  return (
    <>
      <section
        className="signup-showcase"
        aria-label="Conheça a Vyrex"
        onPointerMove={moveOrb}
        onPointerLeave={() => setPosition({ x: 0, y: 0 })}
      >
        <Link
          className="signup-showcase-brand"
          href="/"
          aria-label="Vyrex, início"
        >
          <span className="brand-mark">V</span>
          <span>VYREX</span>
        </Link>

        <div className="signup-showcase-center">
          <p className="signup-showcase-kicker">
            CRIADORES · CONEXÕES · ANÁLISE HUMANA
          </p>
          <button
            className="signup-orb"
            type="button"
            style={{
              transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
            }}
            aria-haspopup="dialog"
            aria-expanded={dialogOpen}
            onClick={() => setDialogOpen(true)}
          >
            <span className="signup-orb-word">VYREX</span>
            <span className="signup-orb-prompt">Conheça a empresa</span>
          </button>
          <p className="signup-showcase-instruction">
            Um espaço para apresentar seu trabalho e participar de uma análise
            cuidadosa.
          </p>
        </div>

        <div className="signup-showcase-bottom">
          <span>01 — 04</span>
          <span>Perfil · Redes · Evidências · Revisão</span>
          <button
            className="signup-showcase-collapse"
            type="button"
            onClick={onCollapse}
            aria-label="Recolher apresentação"
          >
            Recolher <span aria-hidden="true">←</span>
          </button>
        </div>
      </section>

      <dialog
        ref={dialogRef}
        className="signup-video-dialog"
        aria-labelledby="signup-video-title"
        onClose={() => setDialogOpen(false)}
      >
        <div className="signup-video-dialog-header">
          <div>
            <p className="eyebrow">VYREX / APRESENTAÇÃO</p>
            <h2 id="signup-video-title">Conheça a Vyrex</h2>
          </div>
          <button
            className="quiet-button"
            type="button"
            onClick={() => dialogRef.current?.close()}
          >
            Fechar
          </button>
        </div>
        <div className="signup-video-placeholder">
          <span className="signup-video-mark" aria-hidden="true">
            V
          </span>
          <p>Vídeo de apresentação em produção</p>
          <span>O conteúdo será disponibilizado aqui.</span>
        </div>
      </dialog>
    </>
  );
}
