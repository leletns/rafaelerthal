// ============================================================
// NORMALIZE CATEGORY — Unificação agressiva de categorias (cl)
//
// Problema: a equipe comercial digita a mesma categoria de várias
// formas na planilha ("lipedema + tecnologia", "Lipedema & Tecnologia",
// "LIPEDEMA  E TECNOLOGIA"...), gerando duplicatas em rankings e
// filtros. Este módulo converte qualquer variação em uma chave
// canônica única e em um rótulo de exibição padronizado.
//
// Regras aplicadas por normalizeCategoryName():
//   1. minúsculas
//   2. remoção de acentos e caracteres especiais
//   3. conectivos padronizados: "+", "&", ",", "/", " e " → " e "
//   4. trim + colapso de espaços duplicados
// ============================================================

/**
 * Gera a chave canônica de uma categoria.
 * "Lipedema & Tecnologia", "lipedema + tecnologia" e
 * "LIPEDEMA  E TECNOLOGIA" retornam todas "lipedema e tecnologia".
 */
export function normalizeCategoryName(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    // 2. remove acentos (NFD separa o diacrítico do caractere base)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // 3. conectivos → padrão único " e "
    .replace(/\s*[+&,/]\s*/g, ' e ')
    .replace(/\s+e\s+/g, ' e ')
    // 2b. remove qualquer caractere especial restante
    .replace(/[^a-z0-9\s]/g, ' ')
    // conectivos duplicados gerados pela substituição ("e e") → "e"
    .replace(/\b(e\s+)+e\b/g, 'e')
    // 4. colapsa espaços e trim
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Rótulo oficial de exibição para cada chave canônica conhecida.
const CANONICAL_LABELS: Record<string, string> = {
  'lipedema e tecnologia':            'LIPEDEMA E TECNOLOGIA',
  'lipedema e tecnologia e plastica': 'LIPEDEMA, TECNOLOGIA E PLÁSTICA',
  'lipedema e plastica':              'LIPEDEMA E PLÁSTICA',
  'lipedema sem tecnologia':          'LIPEDEMA SEM TECNOLOGIA',
  'plastica':                         'PLÁSTICA',
  'retoque':                          'RETOQUE',
  'nao especificada':                 'NÃO ESPECIFICADA',
};

// Sinônimos/variações que devem colapsar em outra chave canônica.
// Adicione aqui novos apelidos conforme surgirem na planilha.
const CATEGORY_ALIASES: Record<string, string> = {
  'lipedema e tecnologia e procedimento': 'lipedema e tecnologia',
  'lipedema com tecnologia':              'lipedema e tecnologia',
  'lipedema tecnologia':                  'lipedema e tecnologia',
  'nao especificado':                     'nao especificada',
  'sem categoria':                        'nao especificada',
};

/**
 * Resolve a chave canônica final (aplica aliases sobre a normalização).
 */
export function resolveCategoryKey(raw: string): string {
  const key = normalizeCategoryName(raw);
  return CATEGORY_ALIASES[key] ?? key;
}

/**
 * Retorna o nome de exibição unificado da categoria.
 * Se a categoria não estiver no dicionário, devolve a chave canônica
 * em MAIÚSCULAS — garantindo que variações desconhecidas ainda
 * colapsem entre si.
 */
export function canonicalCategoryLabel(raw: string): string {
  const key = resolveCategoryKey(raw);
  if (!key) return '';
  return CANONICAL_LABELS[key] ?? key.toUpperCase();
}

/**
 * Compara duas categorias ignorando acentos, caixa e conectivos.
 */
export function sameCategoryName(a: string, b: string): boolean {
  return resolveCategoryKey(a) === resolveCategoryKey(b);
}

/**
 * Lista oficial de categorias para selects/filtros da UI.
 */
export const CATEGORY_OPTIONS: string[] = [
  'LIPEDEMA E TECNOLOGIA',
  'LIPEDEMA, TECNOLOGIA E PLÁSTICA',
  'LIPEDEMA E PLÁSTICA',
  'LIPEDEMA SEM TECNOLOGIA',
  'PLÁSTICA',
  'RETOQUE',
];
