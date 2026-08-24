// ============================================================
// RÓTULOS — limpeza de texto vindo da planilha
// ============================================================

// Bandeiras e ícones vêm colados nos nomes de país na planilha.
// Pares substitutos cobrem emoji e bandeiras; a segunda faixa cobre símbolos simples.
const SIMBOLOS = new RegExp('[\uD800-\uDBFF][\uDC00-\uDFFF]|[←-⇿⌀-➿⬀-⯿️]', 'g');

/** Remove bandeiras e ícones de um rótulo, preservando o nome. */
export function limparRotulo(texto: string): string {
  return texto.replace(SIMBOLOS, '').replace(/\s{2,}/g, ' ').trim();
}
