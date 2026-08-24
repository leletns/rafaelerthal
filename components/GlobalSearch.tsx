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
        aria-label="Buscar paciente por nome, telefone, cidade ou procedimento"
        title="Buscar paciente"
        style={{
          background: 'none',
          border: '1.5px solid var(--border)',
          borderRadius: '10px',
          padding: '6px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-2)',
          fontSize: '13px',
          fontFamily: 'inherit',
          transition: 'all .15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--c-blue)';
          e.currentTarget.style.color = 'var(--c-blue)';
          e.currentTarget.style.background = 'var(--tint-blue)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text-2)';
          e.currentTarget.style.background = 'none';
        }}
      >
        {/* Magnifying glass */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span className="search-label" aria-hidden="true">Buscar paciente</span>
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
            background: 'var(--surface)',
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
              borderBottom: query.length >= 2 ? '1px solid var(--fill)' : 'none',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.5" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                aria-label="Buscar paciente"
                placeholder="Buscar por nome, telefone, cidade ou procedimento…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  color: 'var(--text)',
                  background: 'transparent',
                }}
              />
              <button
                onClick={handleClose}
                style={{
                  background: 'var(--fill)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: 'var(--text-2)',
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
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-2)', fontSize: '14px' }}>
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
                          borderBottom: '1px solid var(--fill)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background .1s',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--fill)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: hasSurgery ? 'var(--tint-green)' : 'var(--tint-blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '15px',
                          fontWeight: 800,
                          color: hasSurgery ? 'var(--c-green)' : 'var(--c-blue)',
                          flexShrink: 0,
                        }}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>
                            {[p.phone, p.city, p.canal].filter(Boolean).join(' · ')}
                          </div>
                        </div>

                        {/* Tags */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end', flexShrink: 0 }}>
                          {hasSurgery && (
                            <span style={{ fontSize: '10px', fontWeight: 700, background: 'var(--tint-green)', color: 'var(--c-green)', borderRadius: '6px', padding: '2px 6px', whiteSpace: 'nowrap' }}>
                              {p.surgeries.length} cirurgia{p.surgeries.length === 1 ? '' : 's'}
                            </span>
                          )}
                          {p.consultations.length > 0 && (
                            <span style={{ fontSize: '10px', fontWeight: 600, background: 'var(--fill)', color: 'var(--text-2)', borderRadius: '6px', padding: '2px 6px' }}>
                              {p.consultations.length} consulta{p.consultations.length === 1 ? '' : 's'}
                            </span>
                          )}
                          {revenue > 0 && (
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--c-green)' }}>
                              R$ {(revenue / 1000).toFixed(1)}k
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}

                {results.length === 12 && (
                  <div style={{ padding: '10px 18px', fontSize: '11px', color: 'var(--text-2)', textAlign: 'center' }}>
                    Mostrando os 12 primeiros resultados. Refine sua busca.
                  </div>
                )}
              </div>
            )}

            {/* Hint when empty */}
            {query.length < 2 && (
              <div style={{ padding: '20px 18px', color: 'var(--text-2)', fontSize: '13px' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text)', fontSize: '14px' }}>Busca de pacientes</div>
                <div>Digite pelo menos 2 caracteres para buscar em todos os pacientes por nome, telefone, cidade ou procedimento.</div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Nome', 'Telefone', 'Cidade', 'Procedimento'].map(h => (
                    <span key={h} style={{ background: 'var(--fill)', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-2)' }}>{h}</span>
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
