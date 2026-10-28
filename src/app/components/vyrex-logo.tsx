// Logo oficial da Vyrex (desenho de public/vyrex-logo.svg), desenhado direto
// na página para herdar a cor do texto: preto no fundo claro, branco no escuro.
// O tamanho vem do CSS (altura); a largura acompanha a proporção.

export function VyrexLogo({
  className,
  decorative = false,
}: {
  className?: string;
  // true quando o texto ao redor já diz "Vyrex" (ex.: link com aria-label).
  decorative?: boolean;
}) {
  return (
    <svg
      className={className ? `vyrex-logo ${className}` : "vyrex-logo"}
      viewBox="0 0 562 100"
      fill="currentColor"
      focusable="false"
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": "Vyrex" })}
    >
      <path d="M0 0H24L50 74L76 0H100L62 100H38Z" />
      <path d="M112 0H136L156.5 33L143 50Z" />
      <path d="M186 0H210L172 60V100H150V58Z" />
      <path d="M231 0H290C312 0 327 14 327 33C327 52 312 66 290 66H262V46H289C299 46 305 40 305 33C305 26 299 20 289 20H253V100H231Z" />
      <path d="M285 62H309L330 100H305Z" />
      <path d="M350 0H438V20H372V80H438V100H350Z" />
      <path d="M381 40H432V60H381Z" />
      <path d="M462 0H488L562 100H536Z" />
      <path d="M536 0H562L542.8 26H516.8Z" />
      <path d="M499 50H525L488 100H462Z" />
    </svg>
  );
}

// Só o "V" do logo, para espaços pequenos (menu recolhido, carregamento).
export function VyrexMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M0 0H24L50 74L76 0H100L62 100H38Z" />
    </svg>
  );
}
