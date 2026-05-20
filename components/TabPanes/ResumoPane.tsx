'use client';

import { useState } from 'react';
import KPICards from '../KPICards';
import { RevenueBarChart, MonthlySurgeriesChart } from '../Charts';
import { computeKPIs, computeMonthlyData, computeRevenueByMonth, computeTopProcedures, formatCurrency } from '@/lib/dashboard-calculations';
import type { Surgery, Consultation } from '@/lib/data-model';
import { canal25, canal26, fx25, fx26 } from '@/lib/legacy-data';

interface ResumoPaneProps {
  cir25: Surgery[];
  cir26: Surgery[];
  cons25: Consultation[];
  cons26: Consultation[];
}

const COLORS = ['#007AFF', '#5856D6', '#FF9500', '#28A745', '#FF3B30', '#AF52DE', '#FF6B35', '#00C7BE'];

export default function ResumoPane({ cir25, cir26, cons25, cons26 }: ResumoPaneProps) {
  const [year, setYear] = useState<2025 | 2026>(new Date().getFullYear() >= 2026 ? 2026 : 2025);

  const kpis     = computeKPIs(cir25, cir26, cons25, cons26);
  const cir      = year === 2025 ? cir25   : cir26;
  const cons     = year === 2025 ? cons25  : cons26;
  const rev      = computeRevenueByMonth(cir);
  const monthly  = computeMonthlyData(cir, cons);
  const procs    = computeTopProcedures(cir);
  const canalData = year === 2025 ? canal25 : canal26;
  const fxData    = year === 2025 ? fx25    : fx26;

  // Insights
  const topProc = procs[0];
  const totalRev = cir.reduce((s, c) => s + c.v, 0);
  const avgTicket = cir.length > 0 ? totalRev / cir.length : 0;
  const conversion = cons.length > 0 ? (cir.length / cons.length * 100).toFixed(1) : '0';

  return (
    <div>
      {/* Year segmented control */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1D1D1F' }}>
          Visão Geral · {year}
          {year === 2026 && (
            <span style={{ marginLeft: '8px', fontSize: '11px', background: '#E6F7EC', color: '#28A745', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
              Em andamento
            </span>
          )}
        </h2>
        <div className="seg">
          <button className={`sb${year === 2025 ? ' on' : ''}`} onClick={() => setYear(2025)}>2025</button>
          <button className={`sb${year === 2026 ? ' on' : ''}`} onClick={() => setYear(2026)}>2026</button>
        </div>
      </div>

      {/* KPI row — 6 cards like original */}
      <KPICards kpis={kpis} year={year} />

      {/* g2: monthly charts */}
      <div className="g2">
        <div className="card">
          <div className="card-ttl">Atendimentos por mês</div>
          <div style={{ height: '195px' }}>
            <MonthlySurgeriesChart data={monthly} year={year} />
          </div>
        </div>
        <div className="card">
          <div className="card-ttl">Receita mensal</div>
          <div style={{ height: '195px' }}>
            <RevenueBarChart data={rev} year={year} />
          </div>
        </div>
      </div>

      {/* g3: canal / faixa / ticket */}
      <div className="g3">
        {/* Tipo de cirurgia */}
        <div className="card">
          <div className="card-ttl">Tipos de cirurgia</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {procs.slice(0, 5).map(({ procedure, count, revenue }, i) => (
              <div key={procedure} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {procedure}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#86868B' }}>{count}× · {formatCurrency(revenue)}</div>
                </div>
              </div>
            ))}
            {procs.length === 0 && <div style={{ fontSize: '12px', color: '#86868B' }}>Sem dados</div>}
          </div>
        </div>

        {/* Canal */}
        <div className="card">
          <div className="card-ttl">Como os pacientes chegam</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {Object.entries(canalData).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([canal, count], i) => {
              const total = Object.values(canalData).reduce((s, v) => s + v, 0);
              const pct = total > 0 ? Math.round(count / total * 100) : 0;
              return (
                <div key={canal}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, color: '#1D1D1F' }}>{canal}</span>
                    <span style={{ color: COLORS[i % COLORS.length], fontWeight: 700 }}>{count} <span style={{ color: '#86868B', fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: '5px', background: '#F2F2F7', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Faixa etária */}
        <div className="card">
          <div className="card-ttl">Faixa etária</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {Object.entries(fxData).map(([fx, count], i) => {
              const total = Object.values(fxData).reduce((s, v) => s + v, 0);
              const pct = total > 0 ? Math.round(count / total * 100) : 0;
              return (
                <div key={fx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, color: '#86868B' }}>{fx}</span>
                    <span style={{ fontWeight: 700, color: '#5856D6' }}>{count} <span style={{ color: '#86868B', fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: '5px', background: '#F2F2F7', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#5856D6', opacity: 0.3 + i * 0.15, borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* g3: stats cards */}
      <div className="g3">
        {/* Ticket médio */}
        <div className="card">
          <div className="card-ttl">Valor médio por cirurgia</div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#28A745', letterSpacing: '-1px', lineHeight: 1 }}>
              {formatCurrency(avgTicket)}
            </div>
            <div style={{ fontSize: '12px', color: '#86868B', marginTop: '8px' }}>
              {cir.length} cirurgias · {formatCurrency(totalRev)} total
            </div>
          </div>
        </div>

        {/* Conversão */}
        <div className="card">
          <div className="card-ttl">Taxa de conversão</div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#007AFF', letterSpacing: '-1px', lineHeight: 1 }}>
              {conversion}%
            </div>
            <div style={{ fontSize: '12px', color: '#86868B', marginTop: '8px' }}>
              {cir.length} cirurgias de {cons.length} consultas
            </div>
            <div style={{ marginTop: '12px', height: '8px', background: '#F2F2F7', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${conversion}%`, background: '#007AFF', borderRadius: '4px' }} />
            </div>
          </div>
        </div>

        {/* Destaques */}
        <div className="card">
          <div className="card-ttl">Destaques</div>
          <div className="ins-list" style={{ marginTop: '4px' }}>
            {topProc && (
              <div className="ins">
                <span>🏆</span>
                <div>
                  <strong>Proc. mais realizado:</strong> {topProc.procedure}
                  <br /><span style={{ color: '#86868B' }}>{topProc.count}× · {formatCurrency(topProc.revenue)}</span>
                </div>
              </div>
            )}
            <div className="ins">
              <span>📅</span>
              <div>
                <strong>Cirurgias em {year}:</strong> {cir.length}
                <br /><span style={{ color: '#86868B' }}>Receita: {formatCurrency(totalRev)}</span>
              </div>
            </div>
            <div className="ins">
              <span>📊</span>
              <div>
                <strong>Consultas em {year}:</strong> {cons.length}
                <br /><span style={{ color: '#86868B' }}>Taxa de conversão: {conversion}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
