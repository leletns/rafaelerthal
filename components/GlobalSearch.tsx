'use client';

import { useState, useRef, useEffect } from 'react';
import type { Patient } from '@/lib/data-model';
import PatientProfileModal from './PatientProfileModal';

interface GlobalSearchProps {
  patients: Patient[];
}

export default function GlobalSearch({ patients }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const results = query.length >= 2
    ? patients.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(query) ||
          (p.city || '').toLowerCase().includes(q) ||
          p.surgeries.some((s) => s.c.toLowerCase().includes(q))
        );
      }).slice(0, 12)
    : [];

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function handleOpen() {
    setOpen(true);
    setQuery('');
  }

  function handleClose() {
    setOpen(false);
    setQuery('');
  }

  function handleSelect(p: Patient) {
    setSelected(p);
    handleClose();
  }

  return (
    <>
      <PatientProfileModal patient={selected} onClose={() => setSelected(null)} />

      {/* Search trigger button */}
      <button
        onClick={handleOpen}
        title="Busca global (pacientes, telefone, cidade)"
        style={{
          background: 'none',
          border: '1.5px solid #E5E5EA',
          borderRadius: '10px',
          padding: '6px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#86868B',
          fontSize: '13px',
          fontFamily: 'inherit',
          transition: 'all .15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#007AFF';
          e.currentTarget.style.color = '#007AFF';
          e.currentTarget.style.background = '#F0F7FF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#E5E5EA';
          e.currentTarget.style.color = '#86868B';
          e.currentTarget.style.background = 'none';
        }}
      >
        {/* Magnifying glass */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span style={{ display: 'none' }}>
          Buscar
        </span>
      </button>

      {/* Full-screen overlay */}
      {open && (
        <div
          ref={overlayRef}
          onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '100px',
          }}
        >
          <div style={{
            width: '100%',
            maxWidth: '560px',
            margin: '0 16px',
            background: '#fff',
            borderRadius: '18px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}>
            {/* Search input row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 18px',
              borderBottom: query.length >= 2 ? '1px solid #F2F2F7' : 'none',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar por nome, telefone, cidade ou procedimento…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  color: '#1D1D1F',
                  background: 'transparent',
                }}
              />
              <button
                onClick={handleClose}
                style={{
                  background: '#F2F2F7',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#86868B',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                }}
              >
                Esc
              </button>
            </div>

            {/* Results */}
            {query.length >= 2 && (
              <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                {results.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#86868B', fontSize: '14px' }}>
                    Nenhum resultado para <strong>&ldquo;{query}&rdquo;</strong>
                  </div>
                ) : (
                  results.map((p) => {
                    const revenue = p.surgeries.reduce((s, c) => s + c.v, 0);
                    const hasSurgery = p.surgeries.length > 0;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelect(p)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          padding: '12px 18px',
                          background: 'none',
                          border: 'none',
                          borderBottom: '1px solid #F2F2F7',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background .1s',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F7'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: hasSurgery ? '#E6F7EC' : '#E5F1FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '15px',
                          fontWeight: 800,
                          color: hasSurgery ? '#28A745' : '#007AFF',
                          flexShrink: 0,
                        }}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#86868B', marginTop: '2px' }}>
                            {[p.phone, p.city, p.canal].filter(Boolean).join(' · ')}
                          </div>
                        </div>

                        {/* Tags */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end', flexShrink: 0 }}>
                          {hasSurgery && (
                            <span style={{ fontSize: '10px', fontWeight: 600, background: '#F0F7F2', color: '#1F7A3D', borderRadius: '6px', padding: '2px 6px', whiteSpace: 'nowrap' }}>
                              {p.surgeries.length} cir.
                            </span>
                          )}
                          {p.consultations.length > 0 && (
                            <span style={{ fontSize: '10px', fontWeight: 600, background: '#F2F2F7', color: '#86868B', borderRadius: '6px', padding: '2px 6px' }}>
                              {p.consultations.length} cons.
                            </span>
                          )}
                          {revenue > 0 && (
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#28A745' }}>
                              R$ {(revenue / 1000).toFixed(1)}k
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}

                {results.length === 12 && (
                  <div style={{ padding: '10px 18px', fontSize: '11px', color: '#86868B', textAlign: 'center' }}>
                    Mostrando os 12 primeiros resultados. Refine sua busca.
                  </div>
                )}
              </div>
            )}

            {/* Hint when empty */}
            {query.length < 2 && (
              <div style={{ padding: '20px 18px', color: '#86868B', fontSize: '13px' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px', color: '#1D1D1F', fontSize: '14px' }}>Busca global</div>
                <div>Digite pelo menos 2 caracteres para buscar em todos os pacientes por nome, telefone, cidade ou procedimento.</div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Nome', 'Telefone', 'Cidade', 'Procedimento'].map(h => (
                    <span key={h} style={{ background: '#F2F2F7', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, color: '#86868B' }}>{h}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
