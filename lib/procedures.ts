// ============================================================
// PROCEDURES — Classificação unificada de cirurgias
// 1 categoria principal por cirurgia (LIPEDEMA, PLÁSTICA, RETOQUE),
// com tecnologias e procedimentos complementares como dimensões
// separadas, extraídas do texto do procedimento.
// ============================================================
import type { Surgery } from './data-model';
import { formatCurrency } from './dashboard-calculations';

export type CategoriaCirurgia = 'LIPEDEMA' | 'PLÁSTICA' | 'RETOQUE' | 'OUTROS';

export const CATEGORIAS: CategoriaCirurgia[] = ['LIPEDEMA', 'PLÁSTICA', 'RETOQUE', 'OUTROS'];

function norm(text: string): string {
  return (text || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

const PLASTICA_RE = /LIPOESCULTURA|LIPOASPIRA|LIPO\s*360|LIPO DE |MASTOPEXIA|MASTO\b|MAMOPLASTIA|ABDOMINOPLASTIA|PROTESE|IMPLANTE|EXPLANTE|GINECOMASTIA|BLEFARO|LIFTING|MAMA|MONTE DE VENUS|NINFOPLASTIA|BACK ?SHAPE/;

/** Categoria principal única. Combinações com lipedema contam como LIPEDEMA
 *  (ex.: "Lipedema MMII + prótese" → LIPEDEMA); o detalhe fica nas subcategorias. */
export function categoriaOf(s: Surgery): CategoriaCirurgia {
  const t = norm(`${s.c} ${s.cl}`);
  if (/LIPEDEMA|LIPEDEFINITION/.test(t)) return 'LIPEDEMA';
  if (/RETOQUE/.test(t)) return 'RETOQUE';
  if (PLASTICA_RE.test(t)) return 'PLÁSTICA';
  return 'OUTROS';
}

/** Subcategorias do lipedema (MMII/MMSS) e plásticas associadas. */
export function subcategoriasOf(s: Surgery): string[] {
  const t = norm(s.c);
  const subs: string[] = [];
  if (/MMII/.test(t)) subs.push('Lipedema MMII');
  if (/MMSS|MMS\b/.test(t)) subs.push('Lipedema MMSS');
  if (PLASTICA_RE.test(t) && /LIPEDEMA|LIPEDEFINITION/.test(norm(`${s.c} ${s.cl}`))) subs.push('+ Plástica associada');
  return subs;
}

export const TECNOLOGIAS = ['Argoplasma', 'Morpheus'] as const;

export function tecnologiasOf(s: Surgery): string[] {
  const t = norm(s.c);
  const found: string[] = [];
  if (/ARGO/.test(t)) found.push('Argoplasma');
  if (/MORPHEUS/.test(t)) found.push('Morpheus');
  return found;
}

export const COMPLEMENTARES = [
  'Sublift', 'Sculptra', 'Bioestimulador', 'Enxerto de gordura', 'Lipo de papada', 'Morpheus facial',
] as const;

export function complementaresOf(s: Surgery): string[] {
  const t = norm(s.c);
  const found: string[] = [];
  if (/SUBLIFT/.test(t)) found.push('Sublift');
  if (/SCULPTRA/.test(t)) found.push('Sculptra');
  if (/BIOESTIMULADOR/.test(t)) found.push('Bioestimulador');
  if (/ENXERTO/.test(t)) found.push('Enxerto de gordura');
  if (/PAPADA/.test(t)) found.push('Lipo de papada');
  if (/MORPHEUS (PLUS )?FACIAL|MORPHEUS FACE/.test(t)) found.push('Morpheus facial');
  return found;
}

export interface CategoryBreakdown {
  label: string;
  count: number;
  revenue: number;
}

/** Contagem + faturamento por categoria principal (ordenado por contagem). */
export function computeCategoryBreakdown(cir: Surgery[]): CategoryBreakdown[] {
  const map = new Map<string, { count: number; revenue: number }>();
  for (const s of cir) {
    const cat = categoriaOf(s);
    const e = map.get(cat) || { count: 0, revenue: 0 };
    map.set(cat, { count: e.count + 1, revenue: e.revenue + s.v });
  }
  return Array.from(map.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.count - a.count);
}

function breakdownBy(cir: Surgery[], extract: (s: Surgery) => string[]): CategoryBreakdown[] {
  const map = new Map<string, { count: number; revenue: number }>();
  for (const s of cir) {
    for (const label of extract(s)) {
      const e = map.get(label) || { count: 0, revenue: 0 };
      map.set(label, { count: e.count + 1, revenue: e.revenue + s.v });
    }
  }
  return Array.from(map.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.count - a.count);
}

export function computeTecnologiaBreakdown(cir: Surgery[]): CategoryBreakdown[] {
  return breakdownBy(cir, tecnologiasOf);
}

export function computeComplementarBreakdown(cir: Surgery[]): CategoryBreakdown[] {
  return breakdownBy(cir, complementaresOf);
}

export function computeSubcategoriaBreakdown(cir: Surgery[]): CategoryBreakdown[] {
  return breakdownBy(cir, subcategoriasOf);
}

export function formatBreakdownEntry(e: CategoryBreakdown): string {
  return `${e.label} — ${e.count}× · ${formatCurrency(e.revenue)}`;
}
