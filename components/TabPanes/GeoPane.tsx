'use client';

import { useState } from 'react';
import type { Surgery, Consultation } from '@/lib/data-model';
import { canal25, canal26, cidades25, cidades26, fx25, fx26, intl25, intl26 } from '@/lib/legacy-data';

interface GeoPaneProps {
  cir25: Surgery[];
  cir26: Surgery[];
  cons25: Consultation[];
  cons26: Consultation[];
}

const COLORS = ['#007AFF', '#5856D6', '#FF9500', '#28A745', '#FF3B30', '#AF52DE', '#FF6B35', '#00C7BE'];

function RecordBar({ data, title, color }: { data: Record<string, number>; title: string; color: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const max = entries[0]?.[1] || 1;

  return (
    <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
      <h4 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {entries.map(([key, val], i) => {
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          const barW = (val / max) * 100;
          const c = COLORS[i % COLORS.length];
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 600, color: '#1D1D1F', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{key}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontWeight: 800, color: c }}>{val}</span>
                  <span style={{ color: '#86868B' }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height: '6px', background: '#F2F2F7', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${barW}%`, background: c, borderRadius: '3px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CidadesCard({ data, title }: { data: Record<string, number>; title: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
      <h4 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {entries.map(([cidade, count]) => (
          <div key={cidade} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F2F2F7', fontSize: '0.82rem' }}>
            <span style={{ color: '#1D1D1F', fontWeight: 500 }}>{cidade}</span>
            <span style={{ fontWeight: 800, color: '#007AFF', minWidth: '28px', textAlign: 'right' }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntlCard({ data, title }: { data: Record<string, number>; title: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  return (
    <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
      <h4 style={{ margin: '0 0 12px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>{title}</h4>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {entries.map(([pais, count]) => (
          <div
            key={pais}
            style={{
              padding: '8px 14px',
              background: '#F0F7FF',
              borderRadius: '10px',
              border: '1.5px solid #007AFF30',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1D1D1F' }}>{pais}</div>
              <div style={{ fontSize: '0.7rem', color: '#86868B' }}>{count} pac.</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GeoPane({ cir25: _c25, cir26: _c26, cons25: _co25, cons26: _co26 }: GeoPaneProps) {
  const [year, setYear] = useState<2025 | 2026>(2025);

  const canalData   = year === 2025 ? canal25   : canal26;
  const cidadeData  = year === 2025 ? cidades25  : cidades26;
  const fxData      = year === 2025 ? fx25       : fx26;
  const intlData    = year === 2025 ? intl25     : intl26;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1D1D1F' }}>
          Canais, Faixa Etária & Origem
        </h3>
        <div style={{ display: 'flex', background: '#F2F2F7', borderRadius: '10px', padding: '3px', gap: '2px' }}>
          {([2025, 2026] as const).map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              style={{
                padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontWeight: y === year ? 700 : 500, fontFamily: 'inherit', fontSize: '0.8rem',
                background: y === year ? '#fff' : 'transparent',
                color: y === year ? '#1D1D1F' : '#86868B',
                boxShadow: y === year ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <RecordBar data={canalData}  title="Canal de captação"  color="#007AFF" />
        <RecordBar data={fxData}     title="Faixa etária"       color="#5856D6" />
        <CidadesCard data={cidadeData} title="Cidades de origem" />
      </div>

      <IntlCard data={intlData} title="Pacientes internacionais" />
    </div>
  );
}
