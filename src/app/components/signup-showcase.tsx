"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";

export function SignupExperience({ children }: { children: ReactNode }) {
  const [showcaseOpen, setShowcaseOpen] = useState(true);

  return (
    <main
      className={`signup-layout${showcaseOpen ? "" : " signup-layout--collapsed"}`}
    >
      <SignupShowcase
        open={showcaseOpen}
        onToggle={() => setShowcaseOpen((open) => !open)}
      />
      <section className="signup-form-panel">
        <header className="signup-form-header">
          <Link className="brand" href="/" aria-label="Vyrex, página inicial">
            <span className="brand-mark">V</span>
            <span>VYREX</span>
          </Link>
          <div className="signup-form-header-actions">
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

function SignupShowcase({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const orbRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && dialogOpen && !dialog.open) dialog.showModal();
  }, [dialogOpen]);

  // Move a esfera direto no estilo, sem re-renderizar o componente a cada
  // movimento do mouse.
  function moveOrb(event: PointerEvent<HTMLElement>) {
    const orb = orbRef.current;
    if (event.pointerType !== "mouse" || !orb) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    orb.style.transform = `translate3d(${x * 16}px, ${y * 16}px, 0)`;
  }

  function resetOrb() {
    if (orbRef.current) orbRef.current.style.transform = "";
  }

  if (!open) {
    return (
      <button
        className="signup-showcase signup-showcase--rail"
        type="button"
        onClick={onToggle}
        aria-expanded={false}
        aria-label="Mostrar apresentação da Vyrex"
      >
        <span className="brand-mark" aria-hidden="true">
          V
        </span>
        <span className="signup-rail-word" aria-hidden="true">
          VYREX
        </span>
        <span className="signup-showcase-toggle" aria-hidden="true">
          ›
        </span>
      </button>
    );
  }

  return (
    <>
      <section
        className="signup-showcase"
        aria-label="Conheça a Vyrex"
        onPointerMove={moveOrb}
        onPointerLeave={resetOrb}
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
            ref={orbRef}
            className="signup-orb"
            type="button"
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
        </div>

        <button
          className="signup-showcase-toggle"
          type="button"
          onClick={onToggle}
          aria-expanded={true}
          aria-label="Recolher apresentação"
          title="Recolher apresentação"
        >
          <span aria-hidden="true">‹</span>
        </button>
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
