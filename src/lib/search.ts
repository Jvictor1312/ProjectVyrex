// Normaliza o texto buscado do mesmo jeito que public.search_text() no banco
// (migration 202610290001): minúsculas e sem acento, para "joao" achar "João".
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
