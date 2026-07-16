'use client';

import { useState } from 'react';
import type { Surgery } from '@/lib/data-model';
import { formatCurrency } from '@/lib/dashboard-calculations';
import { CATEGORY_OPTIONS, sameCategoryName } from '@/lib/normalize-category';

interface CirurgiasPaneProps {
  cir25: Surgery[];
  cir26: Surgery[];
}

export default function CirurgiasPane({ cir25, cir26 }: CirurgiasPaneProps) {
  const [year, setYear] = useState<2025 | 2026>(new Date().getFullYear() >= 2026 ? 2026 : 2025);
  const [search, setSearch] = useState('');
  const [filterCl, setFilterCl] = useState('');

  const list = year === 2025 ? cir25 : cir26;

  const filtered = list.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.p.toLowerCase().includes(q) || s.c.toLowerCase().includes(q);
    const matchCl = !filterCl || sameCategoryName(s.cl, filterCl);
    return matchSearch && matchCl;
  });

  const total = filtered.reduce((acc, s) => acc + s.v, 0);

  return (
    <div>
      {/* Search row */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
        <div className="seg">
          <button className={`sb${year === 2025 ? ' on' : ''}`} onClick={() => setYear(2025)}>2025</button>
          <button className={`sb${year === 2026 ? ' on' : ''}`} onClick={() => setYear(2026)}>2026</button>
        </div>

        <input
          type="text"
          placeholder="Buscar paciente ou procedimento…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '200px', padding: '8px 14px',
            borderRadius: '10px', border: '1.5px solid #E5E5EA',
            fontSize: '13px', fontFamily: 'inherit', background: '#F9F9FB',
          }}
        />

        <select
          value={filterCl}
          onChange={(e) => setFilterCl(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #E5E5EA',
            fontSize: '13px', fontFamily: 'inherit', background: '#F9F9FB',
          }}
        >
          <option value="">Todos os tipos</option>
          {CATEGORY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {[
          { label: 'Cirurgias', value: filtered.length, color: '#007AFF' },
          { label: 'Receita total', value: formatCurrency(total), color: '#28A745' },
          { label: 'Ticket médio', value: filtered.length > 0 ? formatCurrency(total / filtered.length) : '—', color: '#FF9500' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: `${color}10`, border: `1.5px solid ${color}30`,
            borderRadius: '12px', padding: '10px 16px',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color, lineHeight: 1 }}>{String(value)}</div>
            <div style={{ fontSize: '10px', color: '#86868B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="ts">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Paciente</th>
                <th>Data</th>
                <th>Procedimento</th>
                <th>Tipo</th>
                {year === 2026 && <th>Região</th>}
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#86868B', padding: '40px' }}>
                    Nenhuma cirurgia encontrada
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={i}>
                    <td style={{ color: '#86868B', fontSize: '11px', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: '#1D1D1F', maxWidth: '200px' }}>{s.p}</td>
                    <td style={{ whiteSpace: 'nowrap', color: '#1D1D1F', fontWeight: 600 }}>{s.d}</td>
                    <td style={{ fontSize: '12px', color: '#3A3A3C', maxWidth: '260px' }}>{s.c}</td>
                    <td>
                      <span style={{ fontSize: '10.5px', background: '#F2F2F7', padding: '2px 8px', borderRadius: '6px', color: '#3A3A3C', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {s.cl}
                      </span>
                    </td>
                    {year === 2026 && <td style={{ fontSize: '12px', color: '#86868B' }}>{s.reg || '—'}</td>}
                    <td style={{ fontWeight: 700, color: '#28A745', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {s.v > 0 ? formatCurrency(s.v) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
