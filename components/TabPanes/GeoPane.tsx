'use client';

import { useState } from 'react';
import type { Surgery, Consultation } from '@/lib/data-model';
import { canal25, canal26, city25, city26, age25, age26, intl25, intl26 } from '@/lib/legacy-data';
import { CanalDoughnutChart, AgeBarChart, CityPieChart } from '../Charts';

interface GeoPaneProps {
  cir25: Surgery[];
  cir26: Surgery[];
  cons25: Consultation[];
  cons26: Consultation[];
}

export default function GeoPane({ cir25, cir26, cons25, cons26 }: GeoPaneProps) {
  const [year, setYear] = useState<2025 | 2026>(2025);

  const canalData = year === 2025 ? canal25 : canal26;
  const cityData = year === 2025 ? city25 : city26;
  const ageData = year === 2025 ? age25 : age26;
  const intlData = year === 2025 ? intl25 : intl26;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1D1D1F' }}>
          Canais, Faixa Etária e Geolocalização
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Canal */}
        <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>
            Canal de captação
          </h4>
          <CanalDoughnutChart data={canalData} />
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {canalData.map((d) => (
              <div key={d.canal} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#1D1D1F', fontWeight: 500 }}>{d.canal}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#1D1D1F' }}>{d.count}</span>
                  <span style={{ color: '#86868B' }}>{d.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Age */}
        <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>
            Faixa etária
          </h4>
          <AgeBarChart data={ageData} />
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {ageData.map((d) => (
              <div key={d.faixa} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: '#86868B' }}>{d.faixa} anos</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#5856D6' }}>{d.count}</span>
                  <span style={{ color: '#86868B' }}>{d.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cities */}
        <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>
            Cidades de origem
          </h4>
          <CityPieChart data={cityData} />
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {cityData.slice(0, 6).map((d) => (
              <div key={d.cidade} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: '#1D1D1F', fontWeight: 500 }}>{d.cidade}</span>
                <span style={{ fontWeight: 700, color: '#007AFF' }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* International */}
      {intlData.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>
            Pacientes internacionais
          </h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {intlData.map((d) => (
              <div
                key={d.pais}
                style={{
                  padding: '10px 16px',
                  background: '#F0F7FF',
                  borderRadius: '10px',
                  border: '1.5px solid #007AFF30',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>🌍</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1D1D1F' }}>{d.pais}</div>
                  <div style={{ fontSize: '0.75rem', color: '#86868B' }}>{d.count} paciente{d.count !== 1 ? 's' : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
