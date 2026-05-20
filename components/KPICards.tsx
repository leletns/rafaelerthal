'use client';

import { formatCurrency } from '@/lib/dashboard-calculations';
import type { KPIData } from '@/lib/data-model';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  color: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
}

function KPICard({ title, value, subtitle, color, icon, trend }: KPICardProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '18px',
        padding: '1.25rem',
        boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
        borderTop: `3px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {title}
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: '0.75rem', color: '#86868B', marginTop: '4px' }}>{subtitle}</p>
          )}
        </div>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: trend.value >= 0 ? '#28A745' : '#FF3B30',
              background: trend.value >= 0 ? '#E6F7EC' : '#FFE5E3',
              padding: '2px 6px',
              borderRadius: '6px',
            }}
          >
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span style={{ fontSize: '0.7rem', color: '#86868B' }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}

interface KPICardsProps {
  kpis: KPIData;
  year: 2025 | 2026;
}

export default function KPICards({ kpis, year }: KPICardsProps) {
  const is2025 = year === 2025;

  const surgeries = is2025 ? kpis.totalSurgeries2025 : kpis.totalSurgeries2026;
  const revenue = is2025 ? kpis.totalRevenue2025 : kpis.totalRevenue2026;
  const consultations = is2025 ? kpis.totalConsultations2025 : kpis.totalConsultations2026;
  const conversion = is2025 ? kpis.conversionRate2025 : kpis.conversionRate2026;
  const avgTicket = is2025 ? kpis.avgTicket2025 : kpis.avgTicket2026;

  // Calculate trends (2026 vs 2025)
  const surgTrend = kpis.totalSurgeries2025 > 0
    ? Math.round(((kpis.totalSurgeries2026 - kpis.totalSurgeries2025) / kpis.totalSurgeries2025) * 100)
    : 0;
  const revTrend = kpis.totalRevenue2025 > 0
    ? Math.round(((kpis.totalRevenue2026 - kpis.totalRevenue2025) / kpis.totalRevenue2025) * 100)
    : 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1rem',
      }}
    >
      <KPICard
        title="Cirurgias"
        value={String(surgeries)}
        subtitle={`em ${year}`}
        color="#007AFF"
        trend={!is2025 ? { value: surgTrend, label: 'vs 2025' } : undefined}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
            <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
            <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/>
            <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/>
            <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
            <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/>
            <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/>
          </svg>
        }
      />
      <KPICard
        title="Receita"
        value={formatCurrency(revenue)}
        subtitle={`em ${year}`}
        color="#28A745"
        trend={!is2025 ? { value: revTrend, label: 'vs 2025' } : undefined}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }
      />
      <KPICard
        title="Consultas"
        value={String(consultations)}
        subtitle={`em ${year}`}
        color="#5856D6"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
      />
      <KPICard
        title="Conversão"
        value={`${conversion}%`}
        subtitle="consulta → cirurgia"
        color="#FF9500"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        }
      />
      <KPICard
        title="Ticket Médio"
        value={formatCurrency(avgTicket)}
        subtitle="por cirurgia"
        color="#FF3B30"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        }
      />
    </div>
  );
}
