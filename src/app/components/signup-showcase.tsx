"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { VyrexLogo, VyrexMark } from "./vyrex-logo";

export function SignupExperience({
  children,
  videoUrl,
}: {
  children: ReactNode;
  videoUrl: string | null;
}) {
  const [showcaseOpen, setShowcaseOpen] = useState(true);

  return (
    <main
      className={`signup-layout${showcaseOpen ? "" : " signup-layout--collapsed"}`}
    >
      <SignupShowcase
        open={showcaseOpen}
        onToggle={() => setShowcaseOpen((open) => !open)}
        videoUrl={videoUrl}
      />
      <section className="signup-form-panel">
        <header className="signup-form-header">
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
  videoUrl,
}: {
  open: boolean;
  onToggle: () => void;
  videoUrl: string | null;
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
        <VyrexLogo className="signup-rail-logo" decorative />
        <span className="signup-showcase-toggle" aria-hidden="true">
          →
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
          <VyrexLogo decorative />
        </Link>

        <div className="signup-showcase-center">
          {/* Anel pulsando e uma pequena esfera em órbita (o mesmo motivo da
              página inicial): chamam o olho para a esfera, que é o botão. */}
          <div className="signup-orb-stage">
            <span className="signup-orb-pulse" aria-hidden="true" />
            <span className="signup-orb-orbit" aria-hidden="true">
              <span className="signup-orb-satellite" />
            </span>
            <button
              ref={orbRef}
              className="signup-orb"
              type="button"
              aria-haspopup="dialog"
              aria-expanded={dialogOpen}
              onClick={() => setDialogOpen(true)}
            >
              <VyrexLogo className="signup-orb-word" decorative />
              <span className="signup-orb-cta">
                {/* O play aparece sempre (decisão do dono). Sem vídeo
                    cadastrado, a janela avisa que ele virá em breve. */}
                <span className="signup-orb-play" aria-hidden="true">
                  <svg viewBox="0 0 12 12" focusable="false">
                    <path d="M4 2.6v6.8L9.4 6z" />
                  </svg>
                </span>
                <span className="signup-orb-prompt">Assistir vídeo</span>
              </span>
            </button>
          </div>
          <div className="signup-showcase-copy">
            <p className="signup-showcase-tagline">
              Criadores e marcas, na mesma órbita.
            </p>
            <p className="signup-showcase-instruction">
              Toque na esfera e conheça a Vyrex em vídeo.
            </p>
          </div>
        </div>

        <button
          className="signup-showcase-toggle"
          type="button"
          onClick={onToggle}
          aria-expanded={true}
        >
          <span aria-hidden="true">←</span> Recolher
        </button>
      </section>

      <dialog
        ref={dialogRef}
        className="signup-video-dialog"
        aria-labelledby="signup-video-title"
        onClose={() => setDialogOpen(false)}
      >
        <div className="signup-video-dialog-header">
          <h2 id="signup-video-title">Conheça a Vyrex</h2>
          <button
            className="signup-video-close"
            type="button"
            onClick={() => dialogRef.current?.close()}
          >
            Fechar
          </button>
        </div>
        {videoUrl ? (
          dialogOpen && (
            <video
              className="signup-video-player"
              src={videoUrl}
              controls
              autoPlay
              playsInline
            />
          )
        ) : (
          <div className="signup-video-placeholder">
            <span className="signup-video-mark" aria-hidden="true">
              <VyrexMark />
            </span>
            <p>O vídeo de apresentação estará aqui em breve.</p>
          </div>
        )}
      </dialog>
    </>
  );
}
