import { VyrexMark } from "./vyrex-logo";

// inline: dentro de uma moldura que já tem o <main> (área do criador).
export function PageLoading({ label, inline = false }: { label: string; inline?: boolean }) {
  const Root = inline ? "div" : "main";
  return (
    <Root className="page-loading" aria-busy="true">
      <p className="page-loading-label" role="status">
        <span className="brand-mark" aria-hidden="true">
          <VyrexMark />
        </span>
        {label}
      </p>
      <div className="page-loading-skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </Root>
  );
}
