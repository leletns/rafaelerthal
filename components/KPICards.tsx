'use client';

import { formatCurrency } from '@/lib/dashboard-calculations';
import type { KPIData } from '@/lib/data-model';

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
}

function KPICard({ label, value, sub, color }: KPICardProps) {
  return (
    <div className="kpi">
      <div className="kpi-line" style={{ background: color }} />
      <div className="kpi-lbl">{label}</div>
      <div className="kpi-val">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

interface KPICardsProps {
  kpis: KPIData;
  year: 2025 | 2026;
  /** KPIs recalculados com 2025 filtrado para o mesmo período de 2026 (Jan → mês atual) */
  trendKpis?: KPIData;
  /** Rótulo do período comparado, ex.: "Jan–Jul" */
  trendPeriodLabel?: string;
}

export default function KPICards({ kpis, year, trendKpis, trendPeriodLabel }: KPICardsProps) {
  const is2025 = year === 2025;

  const surgeries   = is2025 ? kpis.totalSurgeries2025     : kpis.totalSurgeries2026;
  const revenue     = is2025 ? kpis.totalRevenue2025       : kpis.totalRevenue2026;
  const consultations = is2025 ? kpis.totalConsultations2025 : kpis.totalConsultations2026;
  const conversion  = is2025 ? kpis.conversionRate2025     : kpis.conversionRate2026;
  const avgTicket   = is2025 ? kpis.avgTicket2025          : kpis.avgTicket2026;

  // YoY trend — mesmo período dos dois anos (igual ao Comparativo)
  const base = trendKpis ?? kpis;
  const surgTrend = base.totalSurgeries2025 > 0
    ? ((base.totalSurgeries2026 - base.totalSurgeries2025) / base.totalSurgeries2025 * 100).toFixed(1)
    : '—';
  const revTrend = base.totalRevenue2025 > 0
    ? ((base.totalRevenue2026 - base.totalRevenue2025) / base.totalRevenue2025 * 100).toFixed(1)
    : '—';
  const vsLabel = trendPeriodLabel ? `vs ${trendPeriodLabel} 2025` : 'vs 2025';

  // Média mensal sobre os meses decorridos do ano (não 12 fixos em ano incompleto)
  const now = new Date();
  const monthsElapsed = year === now.getFullYear() ? now.getMonth() + 1 : 12;

  return (
    <div className="kpi-row">
      <KPICard
        label="Cirurgias"
        value={String(surgeries)}
        sub={!is2025 && base.totalSurgeries2025 > 0 ? `${Number(surgTrend) >= 0 ? '+' : ''}${surgTrend}% ${vsLabel}` : `em ${year}`}
        color="#007AFF"
      />
      <KPICard
        label="Faturamento total"
        value={formatCurrency(revenue)}
        sub={!is2025 && base.totalRevenue2025 > 0 ? `${Number(revTrend) >= 0 ? '+' : ''}${revTrend}% ${vsLabel}` : `em ${year}`}
        color="#28A745"
      />
      <KPICard
        label="Ticket médio"
        value={formatCurrency(avgTicket)}
        sub="por cirurgia"
        color="#FF9500"
      />
      <KPICard
        label="Consultas"
        value={String(consultations)}
        sub={`em ${year}`}
        color="#5856D6"
      />
      <KPICard
        label="Conversão"
        value={`${conversion}%`}
        sub="consulta → cirurgia"
        color="#FF3B30"
      />
      <KPICard
        label="Média mensal"
        value={(surgeries / monthsElapsed).toFixed(1).replace('.', ',')}
        sub="cirurgias/mês"
        color="#AF52DE"
      />
    </div>
  );
}
