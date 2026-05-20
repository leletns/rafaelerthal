// ============================================================
// MERGE DATA — Sheets é a fonte primária; legacy é fallback.
//
// Formato real retornado pelo Apps Script do Dr. Erthal:
//   { cir25: { lista: Surgery[], total, mes, fatMes, tipos },
//     cir26: { lista: Surgery[], ... },
//     cons25: { lista: Consultation[], total, mes, canal, fx, cidades, intl },
//     cons26: { lista: Consultation[], ... },
//     anos: [...], syncedAt: "..." }
// ============================================================
import type { Surgery, Consultation, DashboardData } from './data-model';
import {
  cir25_lista, cir26_lista, cons25_lista, cons26_lista,
  canal25, canal26, age25, age26, city25, city26,
  intl25, intl26, orc25, orc26,
} from './legacy-data';

export function getBaseData(): DashboardData {
  return {
    cir25: cir25_lista, cir26: cir26_lista,
    cons25: cons25_lista, cons26: cons26_lista,
    canal25, canal26, age25, age26,
    city25, city26, intl25, intl26, orc25, orc26,
  };
}

// -------------------------------------------------------
// Normalization helpers
// -------------------------------------------------------
type RawRow = Record<string, unknown>;

const MES_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

function normalizeMes(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (typeof raw === 'number' && raw >= 1 && raw <= 12) return MES_NAMES[raw - 1];
  return '';
}

// "06/01/2025" → "06/01"  |  "06/01" → "06/01"
function normalizeDate(raw: unknown): string {
  const s = String(raw ?? '').trim();
  const m = s.match(/^(\d{2}\/\d{2})(?:\/\d{4})?/);
  return m ? m[1] : s;
}

function normalizeSurgery(row: RawRow): Surgery | null {
  const p = String(row.p ?? '').trim();
  if (!p) return null;
  return {
    d: normalizeDate(row.d),
    mes: normalizeMes(row.mes),
    p,
    c: String(row.c ?? '').trim(),
    cl: String(row.cl ?? '').trim(),
    v: Number(row.v) || 0,
    ...(row.reg ? { reg: String(row.reg) } : {}),
  };
}

function normalizeConsultation(row: RawRow): Consultation | null {
  const p = String(row.p ?? '').trim();
  if (!p) return null;
  return {
    d: normalizeDate(row.d),
    mes: normalizeMes(row.mes),
    p,
    tel: String(row.tel ?? '').trim(),
    idade: Number(row.idade) || 0,
    canal: String(row.canal ?? '').trim(),
    ...(row.cidade ? { cidade: String(row.cidade) } : {}),
    ...(row.reg && !row.cidade ? { cidade: String(row.reg) } : {}),
    ...(row.obs ? { obs: String(row.obs) } : {}),
  };
}

function parseRows<T>(raw: unknown[], fn: (r: RawRow) => T | null): T[] {
  return raw.map((r) => fn(r as RawRow)).filter((x): x is T => x !== null);
}

// -------------------------------------------------------
// Extract list from the actual Apps Script response shape.
// Handles both:
//   - Direct array:                  remote.cir25 = [...]
//   - Nested object with lista:      remote.cir25 = { lista: [...], total, ... }
// -------------------------------------------------------
function extractSurgeries(raw: unknown): Surgery[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return parseRows(raw, normalizeSurgery);
  const obj = raw as { lista?: unknown };
  if (Array.isArray(obj.lista)) return parseRows(obj.lista as RawRow[], normalizeSurgery);
  return [];
}

function extractConsultations(raw: unknown): Consultation[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return parseRows(raw, normalizeConsultation);
  const obj = raw as { lista?: unknown };
  if (Array.isArray(obj.lista)) return parseRows(obj.lista as RawRow[], normalizeConsultation);
  return [];
}

// -------------------------------------------------------
// SHEETS-FIRST merge — Sheets wins when non-empty.
// Falls back to legacy only when Sheets returns nothing.
// Never overwrites real data with empty.
// -------------------------------------------------------
export function sheetsFirstMerge(
  base: DashboardData,
  remote: Record<string, unknown>
): DashboardData {
  const cir25  = extractSurgeries(remote.cir25);
  const cir26  = extractSurgeries(remote.cir26);
  const cons25 = extractConsultations(remote.cons25);
  const cons26 = extractConsultations(remote.cons26);

  return {
    ...base,
    cir25:  cir25.length  > 0 ? cir25  : base.cir25,
    cir26:  cir26.length  > 0 ? cir26  : base.cir26,
    cons25: cons25.length > 0 ? cons25 : base.cons25,
    cons26: cons26.length > 0 ? cons26 : base.cons26,
  };
}

// -------------------------------------------------------
// Legacy additive merge (mantido para compatibilidade)
// -------------------------------------------------------
export function mergeSurgeries(base: Surgery[], remote: Surgery[]): Surgery[] {
  if (!remote || remote.length === 0) return base;
  const seen = new Set(base.map((s) => `${s.d}_${s.p}`));
  const merged = [...base];
  for (const r of remote) {
    const key = `${r.d}_${r.p}`;
    if (!seen.has(key)) { merged.push(r); seen.add(key); }
  }
  return merged.sort((a, b) => {
    const [da, ma] = a.d.split('/').map(Number);
    const [db, mb] = b.d.split('/').map(Number);
    return ma !== mb ? ma - mb : da - db;
  });
}

export function mergeConsultations(base: Consultation[], remote: Consultation[]): Consultation[] {
  if (!remote || remote.length === 0) return base;
  const seen = new Set(base.map((c) => `${c.d}_${c.p}`));
  const merged = [...base];
  for (const r of remote) {
    const key = `${r.d}_${r.p}`;
    if (!seen.has(key)) { merged.push(r); seen.add(key); }
  }
  return merged.sort((a, b) => {
    const [da, ma] = a.d.split('/').map(Number);
    const [db, mb] = b.d.split('/').map(Number);
    return ma !== mb ? ma - mb : da - db;
  });
}

export function mergeRemoteData(base: DashboardData, remote: Partial<DashboardData>): DashboardData {
  return {
    ...base,
    cir25:  mergeSurgeries(base.cir25, remote.cir25 || []),
    cir26:  mergeSurgeries(base.cir26, remote.cir26 || []),
    cons25: mergeConsultations(base.cons25, remote.cons25 || []),
    cons26: mergeConsultations(base.cons26, remote.cons26 || []),
  };
}
