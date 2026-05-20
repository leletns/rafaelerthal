// ============================================================
// MERGE DATA - Merge local legacy data with remote Sheets data
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
