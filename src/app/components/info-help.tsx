import type { ReactNode } from "react";

export function InfoHelp({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="info-help">
      <summary aria-label={`Ajuda: ${title}`} title={`Ajuda: ${title}`}>
        <span aria-hidden="true">i</span>
      </summary>
      <div className="info-help-panel">
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </details>
  );
}
