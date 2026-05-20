'use client';

import KPICards from '../KPICards';
import { RevenueBarChart, MonthlySurgeriesChart } from '../Charts';
import { computeKPIs, computeMonthlyData, computeRevenueByMonth, formatCurrency } from '@/lib/dashboard-calculations';
import type { Surgery, Consultation } from '@/lib/data-model';

interface ResumoPaneProps {
  cir25: Surgery[];
  cir26: Surgery[];
  cons25: Consultation[];
  cons26: Consultation[];
}

export default function ResumoPane({ cir25, cir26, cons25, cons26 }: ResumoPaneProps) {
  const kpis = computeKPIs(cir25, cir26, cons25, cons26);
  const monthly25 = computeMonthlyData(cir25, cons25);
  const monthly26 = computeMonthlyData(cir26, cons26);
  const rev25 = computeRevenueByMonth(cir25);
  const rev26 = computeRevenueByMonth(cir26);

  const yearSelector = [2025, 2026] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Year selector header */}
      {yearSelector.map((year) => {
        const isActive = year === 2025;
        return (
          <div key={year}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '4px', height: '18px', borderRadius: '2px', background: '#007AFF' }} />
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1D1D1F' }}>
                Resumo {year}
              </h2>
              {year === 2026 && (
                <span style={{ fontSize: '0.72rem', background: '#E6F7EC', color: '#28A745', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                  Em andamento
                </span>
              )}
            </div>
            <KPICards kpis={kpis} year={year} />
          </div>
        );
      })}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>
            Receita Mensal — 2025
          </h3>
          <RevenueBarChart data={rev25} year={2025} />
        </div>
        <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>
            Receita Mensal — 2026
          </h3>
          <RevenueBarChart data={rev26} year={2026} />
        </div>
        <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>
            Cirurgias/mês — 2025
          </h3>
          <MonthlySurgeriesChart data={monthly25} year={2025} />
        </div>
        <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>
            Cirurgias/mês — 2026
          </h3>
          <MonthlySurgeriesChart data={monthly26} year={2026} />
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>
          Receita total acumulada
        </h3>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { label: '2025', value: formatCurrency(kpis.totalRevenue2025), color: '#007AFF' },
            { label: '2026 (parcial)', value: formatCurrency(kpis.totalRevenue2026), color: '#28A745' },
            { label: 'Total geral', value: formatCurrency(kpis.totalRevenue2025 + kpis.totalRevenue2026), color: '#1D1D1F' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontSize: '0.72rem', color: '#86868B', fontWeight: 600, marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
