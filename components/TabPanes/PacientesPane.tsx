'use client';

import { useState } from 'react';
import type { Patient, AmigoAttendanceItem } from '@/lib/data-model';
import PatientProfileModal from '../PatientProfileModal';
import WhatsAppButton from '../WhatsAppButton';
import { formatCurrency } from '@/lib/dashboard-calculations';

interface PacientesPaneProps {
  patients: Patient[];
  amigoAttendances?: AmigoAttendanceItem[];
}

export default function PacientesPane({ patients, amigoAttendances }: PacientesPaneProps) {
  const [search, setSearch] = useState('');
  const [filterCanal, setFilterCanal] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);

  const canais = Array.from(new Set(patients.filter((p) => p.canal).map((p) => p.canal!))).sort();

  const filtered = patients.filter((p) => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      (p.city || '').toLowerCase().includes(search.toLowerCase());
    const matchCanal = !filterCanal || p.canal === filterCanal;
    return matchSearch && matchCanal;
  });

  const withSurgeries = filtered.filter((p) => p.surgeries.length > 0);
  const consultsOnly = filtered.filter((p) => p.surgeries.length === 0 && p.consultations.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PatientProfileModal patient={selected} onClose={() => setSelected(null)} amigoAttendances={amigoAttendances} />

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
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
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total de pacientes', value: String(filtered.length), color: '#007AFF' },
          { label: 'Com cirurgia', value: String(withSurgeries.length), color: '#28A745' },
          { label: 'Só consulta', value: String(consultsOnly.length), color: '#FF9500' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: `${color}10`, border: `1.5px solid ${color}30`, borderRadius: '10px', padding: '10px 14px', minWidth: '100px' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '0.7rem', color: '#86868B', fontWeight: 600, marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
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
                  <td colSpan={8} style={{ textAlign: 'center', color: '#86868B', padding: '32px' }}>
                    Nenhum paciente encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const revenue = p.surgeries.reduce((acc, s) => acc + s.v, 0);
                  const hasSurgery = p.surgeries.length > 0;
                  return (
                    <tr key={p.id}>
                      <td>
                        <button
                          onClick={() => setSelected(p)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 700,
                            color: '#007AFF',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            padding: 0,
                            textAlign: 'left',
                          }}
                        >
                          {p.name}
                        </button>
                        {hasSurgery && (
                          <div style={{ fontSize: '10px', color: '#86868B', marginTop: '2px' }}>
                            {p.surgeries.map(s => s.c).slice(0,2).join(', ')}
                            {p.surgeries.length > 2 && ` +${p.surgeries.length - 2}`}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ color: '#86868B', fontSize: '12px', fontFamily: 'monospace' }}>{p.phone || '—'}</span>
                      </td>
                      <td style={{ color: '#86868B', fontSize: '12px' }}>{p.city || '—'}</td>
                      <td>
                        {p.canal ? (
                          <span className="badge badge-blue">{p.canal}</span>
                        ) : <span style={{ color: '#AEAEB2' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {hasSurgery ? (
                          <span style={{
                            display: 'inline-block',
                            background: '#E6F7EC',
                            color: '#28A745',
                            fontWeight: 800,
                            fontSize: '12px',
                            borderRadius: '8px',
                            padding: '2px 8px',
                            minWidth: '24px',
                          }}>
                            {p.surgeries.length}
                          </span>
                        ) : (
                          <span style={{ color: '#AEAEB2' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {p.consultations.length > 0 ? (
                          <span style={{
                            display: 'inline-block',
                            background: '#EEECFF',
                            color: '#5856D6',
                            fontWeight: 700,
                            fontSize: '12px',
                            borderRadius: '8px',
                            padding: '2px 8px',
                            minWidth: '24px',
                          }}>
                            {p.consultations.length}
                          </span>
                        ) : <span style={{ color: '#AEAEB2' }}>—</span>}
                      </td>
                      <td style={{ fontWeight: 700, color: revenue > 0 ? '#28A745' : '#AEAEB2', whiteSpace: 'nowrap', fontSize: '13px' }}>
                        {revenue > 0 ? formatCurrency(revenue) : '—'}
                      </td>
                      <td>
                        {p.phone && <WhatsAppButton phone={p.phone} size="sm" variant="icon" />}
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
