// ============================================================
// MERGE DATA - Merge local legacy data with remote Sheets data
// Sheets is PRIMARY source; legacy is fallback only.
// ============================================================
import type { Surgery, Consultation, DashboardData } from './data-model';
import {
  cir25_lista,
  cir26_lista,
  cons25_lista,
  cons26_lista,
  canal25,
  canal26,
  age25,
  age26,
  city25,
  city26,
  intl25,
  intl26,
  orc25,
  orc26,
} from './legacy-data';

export function getBaseData(): DashboardData {
  return {
    cir25: cir25_lista,
    cir26: cir26_lista,
    cons25: cons25_lista,
    cons26: cons26_lista,
    canal25,
    canal26,
    age25,
    age26,
    city25,
    city26,
    intl25,
    intl26,
    orc25,
    orc26,
  };
}

// -------------------------------------------------------
// Normalization helpers for raw Sheets rows
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

function normalizeSurgery(row: RawRow): Surgery | null {
  const d = String(row.d ?? '').trim();
  const p = String(row.p ?? '').trim();
  if (!d || !p) return null;
  return {
    d,
    mes: normalizeMes(row.mes),
    p,
    c: String(row.c ?? '').trim(),
    cl: String(row.cl ?? '').trim(),
    v: Number(row.v) || 0,
    ...(row.reg ? { reg: String(row.reg) } : {}),
  };
}

function normalizeConsultation(row: RawRow): Consultation | null {
  const d = String(row.d ?? '').trim();
  const p = String(row.p ?? '').trim();
  if (!d || !p) return null;
  return {
    d,
    mes: normalizeMes(row.mes),
    p,
    tel: String(row.tel ?? '').trim(),
    idade: Number(row.idade) || 0,
    canal: String(row.canal ?? '').trim(),
    ...(row.cidade ? { cidade: String(row.cidade) } : {}),
    ...(row.obs ? { obs: String(row.obs) } : {}),
  };
}

function parseRemoteSurgeries(raw: unknown): Surgery[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => normalizeSurgery(r as RawRow))
    .filter((s): s is Surgery => s !== null);
}

function parseRemoteConsultations(raw: unknown): Consultation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => normalizeConsultation(r as RawRow))
    .filter((c): c is Consultation => c !== null);
}

// -------------------------------------------------------
// SHEETS-FIRST merge: Sheets data wins when non-empty.
// Legacy data is fallback only.
// -------------------------------------------------------
export function sheetsFirstMerge(
  base: DashboardData,
  remote: Record<string, unknown>
): DashboardData {
  const remoteCir25 = parseRemoteSurgeries(remote.cir25);
  const remoteCir26 = parseRemoteSurgeries(remote.cir26);
  const remoteCons25 = parseRemoteConsultations(remote.cons25);
  const remoteCons26 = parseRemoteConsultations(remote.cons26);

  return {
    ...base,
    cir25: remoteCir25.length > 0 ? remoteCir25 : base.cir25,
    cir26: remoteCir26.length > 0 ? remoteCir26 : base.cir26,
    cons25: remoteCons25.length > 0 ? remoteCons25 : base.cons25,
    cons26: remoteCons26.length > 0 ? remoteCons26 : base.cons26,
  };
}

// -------------------------------------------------------
// Legacy additive merge (kept for backward compatibility)
// -------------------------------------------------------
export function mergeSurgeries(base: Surgery[], remote: Surgery[]): Surgery[] {
  if (!remote || remote.length === 0) return base;

  const seen = new Set(base.map((s) => `${s.d}_${s.p}`));
  const merged = [...base];

  for (const r of remote) {
    const key = `${r.d}_${r.p}`;
    if (!seen.has(key)) {
      merged.push(r);
      seen.add(key);
    }
  }

  return merged.sort((a, b) => {
    const [da, ma] = a.d.split('/').map(Number);
    const [db, mb] = b.d.split('/').map(Number);
    if (ma !== mb) return ma - mb;
    return da - db;
  });
}

export function mergeConsultations(
  base: Consultation[],
  remote: Consultation[]
): Consultation[] {
  if (!remote || remote.length === 0) return base;

  const seen = new Set(base.map((c) => `${c.d}_${c.p}`));
  const merged = [...base];

  for (const r of remote) {
    const key = `${r.d}_${r.p}`;
    if (!seen.has(key)) {
      merged.push(r);
      seen.add(key);
    }
  }

  return merged.sort((a, b) => {
    const [da, ma] = a.d.split('/').map(Number);
    const [db, mb] = b.d.split('/').map(Number);
    if (ma !== mb) return ma - mb;
    return da - db;
  });
}

export function mergeRemoteData(
  base: DashboardData,
  remote: Partial<DashboardData>
): DashboardData {
  return {
    ...base,
    cir25: mergeSurgeries(base.cir25, remote.cir25 || []),
    cir26: mergeSurgeries(base.cir26, remote.cir26 || []),
    cons25: mergeConsultations(base.cons25, remote.cons25 || []),
    cons26: mergeConsultations(base.cons26, remote.cons26 || []),
  };
}
