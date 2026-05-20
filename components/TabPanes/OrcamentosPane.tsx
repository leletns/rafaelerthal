'use client';

import { useState } from 'react';
import { orc25, orc26 } from '@/lib/legacy-data';

export default function OrcamentosPane() {
  const [year, setYear] = useState<2025 | 2026>(2025);
  const data = year === 2025 ? orc25 : orc26;

  // fechou = fechou cirurgia, nao = não fechou, plano = plano de pagamento, pendente = em aberto
  const fechouRate   = data.total > 0 ? Math.round((data.fechou   / data.total) * 100) : 0;
  const naoRate      = data.total > 0 ? Math.round((data.nao      / data.total) * 100) : 0;
  const planoRate    = data.total > 0 ? Math.round((data.plano    / data.total) * 100) : 0;
  const pendenteRate = data.total > 0 ? Math.round((data.pendente / data.total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1D1D1F' }}>
          Orçamentos & Conversão
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

      {/* KPI boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total consultados', value: data.total,    color: '#007AFF', bg: '#E5F1FF' },
          { label: 'Fechou cirurgia',   value: data.fechou,   color: '#28A745', bg: '#E6F7EC' },
          { label: 'Não fechou',        value: data.nao,      color: '#FF3B30', bg: '#FFE5E3' },
          { label: 'Plano pagamento',   value: data.plano,    color: '#FF9500', bg: '#FFF3E0' },
          { label: 'Pendente',          value: data.pendente, color: '#5856D6', bg: '#F0F0FF' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '0.7rem', color, fontWeight: 600, marginTop: '4px', lineHeight: 1.2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Rate bars */}
      <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <h4 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>
          Distribuição dos orçamentos
        </h4>
        {[
          { label: 'Fechou cirurgia', rate: fechouRate,   color: '#28A745', count: data.fechou },
          { label: 'Não fechou',      rate: naoRate,      color: '#FF3B30', count: data.nao },
          { label: 'Plano',           rate: planoRate,    color: '#FF9500', count: data.plano },
          { label: 'Pendente',        rate: pendenteRate, color: '#5856D6', count: data.pendente },
        ].map(({ label, rate, color, count }) => (
          <div key={label} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1D1D1F' }}>{label}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color }}>{count}</span>
                <span style={{ fontSize: '0.75rem', color: '#86868B' }}>{rate}%</span>
              </div>
            </div>
            <div style={{ height: '10px', background: '#F2F2F7', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${rate}%`, background: color, borderRadius: '5px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Funil insight */}
      <div style={{ background: '#E6F7EC', borderRadius: '14px', padding: '16px', border: '1.5px solid #28A74540' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#1D7A33', fontWeight: 600 }}>
          ✅ Taxa de conversão: <strong>{fechouRate}%</strong> dos {data.total} atendimentos se tornaram cirurgias em {year}
        </p>
      </div>
    </div>
  );
}
