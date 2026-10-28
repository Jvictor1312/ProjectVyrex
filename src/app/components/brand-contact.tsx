"use client";

import { useState } from "react";
import styles from "./brand-contact.module.css";

const email = "suportevyrex@gmail.com";
const subject = encodeURIComponent("Vyrex para marcas");

const options = [
  {
    label: "Gmail",
    href: `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}`,
  },
  {
    label: "Outlook",
    href: `https://outlook.live.com/mail/0/deeplink/compose?to=${email}&subject=${subject}`,
  },
  { label: "Outro app", href: `mailto:${email}?subject=${subject}` },
];

// Contato das marcas: as opções abrem dentro do próprio cartão, sem cobrir a
// página, e o endereço de e-mail não aparece na tela.
export function BrandContact({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!open) {
    return (
      <button
        className={className}
        type="button"
        aria-expanded={false}
        onClick={() => setOpen(true)}
      >
        Quero anunciar com a Vyrex →
      </button>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>
        <span>Escreva para a nossa equipe comercial:</span>
        <button
          className={styles.close}
          type="button"
          aria-label="Fechar opções de contato"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
      </div>
      <div className={styles.options}>
        {options.map((option) => (
          <a
            key={option.label}
            className={styles.option}
            href={option.href}
            target={option.href.startsWith("http") ? "_blank" : undefined}
            rel={option.href.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {option.label}
          </a>
        ))}
        <button className={styles.option} type="button" onClick={copy}>
          {copied ? "Copiado ✓" : "Copiar e-mail"}
        </button>
      </div>
    </div>
  );
}
