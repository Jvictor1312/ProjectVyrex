"use client";

import { useEffect, useId, useRef } from "react";
import type { FormState } from "@/lib/validation/auth";

// Mensagem de resultado de um formulário (lida pelo leitor de tela). Quando o
// servidor diz qual campo falhou (state.field), o campo é marcado como
// inválido, ligado a esta mensagem (aria-describedby) e recebe o foco: quem
// usa leitor de tela ouve o nome do campo e o problema juntos.
// Precisa ficar dentro do <form>.
export function FormFeedback({ state }: { state: FormState }) {
  const id = useId();
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form || state.success || !state.field) return;
    const item = form.elements.namedItem(state.field);
    const field = item instanceof RadioNodeList ? item[0] : item;
    if (!(field instanceof HTMLElement)) return;

    const previous = field.getAttribute("aria-describedby");
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", previous ? `${previous} ${id}` : id);
    field.focus();
    return () => {
      field.removeAttribute("aria-invalid");
      if (previous) field.setAttribute("aria-describedby", previous);
      else field.removeAttribute("aria-describedby");
    };
  }, [state, id]);

  if (!state.message) return null;
  return (
    <p
      ref={ref}
      id={id}
      className={state.success ? "form-message success" : "form-message error"}
      role="status"
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}
