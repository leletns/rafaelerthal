'use client';

import { useState } from 'react';
import type { Consultation } from '@/lib/data-model';
import WhatsAppButton from '../WhatsAppButton';

interface ConsultasPaneProps {
  cons25: Consultation[];
  cons26: Consultation[];
}

export default function ConsultasPane({ cons25, cons26 }: ConsultasPaneProps) {
  const [year, setYear]           = useState<2025 | 2026>(new Date().getFullYear() >= 2026 ? 2026 : 2025);
  const [search, setSearch]       = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const list   = year === 2025 ? cons25 : cons26;
  const months = Array.from(new Set(list.map((c) => c.mes)));

  const filtered = list.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.p.toLowerCase().includes(q) ||
      c.tel.includes(q) ||
      (c.cidade || '').toLowerCase().includes(q) ||
      c.canal.toLowerCase().includes(q);
    const matchMonth = !filterMonth || c.mes === filterMonth;
    return matchSearch && matchMonth;
  });

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
        <div className="seg">
          <button className={`sb${year === 2025 ? ' on' : ''}`} onClick={() => setYear(2025)}>2025</button>
          <button className={`sb${year === 2026 ? ' on' : ''}`} onClick={() => setYear(2026)}>2026</button>
        </div>

        <input
          type="text"
          placeholder="Buscar paciente, telefone, canal…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '200px', padding: '8px 14px',
            borderRadius: '10px', border: '1.5px solid #E5E5EA',
            fontSize: '13px', fontFamily: 'inherit', background: '#F9F9FB',
          }}
        />

        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #E5E5EA',
            fontSize: '13px', fontFamily: 'inherit', background: '#F9F9FB',
          }}
        >
          <option value="">Todos os meses</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Count */}
      <div style={{ fontSize: '12px', color: '#86868B', marginBottom: '12px', fontWeight: 500 }}>
        {filtered.length} consulta{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
        <span style={{ color: '#D2D2D7', margin: '0 8px' }}>·</span>
        total {list.length} em {year}
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
                <th>Telefone</th>
                <th>Idade</th>
                <th>Canal</th>
                <th>WA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#86868B', padding: '40px' }}>
                    Nenhuma consulta encontrada
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={i}>
                    <td style={{ color: '#86868B', fontSize: '11px', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: '#1D1D1F' }}>{c.p}</td>
                    <td style={{ whiteSpace: 'nowrap', color: '#1D1D1F', fontWeight: 600 }}>{c.d}</td>
                    <td style={{ color: '#86868B', fontSize: '12px', whiteSpace: 'nowrap' }}>{c.tel}</td>
                    <td style={{ fontWeight: 600, color: '#5856D6', fontSize: '12px' }}>
                      {c.idade > 0 ? `${c.idade}a` : '—'}
                    </td>
                    <td style={{ fontSize: '11px', color: '#3A3A3C', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.canal || <span style={{ color: '#C7C7CC' }}>—</span>}
                    </td>
                    <td>
                      {c.tel && <WhatsAppButton phone={c.tel} size="sm" variant="icon" />}
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
