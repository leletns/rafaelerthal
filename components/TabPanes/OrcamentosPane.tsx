'use client';

import { useState, useMemo } from 'react';
import type { OrcStats, Consultation, Surgery } from '@/lib/data-model';

interface OrcamentosPaneProps {
  orc25: OrcStats;
  orc26: OrcStats;
  cons25?: Consultation[];
  cons26?: Consultation[];
  cir25?: Surgery[];
  cir26?: Surgery[];
}

// ── Fuzzy name matching ──────────────────────────────────────────────────────
// Returns significant tokens (length > 2, excluding common stop words)
function nameTokens(name: string): string[] {
  const stop = new Set(['dos','das','des','del','von','van','de','da','do','di','e']);
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2 && !stop.has(t));
}

// Two names are the same person when ≥2 tokens overlap
function isSamePerson(a: string, b: string): boolean {
  const tokA = new Set(nameTokens(a));
  const tokB = nameTokens(b);
  return tokB.filter(t => tokA.has(t)).length >= 2;
}

type CategoryKey = 'fechou' | 'nao' | 'plano' | 'potenciais';

export default function OrcamentosPane({
  orc25, orc26,
  cons25 = [], cons26 = [],
  cir25  = [], cir26  = [],
}: OrcamentosPaneProps) {
  const [year, setYear] = useState<2025 | 2026>(new Date().getFullYear() >= 2026 ? 2026 : 2025);
  const [expanded, setExpanded] = useState<CategoryKey | null>(null);

  // suppress unused warning — orc stats are now fully replaced by derived counts
  void orc25; void orc26;

  const cons = year === 2025 ? cons25 : cons26;
  const cir  = year === 2025 ? cir25  : cir26;

  // Build patient lists from raw data
  const patientLists = useMemo(() => {
    const cirNames = cir.map(s => s.p);

    // Check if a consulted patient has been operated (fuzzy match)
    function isOperated(name: string): boolean {
      return cirNames.some(cn => isSamePerson(name, cn));
    }

    // Dedup a list by fuzzy name match
    function dedup<T extends { name: string }>(list: T[]): T[] {
      const seen: T[] = [];
      for (const item of list) {
        if (!seen.some(s => isSamePerson(s.name, item.name))) {
          seen.push(item);
        }
      }
      return seen;
    }

    // Fechou: unique patients who had surgery
    const fechouList = dedup(
      cir.map(s => ({ name: s.p, obs: `${s.c} · ${s.d}/${s.mes}` }))
    );

    // Não fechou: consulted, obs suggests refusal, NOT operated
    const naoKeywords = [
      'não fechou','nao fechou','recusou','não quis','nao quis',
      'desistiu','não aceito','nao aceito','contraindicad','nao voltou',
      'não voltou','não marcou','nao marcou',
    ];
    const naoList = dedup(
      cons
        .filter(c => {
          if (isOperated(c.p)) return false;
          if (!c.obs) return false;
          const obs = c.obs.toLowerCase();
          return naoKeywords.some(k => obs.includes(k));
        })
        .map(c => ({ name: c.p, obs: c.obs ?? '' }))
    );

    // Plano: consulted with health plan keywords, NOT operated
    const planoKeywords = [
      'plano','convênio','convenio','saúde','saude',
      'unimed','bradesco','amil','sul america','hapvida','notredame','aps',
    ];
    const planoList = dedup(
      cons
        .filter(c => {
          if (isOperated(c.p)) return false;
          const obs   = (c.obs   ?? '').toLowerCase();
          const canal = (c.canal ?? '').toLowerCase();
          return planoKeywords.some(k => obs.includes(k) || canal.includes(k));
        })
        .map(c => ({ name: c.p, obs: c.obs ?? c.canal ?? '' }))
    );

    // Potenciais: consulted but NOT operated (strict fuzzy check)
    const potenciaisList = dedup(
      cons
        .filter(c => !isOperated(c.p))
        .map(c => ({ name: c.p, obs: c.obs ?? '' }))
    );

    return { fechouList, naoList, planoList, potenciaisList };
  }, [cons, cir]);

  // Unique consulted patients (deduped)
  const derivedTotal = useMemo(() => {
    const seen: string[] = [];
    for (const c of cons) {
      if (!seen.some(n => isSamePerson(n, c.p))) seen.push(c.p);
    }
    return seen.length;
  }, [cons]);

  const fechouCount     = patientLists.fechouList.length;
  const naoCount        = patientLists.naoList.length;
  const planoCount      = patientLists.planoList.length;
  const potenciaisCount = patientLists.potenciaisList.length;

  const rate = (n: number) => derivedTotal > 0 ? Math.round((n / derivedTotal) * 100) : 0;

  const categories = [
    {
      key:   'fechou'     as CategoryKey,
      label: 'Fechou cirurgia',
      value: fechouCount,
      color: '#28A745', bg: '#E6F7EC',
      rate:  rate(fechouCount),
      list:  patientLists.fechouList,
    },
    {
      key:   'nao'        as CategoryKey,
      label: 'Não fechou',
      value: naoCount,
      color: '#FF3B30', bg: '#FFE5E3',
      rate:  rate(naoCount),
      list:  patientLists.naoList,
    },
    {
      key:   'plano'      as CategoryKey,
      label: 'Plano de saúde',
      value: planoCount,
      color: '#FF9500', bg: '#FFF3E0',
      rate:  rate(planoCount),
      list:  patientLists.planoList,
    },
    {
      key:   'potenciais' as CategoryKey,
      label: 'Potenciais',
      value: potenciaisCount,
      color: '#5856D6', bg: '#F0F0FF',
      rate:  rate(potenciaisCount),
      list:  patientLists.potenciaisList,
    },
  ];

  function toggle(key: CategoryKey) {
    setExpanded(prev => prev === key ? null : key);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1D1D1F' }}>
          Orçamentos &amp; Conversão
        </h3>
        <div className="seg">
          {([2025, 2026] as const).map((y) => (
            <button key={y} className={`sb${y === year ? ' on' : ''}`} onClick={() => setYear(y)}>{y}</button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div style={{
        background: '#E5F1FF', borderRadius: '12px', padding: '14px 18px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#007AFF' }}>
          Pacientes únicas atendidas em {year}
        </span>
        <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#007AFF' }}>{derivedTotal}</span>
      </div>

      {/* Clickable category cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {categories.map(({ key, label, value, color, bg, rate: r, list }) => (
          <div key={key}>
            <button
              onClick={() => toggle(key)}
              style={{
                width: '100%', background: bg, borderRadius: '12px', padding: '16px',
                border: `2px solid ${expanded === key ? color : 'transparent'}`,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                transition: 'border 0.15s',
              }}
            >
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: '0.72rem', color, fontWeight: 700, marginTop: '4px' }}>{label}</div>
              <div style={{ fontSize: '0.68rem', color: '#86868B', marginTop: '2px' }}>{r}% dos atendimentos</div>
              <div style={{ fontSize: '0.68rem', color, marginTop: '6px', fontWeight: 600 }}>
                {expanded === key ? '▲ fechar' : `▼ ver ${value} pacientes`}
              </div>
            </button>

            {/* Expanded patient list */}
            {expanded === key && (
              <div style={{
                background: '#fff', borderRadius: '0 0 12px 12px',
                border: `2px solid ${color}`, borderTop: 'none',
                maxHeight: '320px', overflowY: 'auto',
                padding: '12px',
              }}>
                {list.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: '#86868B', textAlign: 'center', margin: '12px 0' }}>
                    Nenhuma paciente identificada com os filtros atuais
                  </p>
                ) : (
                  list.map((p, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #F2F2F7' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1D1D1F' }}>{p.name}</div>
                      {p.obs && (
                        <div style={{ fontSize: '0.72rem', color: '#86868B', marginTop: '2px' }}>{p.obs}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Distribution bars */}
      <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <h4 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>
          Distribuição dos orçamentos · {year}
        </h4>
        {categories.map(({ key, label, color, value, rate: r }) => (
          <div key={key} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1D1D1F' }}>{label}</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color }}>{value}</span>
                <span style={{ fontSize: '0.75rem', color: '#86868B' }}>{r}%</span>
              </div>
            </div>
            <div style={{ height: '10px', background: '#F2F2F7', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${r}%`, background: color, borderRadius: '5px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Conversion insight */}
      <div style={{ background: '#E6F7EC', borderRadius: '14px', padding: '16px', border: '1.5px solid #28A74540' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#1D7A33', fontWeight: 600 }}>
          Taxa de conversão: <strong>{rate(fechouCount)}%</strong> das {derivedTotal} pacientes únicas se tornaram cirurgias em {year}
        </p>
      </div>
    </div>
  );
}
