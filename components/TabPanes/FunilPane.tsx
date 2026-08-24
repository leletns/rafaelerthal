'use client';

import { useState } from 'react';
import type { Surgery, Consultation } from '@/lib/data-model';
import { computeFunnelData } from '@/lib/dashboard-calculations';
import { FunnelBarChart } from '../Charts';

interface FunilPaneProps {
  cir25: Surgery[];
  cir26: Surgery[];
  cons25: Consultation[];
  cons26: Consultation[];
}

export default function FunilPane({ cir25, cir26, cons25, cons26 }: FunilPaneProps) {
  const [year, setYear] = useState<2025 | 2026>(2025);

  const cir = year === 2025 ? cir25 : cir26;
  const cons = year === 2025 ? cons25 : cons26;
  const funnel = computeFunnelData(cons, cir);
  const maxVal = funnel[0]?.value || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Funil de Conversão — Consultas → Cirurgias</h3>
        <div style={{ display: 'flex', background: 'var(--fill)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
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
                background: y === year ? 'var(--surface)' : 'transparent',
                color: y === year ? 'var(--text)' : 'var(--text-2)',
                boxShadow: y === year ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Visual funnel */}
        <div style={{ background: 'var(--surface)', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)' }}>
            Funil Visual
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {funnel.map((stage, i) => {
              const width = (stage.value / maxVal) * 100;
              const colors = ['var(--c-blue)', 'var(--c-purple)', 'var(--c-orange)', 'var(--c-green)', 'var(--c-red)'];
              const color = colors[i] || 'var(--text-2)';

              return (
                <div key={stage.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>{stage.label}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color }}>{stage.value}</span>
                      {stage.pct !== undefined && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-2)' }}>{stage.pct}%</span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        height: '28px',
                        width: `${width}%`,
                        background: color,
                        borderRadius: '6px',
                        transition: 'width 0.5s ease',
                        minWidth: '20px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ background: 'var(--surface)', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)' }}>
            Gráfico de Barras
          </h4>
          <FunnelBarChart data={funnel} />
        </div>
      </div>

      {/* Conversion stats */}
      <div style={{ background: 'var(--surface)', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <h4 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)' }}>
          Taxas de Conversão
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {funnel.slice(1).map((stage, i) => {
            const prev = funnel[i];
            const rate = prev.value > 0 ? Math.round((stage.value / prev.value) * 100) : 0;
            const colors = ['var(--c-purple)', 'var(--c-orange)', 'var(--c-green)', 'var(--c-red)'];
            const color = colors[i] || 'var(--text-2)';

            return (
              <div
                key={stage.label}
                style={{
                  background: `color-mix(in srgb, ${color} 3%, transparent)`,
                  borderRadius: '10px',
                  padding: '12px',
                  borderTop: `2px solid ${color}`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{rate}%</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-2)', marginTop: '2px', lineHeight: 1.3 }}>
                  {prev.label} → {stage.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
