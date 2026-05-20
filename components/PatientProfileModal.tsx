'use client';

import type { Patient } from '@/lib/data-model';
import { formatCurrency } from '@/lib/dashboard-calculations';
import WhatsAppButton from './WhatsAppButton';

interface PatientProfileModalProps {
  patient: Patient | null;
  onClose: () => void;
}

export default function PatientProfileModal({ patient, onClose }: PatientProfileModalProps) {
  if (!patient) return null;

  const totalRevenue = patient.surgeries.reduce((acc, s) => acc + s.v, 0);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 100,
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff',
          borderRadius: '20px',
          width: '90%',
          maxWidth: '560px',
          maxHeight: '80vh',
          overflow: 'hidden',
          zIndex: 110,
          boxShadow: '0 16px 64px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #007AFF15, #5856D615)',
            borderBottom: '1px solid #E5E5EA',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.2rem',
                flexShrink: 0,
              }}
            >
              {patient.name.charAt(0)}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1D1D1F' }}>{patient.name}</h2>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                {patient.age && (
                  <span style={{ fontSize: '0.75rem', color: '#86868B' }}>{patient.age} anos</span>
                )}
                {patient.city && (
                  <span style={{ fontSize: '0.75rem', color: '#86868B' }}>· {patient.city}</span>
                )}
                {patient.canal && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      background: '#E5F1FF',
                      color: '#007AFF',
                      padding: '1px 8px',
                      borderRadius: '6px',
                      fontWeight: 600,
                    }}
                  >
                    {patient.canal}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#86868B',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Cirurgias', value: String(patient.surgeries.length), color: '#007AFF' },
              { label: 'Consultas', value: String(patient.consultations.length), color: '#5856D6' },
              { label: 'Receita total', value: totalRevenue > 0 ? formatCurrency(totalRevenue) : '—', color: '#28A745' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  background: `${color}08`,
                  borderRadius: '10px',
                  padding: '12px',
                  textAlign: 'center',
                  borderTop: `2px solid ${color}`,
                }}
              >
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color, marginBottom: '2px' }}>{value}</div>
                <div style={{ fontSize: '0.72rem', color: '#86868B', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Contact */}
          {patient.phone && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                Contato
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.875rem', color: '#1D1D1F' }}>{patient.phone}</span>
                <WhatsAppButton phone={patient.phone} size="sm" />
              </div>
            </div>
          )}

          {/* Surgeries */}
          {patient.surgeries.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                Cirurgias realizadas
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {patient.surgeries.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: '#F9F9FB',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: '#1D1D1F' }}>{s.c}</span>
                      <span style={{ color: '#86868B', marginLeft: '8px' }}>{s.d}/{s.mes.substring(0,3)}</span>
                      <span style={{ color: '#86868B', marginLeft: '8px', fontSize: '0.72rem' }}>{s.cl}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#28A745' }}>{formatCurrency(s.v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consultations */}
          {patient.consultations.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                Consultas
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {patient.consultations.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: '#F9F9FB',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: '#1D1D1F' }}>{c.d}/{c.mes.substring(0,3)}</span>
                      <span style={{ color: '#86868B', marginLeft: '8px' }}>{c.canal}</span>
                    </div>
                    <span style={{ color: '#5856D6', fontWeight: 600, fontSize: '0.75rem' }}>{c.idade} anos</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E5EA', background: '#F9F9FB' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: '#007AFF',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </>
  );
}
