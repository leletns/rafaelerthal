'use client';

import { useState } from 'react';
import KPICards from '../KPICards';
import { RevenueBarChart, MonthlySurgeriesChart } from '../Charts';
import { computeKPIs, computeMonthlyData, computeRevenueByMonth, computeTopProcedures, computeFunnelData, formatCurrency } from '@/lib/dashboard-calculations';
import type { Surgery, Consultation, CanalStats, FxStats, CidadeStats, IntlStats } from '@/lib/data-model';
import { limparRotulo } from '@/lib/labels';

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

const COLORS = ['var(--c-blue)', 'var(--c-purple)', 'var(--c-orange)', 'var(--c-green)', 'var(--c-red)', 'var(--c-magenta)', 'var(--c-coral)', 'var(--c-teal)'];

export default function ResumoPane({
  cir25, cir26, cons25, cons26,
  canal25, canal26, fx25, fx26,
  cidades25 = {}, cidades26 = {},
  intl25 = {}, intl26 = {},
  onTabChange,
}: ResumoPaneProps) {
  const [year, setYear] = useState<2025 | 2026>(new Date().getFullYear() >= 2026 ? 2026 : 2025);

  // Mesmo periodo do Comparativo: compara Jan -> mes atual (ex.: Jan-Julho)
  const MONTH_ORDER_RESUMO = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const currentMonthIdx = new Date().getMonth();
  const validMonthsResumo = new Set(MONTH_ORDER_RESUMO.slice(0, currentMonthIdx + 1));
  const cir25SamePeriod = cir25.filter((s) => validMonthsResumo.has(s.mes));
  const cons25SamePeriod = cons25.filter((c) => validMonthsResumo.has(c.mes));
  const kpis = computeKPIs(cir25SamePeriod, cir26, cons25SamePeriod, cons26);
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

  // Geo summary — top cities from operated patients (both years merged)
  const cidadesMerged: Record<string, number> = {};
  for (const [k, v] of Object.entries(cidades25)) cidadesMerged[k] = (cidadesMerged[k] || 0) + v;
  for (const [k, v] of Object.entries(cidades26)) cidadesMerged[k] = (cidadesMerged[k] || 0) + v;

  // International: merge both years (keys = country names)
  const intlMerged: Record<string, number> = {};
  for (const [k, v] of Object.entries(intl25)) intlMerged[k] = (intlMerged[k] || 0) + v;
  for (const [k, v] of Object.entries(intl26)) intlMerged[k] = (intlMerged[k] || 0) + v;
  const intlEntries = Object.entries(intlMerged).sort(([,a],[,b]) => b - a);
  const intlTotal   = intlEntries.reduce((s, [,v]) => s + v, 0);

  const topCidades = Object.entries(cidadesMerged)
    .filter(([k]) => k.toLowerCase() !== 'internacional')
    .sort(([,a],[,b]) => b - a)
    .slice(0, 5);

  // Orçamentos summary — quick conversion snapshot for the selected year
  function nameTokensOrc(name: string): string[] {
    const stop = new Set(['dos','das','des','de','da','do','di','e']);
    return name.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .split(/\s+/).filter(t => t.length > 2 && !stop.has(t));
  }
  function isSamePersonOrc(a: string, b: string): boolean {
    const tokA = new Set(nameTokensOrc(a));
    return nameTokensOrc(b).filter(t => tokA.has(t)).length >= 2;
  }
  const uniqueConsulted = (() => {
    const seen: string[] = [];
    for (const c of cons) {
      if (!seen.some(n => isSamePersonOrc(n, c.p))) seen.push(c.p);
    }
    return seen.length;
  })();
  const uniqueOperated = (() => {
    const seen: string[] = [];
    for (const s of cir) {
      if (!seen.some(n => isSamePersonOrc(n, s.p))) seen.push(s.p);
    }
    return seen.length;
  })();
  const potenciaisCount = (() => {
    const cirNames = cir.map(s => s.p);
    const seen: string[] = [];
    for (const c of cons) {
      if (cirNames.some(cn => isSamePersonOrc(cn, c.p))) continue;
      if (!seen.some(n => isSamePersonOrc(n, c.p))) seen.push(c.p);
    }
    return seen.length;
  })();
  const conversionRate = uniqueConsulted > 0
    ? Math.round((uniqueOperated / uniqueConsulted) * 100) : 0;

  // Funil bar colors
  const funnelColors = ['var(--c-blue)', 'var(--c-purple)', 'var(--c-green)'];
  const funnelMax = funnelData[0]?.value || 1;

  return (
    <div>
      {/* Year toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
          Visão Geral · {year}
          {year === 2026 && (
            <span style={{ marginLeft: '8px', fontSize: '11px', background: 'var(--tint-green)', color: 'var(--c-green)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
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
          <div className="card-ttl">Faturamento mensal</div>
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
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{procedure}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-2)' }}>{count}× · {formatCurrency(revenue)}</div>
                </div>
              </div>
            ))}
            {procs.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>Sem dados</div>}
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
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{canal}</span>
                    <span style={{ color: COLORS[i % COLORS.length], fontWeight: 700 }}>{count} <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: '5px', background: 'var(--fill)', borderRadius: '3px', overflow: 'hidden' }}>
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
                    <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{fx}</span>
                    <span style={{ fontWeight: 700, color: 'var(--c-purple)' }}>{count} <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: '5px', background: 'var(--fill)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--c-purple)', opacity: 0.3 + i * 0.15, borderRadius: '3px' }} />
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
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--c-green)', letterSpacing: '-1px', lineHeight: 1 }}>
              {formatCurrency(avgTicket)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '8px' }}>
              {cir.length} cirurgias · {formatCurrency(totalRev)} total
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-ttl">Taxa de conversão</div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--c-blue)', letterSpacing: '-1px', lineHeight: 1 }}>
              {conversion}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '8px' }}>
              {cir.length} cirurgias de {cons.length} consultas
            </div>
            <div style={{ marginTop: '12px', height: '8px', background: 'var(--fill)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${conversion}%`, background: 'var(--c-blue)', borderRadius: '4px' }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-ttl">Destaques</div>
          <div className="ins-list" style={{ marginTop: '4px' }}>
            {topProc && (
              <div className="ins">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-gold)', flexShrink: 0, marginTop: 3 }} />
                <div>
                  <strong>Proc. mais realizado:</strong> {topProc.procedure}
                  <br /><span style={{ color: 'var(--text-2)' }}>{topProc.count}× · {formatCurrency(topProc.revenue)}</span>
                </div>
              </div>
            )}
            <div className="ins">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-green)', flexShrink: 0, marginTop: 3 }} />
              <div><strong>Cirurgias em {year}:</strong> {cir.length}<br /><span style={{ color: 'var(--text-2)' }}>Faturamento: {formatCurrency(totalRev)}</span></div>
            </div>
            <div className="ins">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-blue)', flexShrink: 0, marginTop: 3 }} />
              <div><strong>Consultas em {year}:</strong> {cons.length}<br /><span style={{ color: 'var(--text-2)' }}>Taxa de conversão: {conversion}%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Funil Summary ──────────────────────────── */}
      {funnelData.length > 0 && (
        <div className="card" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div className="card-ttl" style={{ margin: 0 }}>Funil de conversão · {year}</div>
            {onTabChange && (
              <button
                onClick={() => onTabChange('funil')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-blue)', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit', padding: 0 }}
              >
                Ver detalhes →
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {funnelData.map((stage, i) => (
              <div key={stage.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{stage.label}</span>
                  <span style={{ fontWeight: 700, color: funnelColors[i] }}>
                    {stage.value} <span style={{ fontWeight: 400, color: 'var(--text-2)' }}>({stage.pct}%)</span>
                  </span>
                </div>
                <div style={{ height: '7px', background: 'var(--fill)', borderRadius: '4px', overflow: 'hidden' }}>
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
            <div className="card-ttl" style={{ margin: 0 }}>Origem das pacientes operadas</div>
            {onTabChange && (
              <button
                onClick={() => onTabChange('geo')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-blue)', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit', padding: 0 }}
              >
                Ver detalhes →
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* Top domestic cities */}
            <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
              {topCidades.map(([cidade, count], i) => {
                const total = Object.values(cidadesMerged).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round(count / total * 100) : 0;
                return (
                  <div key={cidade} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{cidade}</span>
                      <span style={{ fontWeight: 700, color: COLORS[i % COLORS.length] }}>
                        {count} <span style={{ fontWeight: 400, color: 'var(--text-2)' }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: '5px', background: 'var(--fill)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* International breakdown — per country */}
            {intlTotal > 0 && (
              <div style={{ flexShrink: 0, minWidth: '130px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Internacional · {intlTotal}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {intlEntries.map(([country, count]) => (
                    <div
                      key={country}
                      style={{
                        padding: '6px 10px',
                        background: 'var(--tint-blue)',
                        borderRadius: '8px',
                        border: '1.5px solid color-mix(in srgb, var(--c-blue) 13%, transparent)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text)' }}>{limparRotulo(country)}</span>
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--c-blue)' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Orçamentos Summary ────────────────────── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div className="card-ttl" style={{ margin: 0 }}>Conversão &amp; Orçamentos · {year}</div>
          {onTabChange && (
            <button
              onClick={() => onTabChange('orcamentos')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-blue)', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit', padding: 0 }}
            >
              Ver detalhes →
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
          {[
            { label: 'Pacientes atendidas', value: uniqueConsulted, color: 'var(--c-blue)', bg: 'var(--tint-blue)' },
            { label: 'Fecharam cirurgia',   value: uniqueOperated,  color: 'var(--c-green)', bg: 'var(--tint-green)' },
            { label: 'Potenciais',          value: potenciaisCount, color: 'var(--c-purple)', bg: 'var(--tint-purple)' },
          ].map(({ label, value, color, bg }) => (
            <div
              key={label}
              style={{
                background: bg, borderRadius: '10px', padding: '12px 10px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-2)', fontWeight: 600, marginTop: '4px', lineHeight: 1.2 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ height: '8px', background: 'var(--fill)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${conversionRate}%`, background: 'var(--c-green)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--text-2)', fontWeight: 500 }}>
          Taxa de conversão: <strong style={{ color: 'var(--c-green)' }}>{conversionRate}%</strong>
        </div>
      </div>
    </div>
  );
}
