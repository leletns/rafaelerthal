'use client';

import { useState } from 'react';
import type { Surgery, Consultation } from '@/lib/data-model';
import { computeKPIs, computeMonthlyData, formatCurrency, filterByPeriod } from '@/lib/dashboard-calculations';
import { ComparisonBarChart } from '../Charts';

interface CompPaneProps {
  cir25: Surgery[];
  cir26: Surgery[];
  cons25: Consultation[];
  cons26: Consultation[];
}

const MONTH_ORDER = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTH_NAMES: Record<string, string> = {
  'Jan':'Janeiro','Fev':'Fevereiro','Mar':'Março','Abr':'Abril',
  'Mai':'Maio','Jun':'Junho','Jul':'Julho','Ago':'Agosto',
  'Set':'Setembro','Out':'Outubro','Nov':'Novembro','Dez':'Dezembro',
};

export default function CompPane({ cir25, cir26, cons25, cons26 }: CompPaneProps) {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentMonthName = MONTH_ORDER[currentMonth];
  const [showFull2025, setShowFull2025] = useState(false);

  // Same-period filter (Jan → current month)
  const cir25Filtered  = showFull2025 ? cir25  : filterByPeriod(cir25,  currentMonth);
  const cons25Filtered = showFull2025 ? cons25 : filterByPeriod(cons25, currentMonth);

  const kpis = computeKPIs(cir25Filtered, cir26, cons25Filtered, cons26);
  const monthly25 = computeMonthlyData(cir25Filtered, cons25Filtered);
  const monthly26 = computeMonthlyData(cir26, cons26);

  function getMonthValue(data: { mes: string; cirurgias: number; receita: number }[], monthShort: string) {
    const fullName = MONTH_NAMES[monthShort];
    return data.find((d) => d.mes === fullName);
  }

  const periodMonths = showFull2025
    ? MONTH_SHORT
    : MONTH_SHORT.slice(0, currentMonth + 1);

  const compSurgeries = periodMonths.map((m) => ({
    label: m,
    v2025: getMonthValue(monthly25, m)?.cirurgias || 0,
    v2026: getMonthValue(monthly26, m)?.cirurgias || 0,
  })).filter((d) => d.v2025 > 0 || d.v2026 > 0);

  const compRevenue = periodMonths.map((m) => ({
    label: m,
    v2025: getMonthValue(monthly25, m)?.receita || 0,
    v2026: getMonthValue(monthly26, m)?.receita || 0,
  })).filter((d) => d.v2025 > 0 || d.v2026 > 0);

  const kpiComparisons = [
    { label: 'Cirurgias',   v2025: kpis.totalSurgeries2025,     v2026: kpis.totalSurgeries2026,     format: String },
    { label: 'Faturamento', v2025: kpis.totalRevenue2025,       v2026: kpis.totalRevenue2026,       format: formatCurrency },
    { label: 'Consultas',   v2025: kpis.totalConsultations2025, v2026: kpis.totalConsultations2026, format: String },
    { label: 'Ticket médio',v2025: kpis.avgTicket2025,          v2026: kpis.avgTicket2026,          format: formatCurrency },
    { label: 'Conversão',   v2025: kpis.conversionRate2025,     v2026: kpis.conversionRate2026,     format: (v: number) => `${v}%` },
  ];

  const periodLabel = showFull2025
    ? `Jan–Dez 2025 vs Jan–${MONTH_SHORT[currentMonth]} 2026`
    : `Jan–${MONTH_SHORT[currentMonth]} 2025 vs Jan–${MONTH_SHORT[currentMonth]} 2026`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1D1D1F' }}>
            Comparativo — {periodLabel}
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#86868B' }}>
            Mesmo período: Jan–{currentMonthName} de cada ano
          </p>
        </div>
        <button
          onClick={() => setShowFull2025(v => !v)}
          style={{
            padding: '6px 14px', borderRadius: '8px',
            border: `1.5px solid ${showFull2025 ? '#007AFF' : '#E5E5EA'}`,
            background: showFull2025 ? '#E5F1FF' : '#fff',
            color: showFull2025 ? '#007AFF' : '#86868B',
            fontSize: '0.78rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {showFull2025 ? '✓ 2025 completo' : 'Ver 2025 completo'}
        </button>
      </div>

      {/* KPI comparison table */}
      <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E5EA' }}>Métrica</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#007AFF', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E5EA' }}>2025</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#28A745', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E5EA' }}>2026</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E5EA' }}>Δ</th>
              </tr>
            </thead>
            <tbody>
              {kpiComparisons.map(({ label, v2025, v2026, format }) => {
                const delta = v2025 > 0 ? Math.round(((v2026 - v2025) / v2025) * 100) : 0;
                return (
                  <tr key={label}>
                    <td style={{ padding: '10px 12px', fontSize: '0.875rem', fontWeight: 600, color: '#1D1D1F', borderBottom: '1px solid #F2F2F7' }}>{label}</td>
                    <td style={{ padding: '10px 12px', fontSize: '0.875rem', fontWeight: 700, color: '#007AFF', textAlign: 'right', borderBottom: '1px solid #F2F2F7' }}>{format(v2025)}</td>
                    <td style={{ padding: '10px 12px', fontSize: '0.875rem', fontWeight: 700, color: '#28A745', textAlign: 'right', borderBottom: '1px solid #F2F2F7' }}>{format(v2026)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid #F2F2F7' }}>
                      <span style={{
                        fontSize: '0.8rem', fontWeight: 700,
                        color: delta >= 0 ? '#28A745' : '#FF3B30',
                        background: delta >= 0 ? '#E6F7EC' : '#FFE5E3',
                        padding: '2px 8px', borderRadius: '6px',
                      }}>
                        {delta >= 0 ? '+' : ''}{delta}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <ComparisonBarChart data={compSurgeries} title="Cirurgias por mês" />
        </div>
        <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <ComparisonBarChart data={compRevenue} title="Faturamento por mês (R$)" />
        </div>
      </div>
    </div>
  );
}
