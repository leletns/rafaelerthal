// ============================================================
// MERGE DATA — Sheets é a fonte primária; legacy é fallback.
//
// Formato real retornado pelo Apps Script do Dr. Erthal:
//   { cir25: { lista: Surgery[], total, mes, fatMes, tipos },
//     cir26: { lista: Surgery[], ... },
//     cons25: { lista: Consultation[], total, mes, canal, fx, cidades, intl },
//     cons26: { lista: Consultation[], ... },
//     orc25: { total, fechou, nao, plano, pendente },
//     orc26: { ... },
//     pipeline: PipelineCard[],          ← aba PIPELINE do Sheets
//     anos: [...], syncedAt: "..." }
// ============================================================
import type { Surgery, Consultation, DashboardData, OrcStats, PipelineCard } from './data-model';
import {
  cir25_lista, cir26_lista, cons25_lista, cons26_lista,
  canal25, canal26, fx25, fx26,
  cidades25, cidades26, intl25, intl26,
  orc25, orc26, cons25_mes, cons26_mes,
} from './legacy-data';

export function getBaseData(): DashboardData {
  return {
    cir25: cir25_lista, cir26: cir26_lista,
    cons25: cons25_lista, cons26: cons26_lista,
    canal25, canal26,
    fx25, fx26,
    cidades25, cidades26,
    intl25, intl26,
    orc25, orc26,
    cons25_mes, cons26_mes,
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
    d:   normalizeDate(row.d),
    mes: normalizeMes(row.mes),
    p,
    c:   String(row.c ?? '').trim(),
    cl:  String(row.cl ?? '').trim(),
    v:   Number(row.v) || 0,
    ...(row.reg ? { reg: String(row.reg) } : {}),
  };
}

