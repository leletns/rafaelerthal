'use client';

import { formatCurrency } from '@/lib/dashboard-calculations';
import type { KPIData } from '@/lib/data-model';

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
}

/** O número nunca quebra em duas linhas: encolhe conforme cresce. */
function tamanhoDoNumero(valor: string): string {
  const n = valor.length;
  if (n <= 7)  return '28px';
  if (n <= 9)  return '25px';
  if (n <= 11) return '22px';
  if (n <= 13) return '19px';
  return '17px';
}

function KPICard({ label, value, sub, color }: KPICardProps) {
  return (
    <div className="kpi">
      <div className="kpi-line" style={{ background: color }} aria-hidden="true" />
      <div className="kpi-lbl">{label}</div>
      <div className="kpi-val" style={{ fontSize: tamanhoDoNumero(value) }}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

interface KPICardsProps {
  kpis: KPIData;
  year: 2025 | 2026;
}

export default function KPICards({ kpis, year }: KPICardsProps) {
  const is2025 = year === 2025;

  const surgeries   = is2025 ? kpis.totalSurgeries2025     : kpis.totalSurgeries2026;
  const revenue     = is2025 ? kpis.totalRevenue2025       : kpis.totalRevenue2026;
  const consultations = is2025 ? kpis.totalConsultations2025 : kpis.totalConsultations2026;
  const conversion  = is2025 ? kpis.conversionRate2025     : kpis.conversionRate2026;
  const avgTicket   = is2025 ? kpis.avgTicket2025          : kpis.avgTicket2026;

  // YoY trend
  const surgTrend = kpis.totalSurgeries2025 > 0
    ? ((kpis.totalSurgeries2026 - kpis.totalSurgeries2025) / kpis.totalSurgeries2025 * 100).toFixed(1)
    : '—';
  const revTrend = kpis.totalRevenue2025 > 0
    ? ((kpis.totalRevenue2026 - kpis.totalRevenue2025) / kpis.totalRevenue2025 * 100).toFixed(1)
    : '—';

  return (
    <div className="kpi-row">
      <KPICard
        label="Cirurgias"
        value={String(surgeries)}
        sub={!is2025 && kpis.totalSurgeries2025 > 0 ? `${Number(surgTrend) >= 0 ? '+' : ''}${surgTrend}% vs 2025` : `em ${year}`}
        color="var(--c-blue)"
      />
      <KPICard
        label="Faturamento total"
        value={formatCurrency(revenue)}
        sub={!is2025 && kpis.totalRevenue2025 > 0 ? `${Number(revTrend) >= 0 ? '+' : ''}${revTrend}% vs 2025` : `em ${year}`}
        color="var(--c-green)"
      />
      <KPICard
        label="Ticket médio"
        value={formatCurrency(avgTicket)}
        sub="por cirurgia"
        color="var(--c-orange)"
      />
      <KPICard
        label="Consultas"
        value={String(consultations)}
        sub={`em ${year}`}
        color="var(--c-purple)"
      />
      <KPICard
        label="Conversão"
        value={`${conversion}%`}
        sub="consulta → cirurgia"
        color="var(--c-red)"
      />
      <KPICard
        label="Média mensal"
        value={(surgeries / 12).toFixed(1).replace('.', ',')}
        sub="cirurgias/mês"
        color="var(--c-magenta)"
      />
    </div>
  );
}
