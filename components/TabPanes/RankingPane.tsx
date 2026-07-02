'use client';

import { useState, useMemo } from 'react';
import type { Surgery, Consultation } from '@/lib/data-model';
import { formatCurrency } from '@/lib/dashboard-calculations';
import { canonicalCategoryLabel } from '@/lib/normalize-category';

interface RankingPaneProps {
  cir25: Surgery[];
  cir26: Surgery[];
  cons25: Consultation[];
  cons26: Consultation[];
}

type Section = 'pacientes' | 'procedimentos' | 'recentes';

interface PatientRank {
  name: string;
  surgeries: number;
  consultations: number;
  revenue: number;
  maxSurgery: number; // highest single-procedure value → primary sort key
  lastDate: string;
  lastProc: string;
}

const COLORS = ['#007AFF','#5856D6','#FF9500','#28A745','#FF3B30','#AF52DE','#FF6B35','#00C7BE'];


export default function RankingPane({ cir25, cir26, cons25, cons26 }: RankingPaneProps) {
  const [year,    setYear]    = useState<2025 | 2026 | 'all'>('all');
  const [section, setSection] = useState<Section>('pacientes');

  // Memoize combined arrays so patientMap deps are stable
  const cir  = useMemo(
    () => year === 2025 ? cir25 : year === 2026 ? cir26 : [...cir25, ...cir26],
    [year, cir25, cir26]
  );
  const cons = useMemo(
    () => year === 2025 ? cons25 : year === 2026 ? cons26 : [...cons25, ...cons26],
    [year, cons25, cons26]
  );

  // ── Patient map (all patients including v=0) ─────────────
  const patientMap = useMemo(() => {
    const map = new Map<string, PatientRank>();
    for (const s of cir) {
      const e = map.get(s.p) ?? {
        name: s.p, surgeries: 0, consultations: 0,
        revenue: 0, maxSurgery: 0, lastDate: s.d, lastProc: s.c,
      };
      map.set(s.p, {
        ...e,
        surgeries: e.surgeries + 1,
        revenue: e.revenue + s.v,
        maxSurgery: Math.max(e.maxSurgery, s.v),
        lastDate: s.d,
        lastProc: s.c,
      });
    }
    for (const c of cons) {
      const e = map.get(c.p) ?? {
        name: c.p, surgeries: 0, consultations: 0,
        revenue: 0, maxSurgery: 0, lastDate: c.d, lastProc: '',
      };
      map.set(c.p, { ...e, consultations: e.consultations + 1 });
    }
    return map;
  }, [cir, cons]);

  // Sort: most-expensive single procedure first → total revenue → count → name
  const byRevenue = useMemo(() =>
    Array.from(patientMap.values())
      .filter(p => p.surgeries > 0)
      .sort((a, b) => {
        if (b.maxSurgery !== a.maxSurgery) return b.maxSurgery - a.maxSurgery;
        if (b.revenue    !== a.revenue)    return b.revenue    - a.revenue;
        if (b.surgeries  !== a.surgeries)  return b.surgeries  - a.surgeries;
        return a.name.localeCompare(b.name, 'pt-BR');
      })
      .slice(0, 25),
    [patientMap]
  );

  // Procedure ranking
  const byProc = useMemo(() => {
    const map = new Map<string, { procedure: string; count: number; revenue: number }>();
    for (const s of cir) {
      // Agrupamento por categoria unificada — variações de digitação
      // ("lipedema + tecnologia", "Lipedema & Tecnologia") caem no mesmo bucket
      const key = canonicalCategoryLabel(s.cl) || s.c;
      const e = map.get(key) ?? { procedure: key, count: 0, revenue: 0 };
      map.set(key, { ...e, count: e.count + 1, revenue: e.revenue + s.v });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [cir]);

  // Recent surgeries (newest first)
  const recentCir = useMemo(() => {
    const all = [
      ...cir26.map(s => ({ ...s, year: 2026 })),
      ...cir25.map(s => ({ ...s, year: 2025 })),
    ];
    return all.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const [da, ma] = a.d.split('/').map(Number);
      const [db, mb] = b.d.split('/').map(Number);
      if (mb !== ma) return mb - ma;
      return db - da;
    }).slice(0, 25);
  }, [cir25, cir26]);

  const maxRev  = byRevenue[0]?.maxSurgery || 1;
  const maxProc = byProc[0]?.count || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Controls ──────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="seg">
          {(['pacientes', 'procedimentos', 'recentes'] as Section[]).map((s) => (
            <button key={s} className={`sb${section === s ? ' on' : ''}`} onClick={() => setSection(s)}>
              {s === 'pacientes' ? 'Pacientes' : s === 'procedimentos' ? 'Procedimentos' : 'Recentes'}
            </button>
          ))}
        </div>
        <div className="seg">
          {(['all', 2025, 2026] as const).map((y) => (
            <button key={String(y)} className={`sb${year === y ? ' on' : ''}`} onClick={() => setYear(y)}>
              {y === 'all' ? 'Todos' : y}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pacientes: cirurgia mais cara primeiro ─────── */}
      {section === 'pacientes' && (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div className="card-ttl" style={{ margin: 0 }}>
              Top {byRevenue.length} · maior valor por cirurgia
            </div>
            <span style={{ fontSize: '11px', color: '#86868B' }}>ordenado pela cirurgia mais cara</span>
          </div>
          {byRevenue.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#86868B', padding: '32px 0', margin: 0 }}>Sem dados para o período</p>
          ) : (
            byRevenue.map((p, i) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Medal */}
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#F2F2F7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 800, color: i < 3 ? '#1D1D1F' : '#86868B',
                }}>
                  {i + 1}
                </div>
                {/* Bar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '8px', alignItems: 'center' }}>
                      {p.maxSurgery > 0 && (
                        <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#28A745' }}>
                          {formatCurrency(p.maxSurgery)}
                        </span>
                      )}
                      {p.revenue !== p.maxSurgery && p.revenue > 0 && (
                        <span style={{ fontSize: '0.72rem', color: '#86868B' }}>
                          total {formatCurrency(p.revenue)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ height: '6px', background: '#F2F2F7', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.max((p.maxSurgery / maxRev) * 100, p.maxSurgery === 0 ? 6 : 0)}%`,
                      background: i === 0
                        ? 'linear-gradient(90deg,#FFD700,#FF9500)'
                        : `linear-gradient(90deg,${COLORS[i % COLORS.length]},${COLORS[(i+1) % COLORS.length]})`,
                      borderRadius: '3px', transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '3px' }}>
                    <span style={{ fontSize: '0.68rem', color: '#86868B' }}>
                      {p.surgeries} cirurgia{p.surgeries !== 1 ? 's' : ''}
                    </span>
                    {p.consultations > 0 && (
                      <span style={{ fontSize: '0.68rem', color: '#86868B' }}>
                        {p.consultations} consulta{p.consultations !== 1 ? 's' : ''}
                      </span>
                    )}
                    {p.maxSurgery === 0 && (
                      <span style={{ fontSize: '0.68rem', color: '#FF9500', fontWeight: 600 }}>valor pendente</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Procedimentos ─────────────────────────────── */}
      {section === 'procedimentos' && (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="card-ttl">Top {byProc.length} procedimentos</div>
          {byProc.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#86868B', padding: '32px 0', margin: 0 }}>Sem dados</p>
          ) : (
            byProc.map((p, i) => (
              <div key={p.procedure} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                  background: `${COLORS[i % COLORS.length]}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 800, color: COLORS[i % COLORS.length],
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.procedure}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '0.875rem', color: COLORS[i % COLORS.length], flexShrink: 0, marginLeft: '8px' }}>
                      {p.count}×
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#F2F2F7', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${(p.count / maxProc) * 100}%`,
                      background: `linear-gradient(90deg,${COLORS[i % COLORS.length]},${COLORS[(i+1) % COLORS.length]})`,
                      borderRadius: '3px', transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#86868B' }}>{formatCurrency(p.revenue)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Recentes ──────────────────────────────────── */}
      {section === 'recentes' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ts">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Paciente</th>
                  <th>Data</th>
                  <th>Procedimento</th>
                  <th>Categoria</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {recentCir.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#86868B', padding: '32px' }}>Sem dados</td></tr>
                ) : (
                  recentCir.map((s, i) => (
                    <tr key={i}>
                      <td style={{ color: '#86868B', fontSize: '11px', fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ fontWeight: 700, color: '#1D1D1F' }}>{s.p}</td>
                      <td style={{ whiteSpace: 'nowrap', color: '#86868B', fontSize: '12px' }}>{s.d}/{s.year}</td>
                      <td style={{ fontSize: '12px', color: '#3A3A3C', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.c}</td>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize: '10px' }}>{s.cl}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: s.v > 0 ? '#28A745' : '#86868B', whiteSpace: 'nowrap' }}>
                        {s.v > 0 ? formatCurrency(s.v) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
