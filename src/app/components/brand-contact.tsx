"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./brand-contact.module.css";

const email = "suportevyrex@gmail.com";
const subject = "Vyrex para marcas";

const options = [
  {
    label: "Gmail",
    href: `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent(subject)}`,
    external: true,
  },
  {
    label: "Outlook.com",
    href: `https://outlook.live.com/mail/0/deeplink/compose?to=${email}&subject=${encodeURIComponent(subject)}`,
    external: true,
  },
  {
    label: "App de e-mail",
    href: `mailto:${email}?subject=${encodeURIComponent(subject)}`,
    external: false,
  },
];

// Contato das marcas: cada pessoa escolhe onde escrever, em vez de abrir
// sempre o programa de e-mail padrão do computador.
export function BrandContact({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (
        event instanceof MouseEvent &&
        wrapper.current?.contains(event.target as Node)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.wrapper} ref={wrapper}>
      <button
        className={className}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        Fale com a gente →
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          {options.map((option) => (
            <a
              key={option.label}
              className={styles.item}
              role="menuitem"
              href={option.href}
              target={option.external ? "_blank" : undefined}
              rel={option.external ? "noopener noreferrer" : undefined}
              onClick={() => setOpen(false)}
            >
              Escrever pelo {option.label}
            </a>
          ))}
          <button
            className={styles.item}
            type="button"
            role="menuitem"
            onClick={copy}
          >
            {copied ? "Copiado!" : "Copiar e-mail"}
          </button>
        </div>
      )}
    </div>
  );
}
