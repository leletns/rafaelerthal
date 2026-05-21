'use client';

import { useState, useMemo } from 'react';
import type { Surgery, Consultation } from '@/lib/data-model';
import { formatCurrency } from '@/lib/dashboard-calculations';

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
  lastDate: string;
  lastProc: string;
}

const COLORS = ['#007AFF','#5856D6','#FF9500','#28A745','#FF3B30','#AF52DE','#FF6B35','#00C7BE'];

function sortByDate(surgeries: Surgery[], year: number): Surgery[] {
  return [...surgeries].sort((a, b) => {
    const [da, ma] = a.d.split('/').map(Number);
    const [db, mb] = b.d.split('/').map(Number);
    const dateA = new Date(year, ma - 1, da);
    const dateB = new Date(year, mb - 1, db);
    return dateB.getTime() - dateA.getTime(); // newest first
  });
}

export default function RankingPane({ cir25, cir26, cons25, cons26 }: RankingPaneProps) {
  const [year,    setYear]    = useState<2025 | 2026 | 'all'>('all');
  const [section, setSection] = useState<Section>('pacientes');

  const cir  = year === 2025 ? cir25 : year === 2026 ? cir26 : [...cir25, ...cir26];
  const cons = year === 2025 ? cons25 : year === 2026 ? cons26 : [...cons25, ...cons26];
  const cir26sorted = useMemo(() => sortByDate(cir26, 2026), [cir26]);
  const cir25sorted = useMemo(() => sortByDate(cir25, 2025), [cir25]);

  // Última cirurgia = most recent from 2026, fallback 2025
  const ultimaCir = cir26sorted[0] ?? cir25sorted[0] ?? null;
  const ultimaYear = cir26sorted.length > 0 ? 2026 : 2025;

  // Build patient map (include all, even v=0)
  const patientMap = useMemo(() => {
    const map = new Map<string, PatientRank>();
    for (const s of cir) {
      const e = map.get(s.p) ?? { name: s.p, surgeries: 0, consultations: 0, revenue: 0, lastDate: s.d, lastProc: s.c };
      map.set(s.p, { ...e, surgeries: e.surgeries + 1, revenue: e.revenue + s.v, lastDate: s.d, lastProc: s.c });
    }
    for (const c of cons) {
      const e = map.get(c.p) ?? { name: c.p, surgeries: 0, consultations: 0, revenue: 0, lastDate: c.d, lastProc: '' };
      map.set(c.p, { ...e, consultations: e.consultations + 1 });
    }
    return map;
  }, [cir, cons]);

  const byRevenue = useMemo(() =>
    Array.from(patientMap.values())
      .filter(p => p.surgeries > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20),
    [patientMap]);

  // Procedure ranking
  const byProc = useMemo(() => {
    const map = new Map<string, { procedure: string; count: number; revenue: number }>();
    for (const s of cir) {
      const key = s.cl || s.c;
      const e = map.get(key) ?? { procedure: key, count: 0, revenue: 0 };
      map.set(key, { ...e, count: e.count + 1, revenue: e.revenue + s.v });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [cir]);

  // Recent surgeries
  const recentCir = useMemo(() => {
    const all = [
      ...cir26.map(s => ({ ...s, year: 2026 })),
      ...cir25.map(s => ({ ...s, year: 2025 })),
    ];
    return all
      .sort((a, b) => {
        const [da, ma] = a.d.split('/').map(Number);
        const [db, mb] = b.d.split('/').map(Number);
        if (a.year !== b.year) return b.year - a.year;
        if (mb !== ma) return mb - ma;
        return db - da;
      })
      .slice(0, 20);
  }, [cir25, cir26]);

  const maxRev = byRevenue[0]?.revenue || 1;
  const maxProc = byProc[0]?.count || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Última cirurgia badge ─────────────────────────── */}
      {ultimaCir && (
        <div style={{
          background: 'linear-gradient(135deg, #007AFF, #5856D6)',
          borderRadius: '18px',
          padding: '18px 22px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.8 }}>
              Última cirurgia realizada · {ultimaYear}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '4px' }}>{ultimaCir.p}</div>
            <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: '2px' }}>{ultimaCir.c}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>{ultimaCir.d} · {ultimaCir.cl}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {ultimaCir.v > 0 && (
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{formatCurrency(ultimaCir.v)}</div>
            )}
            <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: '4px' }}>
              {cir.length} cirurgia{cir.length !== 1 ? 's' : ''} · {cons.length} consulta{cons.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {/* ── Controls ──────────────────────────────────────── */}
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

      {/* ── Pacientes por receita ──────────────────────────── */}
      {section === 'pacientes' && (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="card-ttl">Top {byRevenue.length} pacientes por receita</div>
          {byRevenue.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#86868B', padding: '32px 0', margin: 0 }}>Sem dados para o período</p>
          ) : (
            byRevenue.map((p, i) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#F2F2F7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 800, color: i < 3 ? '#1D1D1F' : '#86868B',
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '0.875rem', color: p.revenue > 0 ? '#28A745' : '#86868B', flexShrink: 0, marginLeft: '8px' }}>
                      {p.revenue > 0 ? formatCurrency(p.revenue) : `${p.surgeries} cir.`}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#F2F2F7', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.max((p.revenue / maxRev) * 100, p.revenue === 0 ? 8 : 0)}%`,
                      background: i === 0 ? 'linear-gradient(90deg,#FFD700,#FF9500)' : `linear-gradient(90deg,${COLORS[i % COLORS.length]},${COLORS[(i+1) % COLORS.length]})`,
                      borderRadius: '3px', transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '3px' }}>
                    <span style={{ fontSize: '0.68rem', color: '#86868B' }}>{p.surgeries} cirurgia{p.surgeries !== 1 ? 's' : ''}</span>
                    {p.consultations > 0 && <span style={{ fontSize: '0.68rem', color: '#86868B' }}>{p.consultations} consulta{p.consultations !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Procedimentos ─────────────────────────────────── */}
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

      {/* ── Recentes ──────────────────────────────────────── */}
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
