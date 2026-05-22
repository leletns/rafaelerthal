'use client';

import { useState } from 'react';
import KPICards from '../KPICards';
import { RevenueBarChart, MonthlySurgeriesChart } from '../Charts';
import { computeKPIs, computeMonthlyData, computeRevenueByMonth, computeTopProcedures, computeFunnelData, formatCurrency } from '@/lib/dashboard-calculations';
import type { Surgery, Consultation, CanalStats, FxStats, CidadeStats, IntlStats } from '@/lib/data-model';

interface ResumoPaneProps {
  cir25: Surgery[];
  cir26: Surgery[];
  cons25: Consultation[];
  cons26: Consultation[];
  canal25: CanalStats;
  canal26: CanalStats;
  fx25: FxStats;
  fx26: FxStats;
  cidades25?: CidadeStats;
  cidades26?: CidadeStats;
  intl25?: IntlStats;
  intl26?: IntlStats;
  onTabChange?: (tab: string) => void;
}

const COLORS = ['#007AFF', '#5856D6', '#FF9500', '#28A745', '#FF3B30', '#AF52DE', '#FF6B35', '#00C7BE'];

export default function ResumoPane({
  cir25, cir26, cons25, cons26,
  canal25, canal26, fx25, fx26,
  cidades25 = {}, cidades26 = {},
  intl25 = {}, intl26 = {},
  onTabChange,
}: ResumoPaneProps) {
  const [year, setYear] = useState<2025 | 2026>(new Date().getFullYear() >= 2026 ? 2026 : 2025);

  const kpis      = computeKPIs(cir25, cir26, cons25, cons26);
  const cir       = year === 2025 ? cir25  : cir26;
  const cons      = year === 2025 ? cons25 : cons26;
  const rev       = computeRevenueByMonth(cir);
  const monthly   = computeMonthlyData(cir, cons);
  const procs     = computeTopProcedures(cir);
  const canalData = year === 2025 ? canal25 : canal26;
  const fxData    = year === 2025 ? fx25    : fx26;

  const totalRev  = cir.reduce((s, c) => s + c.v, 0);
  const avgTicket = cir.length > 0 ? totalRev / cir.length : 0;
  const conversion = cons.length > 0 ? (cir.length / cons.length * 100).toFixed(1) : '0';
  const topProc   = procs[0];

  // Funil summary (3 stages)
  const funnelData = computeFunnelData(cons, cir);

  // Geo summary — top cities from operated patients
  const cidadesAll = { ...cidades25, ...cidades26 };
  // Merge both years
  const cidadesMerged: Record<string, number> = {};
  for (const [k, v] of Object.entries(cidades25)) cidadesMerged[k] = (cidadesMerged[k] || 0) + v;
  for (const [k, v] of Object.entries(cidades26)) cidadesMerged[k] = (cidadesMerged[k] || 0) + v;
  const intlTotal = [...Object.values(intl25), ...Object.values(intl26)].reduce((a, b) => a + b, 0);
  const topCidades = Object.entries(cidadesMerged)
    .filter(([k]) => k.toLowerCase() !== 'internacional')
    .sort(([,a],[,b]) => b - a)
    .slice(0, 5);

  // Funil bar colors
  const funnelColors = ['#007AFF', '#5856D6', '#28A745'];
  const funnelMax = funnelData[0]?.value || 1;

  void cidadesAll;

  return (
    <div>
      {/* Year toggle */}
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

      {/* KPI row */}
      <KPICards kpis={kpis} year={year} />

      {/* Monthly charts */}
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

      {/* Canal / Faixa / Ticket */}
      <div className="g3">
        <div className="card">
          <div className="card-ttl">Tipos de cirurgia</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {procs.slice(0, 5).map(({ procedure, count, revenue }, i) => (
              <div key={procedure} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{procedure}</div>
                  <div style={{ fontSize: '10.5px', color: '#86868B' }}>{count}× · {formatCurrency(revenue)}</div>
                </div>
              </div>
            ))}
            {procs.length === 0 && <div style={{ fontSize: '12px', color: '#86868B' }}>Sem dados</div>}
          </div>
        </div>

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

      {/* Stats cards */}
      <div className="g3">
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
              <div><strong>Cirurgias em {year}:</strong> {cir.length}<br /><span style={{ color: '#86868B' }}>Receita: {formatCurrency(totalRev)}</span></div>
            </div>
            <div className="ins">
              <span>📊</span>
              <div><strong>Consultas em {year}:</strong> {cons.length}<br /><span style={{ color: '#86868B' }}>Taxa de conversão: {conversion}%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Funil Summary ──────────────────────────── */}
      {funnelData.length > 0 && (
        <div className="card" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div className="card-ttl" style={{ margin: 0 }}>📊 Funil de conversão · {year}</div>
            {onTabChange && (
              <button
                onClick={() => onTabChange('funil')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#007AFF', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit', padding: 0 }}
              >
                Ver detalhes →
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {funnelData.map((stage, i) => (
              <div key={stage.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#1D1D1F' }}>{stage.label}</span>
                  <span style={{ fontWeight: 700, color: funnelColors[i] }}>
                    {stage.value} <span style={{ fontWeight: 400, color: '#86868B' }}>({stage.pct}%)</span>
                  </span>
                </div>
                <div style={{ height: '7px', background: '#F2F2F7', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round((stage.value / funnelMax) * 100)}%`,
                    background: funnelColors[i],
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Geo / Origem Summary ───────────────────── */}
      {topCidades.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div className="card-ttl" style={{ margin: 0 }}>🗺️ Origem das pacientes operadas</div>
            {onTabChange && (
              <button
                onClick={() => onTabChange('geo')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#007AFF', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit', padding: 0 }}
              >
                Ver detalhes →
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              {topCidades.map(([cidade, count], i) => {
                const total = Object.values(cidadesMerged).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round(count / total * 100) : 0;
                return (
                  <div key={cidade} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 600, color: '#1D1D1F' }}>{cidade}</span>
                      <span style={{ fontWeight: 700, color: COLORS[i % COLORS.length] }}>
                        {count} <span style={{ fontWeight: 400, color: '#86868B' }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: '5px', background: '#F2F2F7', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {intlTotal > 0 && (
              <div style={{
                flexShrink: 0, background: '#F0F7FF', borderRadius: '10px',
                padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ fontSize: '1.2rem' }}>🌍</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#007AFF' }}>{intlTotal}</div>
                  <div style={{ fontSize: '0.7rem', color: '#86868B', fontWeight: 600 }}>internacionais</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
