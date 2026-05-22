'use client';

import { useState } from 'react';
import type { Patient, AmigoAttendanceItem } from '@/lib/data-model';
import PatientProfileModal from '../PatientProfileModal';
import WhatsAppButton from '../WhatsAppButton';
import FollowUpScheduler from '../FollowUpScheduler';
import { formatCurrency } from '@/lib/dashboard-calculations';

interface PacientesPaneProps {
  patients: Patient[];
  amigoAttendances?: AmigoAttendanceItem[];
}

type FilterType = 'all' | 'surgery' | 'consult';

export default function PacientesPane({ patients, amigoAttendances }: PacientesPaneProps) {
  const [search, setSearch]         = useState('');
  const [filterCanal, setFilterCanal] = useState('');
  const [filterType, setFilterType]  = useState<FilterType>('all');
  const [selected, setSelected]      = useState<Patient | null>(null);

  const canais = Array.from(new Set(patients.filter((p) => p.canal).map((p) => p.canal!))).sort();

  // Apply type filter FIRST so counts in the pill are based on canal-filtered data
  const canalFiltered = patients.filter((p) => !filterCanal || p.canal === filterCanal);

  const withSurgeries = canalFiltered.filter((p) => p.surgeries.length > 0);
  const consultsOnly  = canalFiltered.filter((p) => p.surgeries.length === 0 && p.consultations.length > 0);

  const typeFiltered =
    filterType === 'surgery' ? withSurgeries :
    filterType === 'consult' ? consultsOnly  :
    canalFiltered;

  const filtered = typeFiltered.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(search) ||
      (p.city || '').toLowerCase().includes(q)
    );
  });

  const filterOptions: { key: FilterType; label: string; count: number }[] = [
    { key: 'all',     label: 'Todos',          count: canalFiltered.length },
    { key: 'surgery', label: 'Com cirurgia',    count: withSurgeries.length },
    { key: 'consult', label: 'Só consulta',     count: consultsOnly.length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <PatientProfileModal patient={selected} onClose={() => setSelected(null)} amigoAttendances={amigoAttendances} />

      {/* ── PRIMARY FILTER ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        background: '#F2F2F7',
        borderRadius: '14px',
        padding: '4px',
        gap: '4px',
      }}>
        {filterOptions.map(({ key, label, count }) => {
          const active = filterType === key;
          return (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              style={{
                padding: '10px 8px',
                borderRadius: '11px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: active ? '#fff' : 'transparent',
                boxShadow: active ? '0 1px 6px rgba(0,0,0,0.12)' : 'none',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <span style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: active
                  ? (key === 'surgery' ? '#28A745' : key === 'consult' ? '#5856D6' : '#007AFF')
                  : '#AEAEB2',
                lineHeight: 1,
              }}>
                {count}
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: active ? 700 : 500,
                color: active ? '#1D1D1F' : '#86868B',
                lineHeight: 1,
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SEARCH + CANAL ── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou cidade…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '200px',
            padding: '9px 14px',
            borderRadius: '10px',
            border: '1.5px solid #E5E5EA',
            fontSize: '0.85rem',
            fontFamily: 'inherit',
            background: '#F9F9FB',
            outline: 'none',
          }}
        />
        <select
          value={filterCanal}
          onChange={(e) => setFilterCanal(e.target.value)}
          style={{
            padding: '9px 12px',
            borderRadius: '10px',
            border: '1.5px solid #E5E5EA',
            fontSize: '0.82rem',
            fontFamily: 'inherit',
            background: '#F9F9FB',
            color: filterCanal ? '#1D1D1F' : '#86868B',
          }}
        >
          <option value="">Todos os canais</option>
          {canais.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ── TABLE ── */}
      <div style={{ background: '#fff', borderRadius: '18px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div className="ts">
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Telefone</th>
                <th>Cidade</th>
                <th>Canal</th>
                <th style={{ textAlign: 'center' }}>Cirurgias</th>
                <th style={{ textAlign: 'center' }}>Consultas</th>
                <th>Receita</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#86868B', padding: '40px 16px', fontSize: '0.9rem' }}>
                    Nenhum paciente encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const revenue  = p.surgeries.reduce((acc, s) => acc + s.v, 0);
                  const hasSurg  = p.surgeries.length > 0;
                  return (
                    <tr key={p.id}>
                      <td>
                        <button
                          onClick={() => setSelected(p)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontWeight: 700, color: '#007AFF', fontSize: '13px',
                            fontFamily: 'inherit', padding: 0, textAlign: 'left',
                          }}
                        >
                          {p.name}
                        </button>
                        {hasSurg && (
                          <div style={{ fontSize: '10px', color: '#86868B', marginTop: '2px' }}>
                            {p.surgeries.map(s => s.c).slice(0, 2).join(', ')}
                            {p.surgeries.length > 2 && ` +${p.surgeries.length - 2}`}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ color: '#86868B', fontSize: '12px', fontFamily: 'monospace' }}>{p.phone || '—'}</span>
                      </td>
                      <td style={{ color: '#86868B', fontSize: '12px' }}>{p.city || '—'}</td>
                      <td>
                        {p.canal
                          ? <span className="badge badge-blue">{p.canal}</span>
                          : <span style={{ color: '#AEAEB2' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {hasSurg ? (
                          <span style={{
                            display: 'inline-block', background: '#E6F7EC', color: '#28A745',
                            fontWeight: 800, fontSize: '12px', borderRadius: '8px', padding: '2px 8px',
                          }}>
                            {p.surgeries.length}
                          </span>
                        ) : <span style={{ color: '#AEAEB2' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {p.consultations.length > 0 ? (
                          <span style={{
                            display: 'inline-block', background: '#EEECFF', color: '#5856D6',
                            fontWeight: 700, fontSize: '12px', borderRadius: '8px', padding: '2px 8px',
                          }}>
                            {p.consultations.length}
                          </span>
                        ) : <span style={{ color: '#AEAEB2' }}>—</span>}
                      </td>
                      <td style={{ fontWeight: 700, color: revenue > 0 ? '#28A745' : '#AEAEB2', whiteSpace: 'nowrap', fontSize: '13px' }}>
                        {revenue > 0 ? formatCurrency(revenue) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {p.phone && <WhatsAppButton phone={p.phone} size="sm" variant="icon" />}
                          <FollowUpScheduler patientName={p.name} phone={p.phone} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ padding: '10px 18px', fontSize: '0.75rem', color: '#86868B', borderTop: '1px solid #F2F2F7' }}>
            {filtered.length} paciente{filtered.length !== 1 ? 's' : ''} exibido{filtered.length !== 1 ? 's' : ''}
            {search && ` · busca: "${search}"`}
            {filterCanal && ` · canal: ${filterCanal}`}
          </div>
        )}
      </div>
    </div>
  );
}
