'use client';

import { useState } from 'react';
import type { Patient } from '@/lib/data-model';
import PatientProfileModal from '../PatientProfileModal';
import WhatsAppButton from '../WhatsAppButton';
import FollowUpScheduler from '../FollowUpScheduler';
import { formatCurrency } from '@/lib/dashboard-calculations';

interface PacientesPaneProps {
  patients: Patient[];
}

type FilterType = 'all' | 'surgery' | 'consult';

const CHIP_COLORS: Record<FilterType, { active: string; bg: string; activeBg: string }> = {
  all:     { active: '#007AFF', bg: '#F2F2F7', activeBg: '#E5F1FF' },
  surgery: { active: '#28A745', bg: '#F2F2F7', activeBg: '#E6F7EC' },
  consult: { active: '#5856D6', bg: '#F2F2F7', activeBg: '#EEECFF' },
};

export default function PacientesPane({ patients }: PacientesPaneProps) {
  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selected, setSelected]     = useState<Patient | null>(null);

  // Type filter then search
  const byType =
    filterType === 'surgery' ? patients.filter(p => p.surgeries.length > 0) :
    filterType === 'consult' ? patients.filter(p => p.surgeries.length === 0 && p.consultations.length > 0) :
    patients;

  const filtered = byType.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(search) ||
      (p.city || '').toLowerCase().includes(q)
    );
  });

  // Counts based on full list (chips are stable across search)
  const countAll     = patients.length;
  const countSurgery = patients.filter(p => p.surgeries.length > 0).length;
  const countConsult = patients.filter(p => p.surgeries.length === 0 && p.consultations.length > 0).length;

  const typeOptions: { key: FilterType; label: string; count: number }[] = [
    { key: 'all',     label: 'Todos',       count: countAll },
    { key: 'surgery', label: 'Com cirurgia', count: countSurgery },
    { key: 'consult', label: 'Só consulta',  count: countConsult },
  ];

  function chipStyle(active: boolean, color: string, activeBg: string): React.CSSProperties {
    return {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '9px 16px',
      borderRadius: '12px',
      border: `1.5px solid ${active ? color : 'transparent'}`,
      background: active ? activeBg : '#F2F2F7',
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.15s',
      gap: '2px',
      whiteSpace: 'nowrap' as const,
    };
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <PatientProfileModal patient={selected} onClose={() => setSelected(null)} />

      {/* ── TIPO DE PACIENTE ── */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {typeOptions.map(({ key, label, count }) => {
          const active  = filterType === key;
          const { active: color, activeBg } = CHIP_COLORS[key];
          return (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              style={chipStyle(active, color, activeBg)}
            >
              <span style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: active ? color : '#AEAEB2',
                lineHeight: 1,
              }}>
                {count}
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: active ? 700 : 500,
                color: active ? color : '#86868B',
                lineHeight: 1,
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── BUSCA ── */}
      <input
        type="text"
        placeholder="Buscar por nome, telefone ou cidade…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '9px 14px',
          borderRadius: '10px',
          border: '1.5px solid #E5E5EA',
          fontSize: '0.85rem',
          fontFamily: 'inherit',
          background: '#F9F9FB',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      {/* ── TABELA ── */}
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
                filtered.map(p => {
                  const revenue = p.surgeries.reduce((acc, s) => acc + s.v, 0);
                  const hasSurg = p.surgeries.length > 0;
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
                        <span style={{ color: '#86868B', fontSize: '12px', fontFamily: 'monospace' }}>
                          {p.phone || '—'}
                        </span>
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
                      <td style={{
                        fontWeight: 700,
                        color: revenue > 0 ? '#28A745' : '#AEAEB2',
                        whiteSpace: 'nowrap',
                        fontSize: '13px',
                      }}>
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
            {filterType !== 'all' && ` · ${typeOptions.find(o => o.key === filterType)?.label}`}
            {search && ` · "${search}"`}
          </div>
        )}
      </div>
    </div>
  );
}
