'use client';

import { useState } from 'react';
import type { Surgery } from '@/lib/data-model';
import { formatCurrency } from '@/lib/dashboard-calculations';

interface CirurgiasPaneProps {
  cir25: Surgery[];
  cir26: Surgery[];
}

export default function CirurgiasPane({ cir25, cir26 }: CirurgiasPaneProps) {
  const [year, setYear] = useState<2025 | 2026>(2025);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const list = year === 2025 ? cir25 : cir26;
  const months = Array.from(new Set(list.map((s) => s.mes)));

  const filtered = list.filter((s) => {
    const matchSearch = !search || s.p.toLowerCase().includes(search.toLowerCase()) || s.c.toLowerCase().includes(search.toLowerCase());
    const matchMonth = !filterMonth || s.mes === filterMonth;
    return matchSearch && matchMonth;
  });

  const total = filtered.reduce((acc, s) => acc + s.v, 0);

  const procedureCounts: Record<string, number> = {};
  for (const s of filtered) {
    procedureCounts[s.c] = (procedureCounts[s.c] || 0) + 1;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Year toggle */}
        <div style={{ display: 'flex', background: '#F2F2F7', borderRadius: '10px', padding: '3px', gap: '2px' }}>
          {([2025, 2026] as const).map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              style={{
                padding: '6px 16px',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: y === year ? 700 : 500,
                fontFamily: 'inherit',
                fontSize: '0.82rem',
                background: y === year ? '#fff' : 'transparent',
                color: y === year ? '#1D1D1F' : '#86868B',
                boxShadow: y === year ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {y}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Buscar paciente ou procedimento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1.5px solid #E5E5EA',
            fontSize: '0.85rem',
            fontFamily: 'inherit',
            background: '#F9F9FB',
          }}
        />

        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1.5px solid #E5E5EA',
            fontSize: '0.85rem',
            fontFamily: 'inherit',
            background: '#F9F9FB',
          }}
        >
          <option value="">Todos os meses</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {[
          { label: 'Cirurgias', value: String(filtered.length), color: '#007AFF' },
          { label: 'Receita', value: formatCurrency(total), color: '#28A745' },
          ...Object.entries(procedureCounts).map(([proc, count]) => ({
            label: proc.length > 20 ? proc.substring(0, 20) + '…' : proc,
            value: String(count),
            color: '#5856D6',
          })).slice(0, 3),
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: `${color}10`,
              border: `1.5px solid ${color}30`,
              borderRadius: '10px',
              padding: '10px 14px',
              minWidth: '100px',
            }}
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '0.7rem', color: '#86868B', fontWeight: 600, marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '18px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Mês</th>
                <th>Paciente</th>
                <th>Procedimento</th>
                <th>Local</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#86868B', padding: '32px' }}>
                    Nenhuma cirurgia encontrada
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={i}>
                    <td style={{ color: '#86868B', fontSize: '0.75rem', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: '#1D1D1F', whiteSpace: 'nowrap' }}>{s.d}</td>
                    <td>
                      <span className="badge badge-blue">{s.mes}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#1D1D1F' }}>{s.p}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          background: '#F5F5F7',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          color: '#1D1D1F',
                          fontWeight: 500,
                        }}
                      >
                        {s.c}
                      </span>
                    </td>
                    <td style={{ color: '#86868B', fontSize: '0.82rem' }}>{s.cl}</td>
                    <td style={{ fontWeight: 700, color: '#28A745', whiteSpace: 'nowrap' }}>
                      {formatCurrency(s.v)}
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