function normalizeConsultation(row: RawRow): Consultation | null {
  const p = String(row.p ?? '').trim();
  if (!p) return null;
  const d = normalizeDate(row.d);
  // Compute mes from date when not provided (Apps Script only sends numeric month or nothing)
  let mes = normalizeMes(row.mes);
  if (!mes && d) {
    const parts = d.split('/');
    if (parts.length >= 2) {
      const monthNum = parseInt(parts[1], 10);
      if (monthNum >= 1 && monthNum <= 12) mes = MES_NAMES[monthNum - 1];
    }
  }
  return {
    d,
    mes,
    p,
    tel:   String(row.tel ?? '').trim(),
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
// Extract list from Apps Script response shapes.
// Handles both:
//   - Direct array:              remote.cir25 = [...]
//   - Nested object with lista:  remote.cir25 = { lista: [...], total, ... }
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
// Extract Record<string,number> stats object from Sheets
// Returns null if object is empty or missing
// -------------------------------------------------------
function extractRecord(obj: unknown): Record<string, number> | null {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const rec = obj as Record<string, unknown>;
  const result: Record<string, number> = {};
  let hasData = false;
  for (const [k, v] of Object.entries(rec)) {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
    if (!isNaN(n) && n > 0) {
      result[k] = n;
      hasData = true;
    }
  }
  return hasData ? result : null;
}

// -------------------------------------------------------
// Extract OrcStats from Sheets response
// -------------------------------------------------------
function extractOrc(obj: unknown): OrcStats | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  const total = Number(o.total) || 0;
  if (total === 0) return null;
  return {
    total,
    fechou:   Number(o.fechou)   || 0,
    nao:      Number(o.nao)      || 0,
    plano:    Number(o.plano)    || 0,
    pendente: Number(o.pendente) || 0,
  };
}

// -------------------------------------------------------
// Extract monthly consultation counts from Sheets
// Apps Script returns cons25.mes = [34,31,20,...] (12-item array)
// -------------------------------------------------------
function extractConsMes(consObj: unknown): number[] | null {
  if (!consObj || typeof consObj !== 'object') return null;
  const obj = consObj as Record<string, unknown>;
  if (Array.isArray(obj.mes) && obj.mes.some((v: unknown) => Number(v) > 0)) {
    return (obj.mes as unknown[]).map((v) => Number(v) || 0);
  }
  return null;
}

// -------------------------------------------------------
// Extract pipeline cards from Sheets PIPELINE tab
// -------------------------------------------------------
export function extractPipeline(remote: Record<string, unknown>): PipelineCard[] | null {
  const raw = remote.pipeline;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return (raw as Record<string, unknown>[]).map((r) => {
    // checklist: stored as JSON string (checklistJson) or native array (checklist)
    // Apps Script may store the serialized JSON string in a text column.
    const checklist = (() => {
      // 1. Try checklistJson (explicit JSON string field)
      const jsonStr = r.checklistJson ?? r.checklist_json;
      if (typeof jsonStr === 'string' && jsonStr.trim().startsWith('[')) {
        try { return JSON.parse(jsonStr); } catch { /* fall through */ }
      }
      // 2. Try checklist as native array (passed through)
      const arr = r.checklist;
      if (Array.isArray(arr)) return arr;
      // 3. Try checklist as JSON string
      if (typeof arr === 'string' && arr.trim().startsWith('[')) {
        try { return JSON.parse(arr); } catch { return undefined; }
      }
      return undefined;
    })();

    const notes = String(r.notes ?? r.notas ?? '').trim() || undefined;

    return {
      id:          String(r.id          ?? `p_${Math.random().toString(36).slice(2)}`),
      patientName: String(r.patientName ?? r.paciente ?? ''),
      phone:       String(r.phone       ?? r.telefone ?? ''),
      procedure:   String(r.procedure   ?? r.procedimento ?? '') || undefined,
      value:       Number(r.value       ?? r.valor ?? 0) || undefined,
      stage:       String(r.stage       ?? r.etapa ?? 'orc_enviado') as import('./data-model').PipelineStage,
      notes,
      checklist,
      createdAt:   String(r.createdAt   ?? new Date().toISOString()),
      updatedAt:   String(r.updatedAt   ?? new Date().toISOString()),
    };
  });
}

// -------------------------------------------------------
// SHEETS-FIRST MERGE — Sheets wins when non-empty.
// Falls back to legacy only when Sheets returns nothing.
// Now also merges stats: canal, fx, cidades, intl, orc, cons_mes
// -------------------------------------------------------
export function sheetsFirstMerge(
  base: DashboardData,
  remote: Record<string, unknown>
): DashboardData {
  const cir25  = extractSurgeries(remote.cir25);
  const cir26  = extractSurgeries(remote.cir26);
  const cons25 = extractConsultations(remote.cons25);
  const cons26 = extractConsultations(remote.cons26);

  // Stats nested inside cons25/cons26 objects
  const c25 = remote.cons25 as Record<string, unknown> | undefined;
  const c26 = remote.cons26 as Record<string, unknown> | undefined;

  const canal25_s  = c25 ? extractRecord(c25.canal)   : null;
  const canal26_s  = c26 ? extractRecord(c26.canal)   : null;
  const fx25_s     = c25 ? extractRecord(c25.fx)      : null;
  const fx26_s     = c26 ? extractRecord(c26.fx)      : null;
  const cidades25_s= c25 ? extractRecord(c25.cidades) : null;
  const cidades26_s= c26 ? extractRecord(c26.cidades) : null;
  const intl25_s   = c25 ? extractRecord(c25.intl)    : null;
  const intl26_s   = c26 ? extractRecord(c26.intl)    : null;
  const orc25_s    = extractOrc(remote.orc25);
  const orc26_s    = extractOrc(remote.orc26);
  const mes25_s    = extractConsMes(remote.cons25);
  const mes26_s    = extractConsMes(remote.cons26);

  return {
    ...base,
    // Lists — Sheets wins when non-empty
    cir25:  cir25.length  > 0 ? cir25  : base.cir25,
    cir26:  cir26.length  > 0 ? cir26  : base.cir26,
    cons25: cons25.length > 0 ? cons25 : base.cons25,
    cons26: cons26.length > 0 ? cons26 : base.cons26,
    // Stats — Sheets wins when non-null
    canal25:   canal25_s   ?? base.canal25,
    canal26:   canal26_s   ?? base.canal26,
    fx25:      fx25_s      ?? base.fx25,
    fx26:      fx26_s      ?? base.fx26,
    cidades25: cidades25_s ?? base.cidades25,
    cidades26: cidades26_s ?? base.cidades26,
    intl25:    intl25_s    ?? base.intl25,
    intl26:    intl26_s    ?? base.intl26,
    orc25:     orc25_s     ?? base.orc25,
    orc26:     orc26_s     ?? base.orc26,
    cons25_mes: mes25_s    ?? base.cons25_mes,
    cons26_mes: mes26_s    ?? base.cons26_mes,
  };
}

// -------------------------------------------------------
// Legacy additive merge (kept for compatibility)
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
