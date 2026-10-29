// Primeiro item do Tab nas telas com menu: leva direto ao conteúdo, sem passar
// por todos os links do menu. Só aparece quando recebe o foco do teclado.
// O destino é o elemento com id="conteudo" (e tabIndex={-1}) da própria tela.
export function SkipLink() {
  return (
    <a className="skip-link" href="#conteudo">
      Pular para o conteúdo
    </a>
  );
}
