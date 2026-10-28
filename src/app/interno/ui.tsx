import type { ReactNode } from "react";
import type { Tone } from "@/lib/labels";
import ui from "./ui.module.css";

// Componentes visuais comuns da área interna. Servem tanto às telas reais
// quanto às prévias, para que as duas fiquem sempre iguais.

export { ui };

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className={ui.pageHeader}>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className={ui.pageActions}>{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  flush = false,
  id,
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  id?: string;
}) {
  return (
    <section className={ui.panel} id={id} aria-label={title}>
      {title && (
        <div className={ui.panelHeader}>
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {flush ? children : <div className={ui.panelBody}>{children}</div>}
    </section>
  );
}

export function Stats({
  items,
  label,
}: {
  items: { label: string; value: string; hint?: string }[];
  label: string;
}) {
  return (
    <dl className={ui.stats} aria-label={label}>
      {items.map((item) => (
        <div className={ui.stat} key={item.label}>
          <dt>
            <span>{item.label}</span>
          </dt>
          <dd style={{ margin: 0 }}>
            <strong>{item.value}</strong>
            {item.hint && <small> {item.hint}</small>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Badge({
  tone = "neutral",
  plain = false,
  children,
}: {
  tone?: Tone;
  plain?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`${ui.badge} ${ui[tone]} ${plain ? ui.badgePlain : ""}`}>
      {children}
    </span>
  );
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function Avatar({ name, muted = false }: { name: string; muted?: boolean }) {
  return (
    <span
      className={`${ui.avatar} ${muted ? ui.avatarMuted : ""}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function Notice({
  tone = "neutral",
  children,
  role,
}: {
  tone?: Tone;
  children: ReactNode;
  role?: "alert" | "status";
}) {
  return (
    <p className={`${ui.notice} ${ui[tone]}`} role={role}>
      {children}
    </p>
  );
}

export function EmptyState({ title, text }: { title: string; text?: ReactNode }) {
  return (
    <div className={ui.empty}>
      <strong>{title}</strong>
      {text && <p>{text}</p>}
    </div>
  );
}
