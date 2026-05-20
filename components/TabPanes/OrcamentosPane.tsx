'use client';

import { useState } from 'react';
import { orc25, orc26 } from '@/lib/legacy-data';
import { formatCurrency } from '@/lib/dashboard-calculations';

export default function OrcamentosPane() {
  const [year, setYear] = useState<2025 | 2026>(2025);
  const data = year === 2025 ? orc25 : orc26;

  const stats = [
    { label: 'Total enviados', value: String(data.total), color: '#007AFF', bg: '#E5F1FF' },
    { label: 'Aceitos', value: String(data.aceitos), color: '#28A745', bg: '#E6F7EC' },
    { label: 'Pendentes', value: String(data.pendentes), color: '#FF9500', bg: '#FFF3E0' },
    { label: 'Recusados', value: String(data.recusados), color: '#FF3B30', bg: '#FFE5E3' },
  ];

  const acceptRate = data.total > 0 ? Math.round((data.aceitos / data.total) * 100) : 0;
  const pendingRate = data.total > 0 ? Math.round((data.pendentes / data.total) * 100) : 0;
  const refusedRate = data.total > 0 ? Math.round((data.recusados / data.total) * 100) : 0;

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
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
        {stats.map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '0.72rem', color, fontWeight: 600, marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Revenue comparison */}
      <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <h4 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>
          Valores
        </h4>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'Valor total orçado', value: formatCurrency(data.valorTotal), color: '#007AFF' },
            { label: 'Valor aceito', value: formatCurrency(data.valorAceito), color: '#28A745' },
            {
              label: 'Taxa de aprovação',
              value: `${data.valorTotal > 0 ? Math.round((data.valorAceito / data.valorTotal) * 100) : 0}%`,
              color: '#5856D6',
            },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontSize: '0.72rem', color: '#86868B', fontWeight: 600, marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rate bars */}
      <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <h4 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>
          Distribuição dos orçamentos
        </h4>
        {[
          { label: 'Aceitos', rate: acceptRate, color: '#28A745', count: data.aceitos },
          { label: 'Pendentes', rate: pendingRate, color: '#FF9500', count: data.pendentes },
          { label: 'Recusados', rate: refusedRate, color: '#FF3B30', count: data.recusados },
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
              <div
                style={{
                  height: '100%',
                  width: `${rate}%`,
                  background: color,
                  borderRadius: '5px',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div style={{ background: '#FFF3E0', borderRadius: '14px', padding: '14px 16px', border: '1.5px solid #FF950040' }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#FF9500', fontWeight: 600 }}>
          💡 Para acompanhar orçamentos individualmente, use o Pipeline Comercial (aba Pipeline)
        </p>
      </div>
    </div>
  );
}
