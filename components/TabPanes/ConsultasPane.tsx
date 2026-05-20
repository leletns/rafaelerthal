'use client';

import { useState } from 'react';
import type { Consultation } from '@/lib/data-model';
import WhatsAppButton from '../WhatsAppButton';

interface ConsultasPaneProps {
  cons25: Consultation[];
  cons26: Consultation[];
}

export default function ConsultasPane({ cons25, cons26 }: ConsultasPaneProps) {
  const [year, setYear] = useState<2025 | 2026>(2025);
  const [search, setSearch] = useState('');
  const [filterCanal, setFilterCanal] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const list = year === 2025 ? cons25 : cons26;
  const canais = Array.from(new Set(list.map((c) => c.canal))).sort();
  const months = Array.from(new Set(list.map((c) => c.mes)));

  const filtered = list.filter((c) => {
    const matchSearch = !search ||
      c.p.toLowerCase().includes(search.toLowerCase()) ||
      c.tel.includes(search) ||
      (c.cidade || '').toLowerCase().includes(search.toLowerCase());
    const matchCanal = !filterCanal || c.canal === filterCanal;
    const matchMonth = !filterMonth || c.mes === filterMonth;
    return matchSearch && matchCanal && matchMonth;
  });

  const CANAL_COLORS: Record<string, string> = {
    Instagram: '#E91E8C',
    Google: '#4285F4',
    Indicação: '#28A745',
    TikTok: '#010101',
  };

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
              }}
            >
              {y}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Buscar paciente, telefone ou cidade..."
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
          value={filterCanal}
          onChange={(e) => setFilterCanal(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #E5E5EA', fontSize: '0.85rem', fontFamily: 'inherit', background: '#F9F9FB' }}
        >
          <option value="">Todos os canais</option>
          {canais.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #E5E5EA', fontSize: '0.85rem', fontFamily: 'inherit', background: '#F9F9FB' }}
        >
          <option value="">Todos os meses</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Count badge */}
      <div style={{ fontSize: '0.82rem', color: '#86868B' }}>
        {filtered.length} consulta{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '18px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Paciente</th>
                <th>Telefone</th>
                <th>Idade</th>
                <th>Canal</th>
                <th>Cidade</th>
                <th>WA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#86868B', padding: '32px' }}>
                    Nenhuma consulta encontrada
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => {
                  const canalColor = CANAL_COLORS[c.canal] || '#86868B';
                  return (
                    <tr key={i}>
                      <td style={{ color: '#86868B', fontSize: '0.75rem', fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{c.d}</td>
                      <td style={{ fontWeight: 600, color: '#1D1D1F' }}>{c.p}</td>
                      <td style={{ color: '#86868B', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{c.tel}</td>
                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#5856D6' }}>
                          {c.idade} anos
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: canalColor,
                            background: `${canalColor}15`,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {c.canal}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#86868B' }}>{c.cidade || '—'}</td>
                      <td>
                        {c.tel && <WhatsAppButton phone={c.tel} size="sm" variant="icon" />}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
