'use client';

import { useState } from 'react';
import type { Surgery, Consultation } from '@/lib/data-model';
import { formatCurrency } from '@/lib/dashboard-calculations';

interface RankingPaneProps {
  cir25: Surgery[];
  cir26: Surgery[];
  cons25: Consultation[];
  cons26: Consultation[];
}

interface PatientRank {
  name: string;
  surgeries: number;
  consultations: number;
  revenue: number;
}

export default function RankingPane({ cir25, cir26, cons25, cons26 }: RankingPaneProps) {
  const [year, setYear] = useState<2025 | 2026 | 'all'>('all');

  const cir = year === 2025 ? cir25 : year === 2026 ? cir26 : [...cir25, ...cir26];
  const cons = year === 2025 ? cons25 : year === 2026 ? cons26 : [...cons25, ...cons26];

  // Build patient map
  const map = new Map<string, PatientRank>();

  for (const s of cir) {
    const existing = map.get(s.p) || { name: s.p, surgeries: 0, consultations: 0, revenue: 0 };
    map.set(s.p, { ...existing, surgeries: existing.surgeries + 1, revenue: existing.revenue + s.v });
  }

  for (const c of cons) {
    const existing = map.get(c.p) || { name: c.p, surgeries: 0, consultations: 0, revenue: 0 };
    map.set(c.p, { ...existing, consultations: existing.consultations + 1 });
  }

  const ranked = Array.from(map.values())
    .filter((p) => p.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20);

  const maxRevenue = ranked[0]?.revenue || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Year selector */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1D1D1F' }}>
          Top 20 Pacientes por Receita
        </h3>
        <div style={{ display: 'flex', background: '#F2F2F7', borderRadius: '10px', padding: '3px', gap: '2px' }}>
          {(['all', 2025, 2026] as const).map((y) => (
            <button
              key={String(y)}
              onClick={() => setYear(y)}
              style={{
                padding: '5px 12px',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: y === year ? 700 : 500,
                fontFamily: 'inherit',
                fontSize: '0.8rem',
                background: y === year ? '#fff' : 'transparent',
                color: y === year ? '#1D1D1F' : '#86868B',
                boxShadow: y === year ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {y === 'all' ? 'Todos' : y}
            </button>
          ))}
        </div>
      </div>

      {/* Ranking list */}
      <div style={{ background: '#fff', borderRadius: '18px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {ranked.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#86868B', padding: '32px 0' }}>Sem dados para o período</p>
        ) : (
          ranked.map((p, i) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Rank badge */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#F2F2F7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: i < 3 ? '#1D1D1F' : '#86868B',
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>

              {/* Name and bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#28A745', flexShrink: 0, marginLeft: '8px' }}>
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
                <div style={{ height: '6px', background: '#F2F2F7', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(p.revenue / maxRevenue) * 100}%`,
                      background: i === 0 ? 'linear-gradient(90deg, #FFD700, #FF9500)' : 'linear-gradient(90deg, #007AFF, #5856D6)',
                      borderRadius: '3px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '3px' }}>
                  <span style={{ fontSize: '0.68rem', color: '#86868B' }}>{p.surgeries} cirurgia{p.surgeries !== 1 ? 's' : ''}</span>
                  {p.consultations > 0 && (
                    <span style={{ fontSize: '0.68rem', color: '#86868B' }}>{p.consultations} consulta{p.consultations !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
