'use client';

import { useState } from 'react';
import type { Surgery, Consultation, CanalStats, FxStats, CidadeStats, IntlStats } from '@/lib/data-model';

interface GeoPaneProps {
  cir25: Surgery[];
  cir26: Surgery[];
  cons25: Consultation[];
  cons26: Consultation[];
  canal25: CanalStats;
  canal26: CanalStats;
  cidades25: CidadeStats;
  cidades26: CidadeStats;
  fx25: FxStats;
  fx26: FxStats;
  intl25: IntlStats;
  intl26: IntlStats;
}

const COLORS = ['#007AFF', '#5856D6', '#FF9500', '#28A745', '#FF3B30', '#AF52DE', '#FF6B35', '#00C7BE'];

function BarList({ entries, total }: { entries: [string, number][]; total: number }) {
  const max = entries[0]?.[1] || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {entries.map(([key, val], i) => {
        const pct   = total > 0 ? Math.round((val / total) * 100) : 0;
        const barW  = (val / max) * 100;
        const color = COLORS[i % COLORS.length];
        return (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '0.8rem' }}>
              <span style={{
                fontWeight: 600, color: '#1D1D1F',
                maxWidth: '68%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {key}
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 800, color }}>{val}</span>
                <span style={{ color: '#86868B', fontSize: '0.75rem' }}>{pct}%</span>
              </div>
            </div>
            <div style={{ height: '6px', background: '#F2F2F7', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${barW}%`, background: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
      <h4 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>{title}</h4>
      {children}
    </div>
  );
}

export default function GeoPane({
  cir25, cir26, cons25, cons26,
  canal25, canal26,
  cidades25, cidades26,
  fx25, fx26,
  intl25, intl26,
}: GeoPaneProps) {
  const [year, setYear] = useState<2025 | 2026>(new Date().getFullYear() >= 2026 ? 2026 : 2025);

  const canalData  = year === 2025 ? canal25  : canal26;
  const cidadeData = year === 2025 ? cidades25 : cidades26;
  const fxData     = year === 2025 ? fx25      : fx26;
  const intlData   = year === 2025 ? intl25    : intl26;
  const cir        = year === 2025 ? cir25     : cir26;
  const cons       = year === 2025 ? cons25    : cons26;

  // Regions from cir data (Surgery.reg)
  const operatedRegions = cir.reduce<Record<string, number>>((acc, s) => {
    const reg = s.reg;
    if (reg) acc[reg] = (acc[reg] ?? 0) + 1;
    return acc;
  }, {});

  // Regions from consultations (city field as region proxy)
  const allPatientsRegions = cons.reduce<Record<string, number>>((acc, c) => {
    const city = c.cidade;
    if (city) acc[city] = (acc[city] ?? 0) + 1;
    return acc;
  }, {});

  // Remove generic "Internacional" from domestic city list — it belongs in intl section
  const domesticCidades = Object.entries(cidadeData)
    .filter(([k]) => k.toLowerCase() !== 'internacional')
    .sort((a, b) => b[1] - a[1]);

  const intlEntries = Object.entries(intlData).sort((a, b) => b[1] - a[1]);
  const intlTotal   = intlEntries.reduce((s, [,v]) => s + v, 0);

  const canalEntries  = Object.entries(canalData).sort((a, b) => b[1] - a[1]);
  const canalTotal    = canalEntries.reduce((s, [,v]) => s + v, 0);

  const fxEntries     = Object.entries(fxData).sort((a, b) => b[1] - a[1]);
  const fxTotal       = fxEntries.reduce((s, [,v]) => s + v, 0);

  const regEntries    = Object.entries(operatedRegions)
    .filter(([k]) => k.toLowerCase() !== 'internacional')
    .sort((a, b) => b[1] - a[1]);

  const allRegEntries = Object.entries(allPatientsRegions).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1D1D1F' }}>
          Origem, Canais &amp; Perfil
        </h3>
        <div className="seg">
          {([2025, 2026] as const).map((y) => (
            <button key={y} className={`sb${y === year ? ' on' : ''}`} onClick={() => setYear(y)}>{y}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

        {/* Canal */}
        <SectionCard title="Canal de captação">
          <BarList entries={canalEntries} total={canalTotal} />
        </SectionCard>

        {/* Faixa etária */}
        <SectionCard title="Faixa etária">
          <BarList entries={fxEntries} total={fxTotal} />
        </SectionCard>

        {/* Cidades de origem (operadas) */}
        {domesticCidades.length > 0 && (
          <SectionCard title="Cidades das pacientes">
            <BarList
              entries={domesticCidades}
              total={domesticCidades.reduce((s, [,v]) => s + v, 0)}
            />
          </SectionCard>
        )}

        {/* Regiões das operadas (Surgery.reg) */}
        {regEntries.length > 0 && (
          <SectionCard title={`Regiões — pacientes (${year})`}>
            <BarList entries={regEntries} total={regEntries.reduce((s, [,v]) => s + v, 0)} />
          </SectionCard>
        )}

        {/* Regiões de todos os pacientes (consultas) */}
        {allRegEntries.length > 0 && (
          <SectionCard title={`Cidades — todos os atendimentos (${year})`}>
            <BarList entries={allRegEntries} total={allRegEntries.reduce((s, [,v]) => s + v, 0)} />
          </SectionCard>
        )}
      </div>

      {/* International — specific countries */}
      {intlEntries.length > 0 && (
        <SectionCard title={`Pacientes internacionais · ${intlTotal} total (${year})`}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {intlEntries.map(([country, count], i) => (
              <div
                key={country}
                style={{
                  padding: '10px 16px',
                  background: '#F0F7FF',
                  borderRadius: '12px',
                  border: '1.5px solid #007AFF25',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  minWidth: '90px',
                }}
              >
                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: COLORS[i % COLORS.length], lineHeight: 1 }}>
                  {count}
                </span>
                <span style={{ fontWeight: 600, fontSize: '0.78rem', color: '#1D1D1F', textAlign: 'center' }}>
                  {country}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
