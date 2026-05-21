'use client';

import { useState, useEffect } from 'react';

export interface FollowUp {
  patientId: string;
  patientName: string;
  date: string;      // YYYY-MM-DD
  time: string;      // HH:MM (24h internally, display as AM/PM)
  note: string;
  createdAt: string;
  done: boolean;
}

const STORAGE_KEY = 'followups_v2';

function loadFollowUps(): FollowUp[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveFollowUps(fs: FollowUp[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fs)); } catch {}
}

function to12h(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr ?? '00';
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${period}`;
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

interface FollowUpSchedulerProps {
  patientId: string;
  patientName: string;
}

export default function FollowUpScheduler({ patientId, patientName }: FollowUpSchedulerProps) {
  const [open, setOpen] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [note, setNote] = useState('');

  useEffect(() => {
    setFollowUps(loadFollowUps());
  }, [open]);

  const myFollowUps = followUps
    .filter(f => f.patientId === patientId && !f.done)
    .sort((a, b) => a.date.localeCompare(b.date));

  const nextFollowUp = myFollowUps[0];

  // Check if due today or overdue
  const todayStr = new Date().toISOString().split('T')[0];
  const isDue = nextFollowUp && nextFollowUp.date <= todayStr;
  const isOverdue = nextFollowUp && nextFollowUp.date < todayStr;

  function handleSave() {
    if (!date) return;
    const all = loadFollowUps();
    const newFU: FollowUp = {
      patientId,
      patientName,
      date,
      time,
      note,
      createdAt: new Date().toISOString(),
      done: false,
    };
    const updated = [newFU, ...all];
    saveFollowUps(updated);
    setFollowUps(updated);
    setDate('');
    setTime('09:00');
    setNote('');
    setOpen(false);
  }

  function handleDone(fu: FollowUp) {
    const all = loadFollowUps().map(f =>
      f.patientId === fu.patientId && f.date === fu.date && f.time === fu.time
        ? { ...f, done: true }
        : f
    );
    saveFollowUps(all);
    setFollowUps(all);
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Agendar retorno"
        style={{
          background: nextFollowUp ? (isOverdue ? '#FFE5E3' : isDue ? '#FFF3E0' : '#E6F7EC') : '#F2F2F7',
          border: 'none',
          borderRadius: '8px',
          padding: '5px 8px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 700,
          color: nextFollowUp ? (isOverdue ? '#FF3B30' : isDue ? '#FF9500' : '#28A745') : '#86868B',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          whiteSpace: 'nowrap',
          transition: 'all .15s',
        }}
      >
        ⏰
        {nextFollowUp && (
          <span style={{ fontSize: '10px' }}>
            {formatDateBR(nextFollowUp.date)} {to12h(nextFollowUp.time)}
          </span>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,0.4)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div style={{
            background: '#fff', borderRadius: '20px',
            padding: '24px', width: '100%', maxWidth: '380px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#1D1D1F', marginBottom: '4px' }}>
              ⏰ Agendar Retorno
            </div>
            <div style={{ fontSize: '13px', color: '#86868B', marginBottom: '18px' }}>
              {patientName}
            </div>

            {/* Existing follow-ups */}
            {myFollowUps.length > 0 && (
              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agendados</div>
                {myFollowUps.map((fu, i) => (
                  <div key={i} style={{
                    background: fu.date < todayStr ? '#FFE5E3' : fu.date === todayStr ? '#FFF3E0' : '#E6F7EC',
                    borderRadius: '10px', padding: '8px 12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#1D1D1F' }}>
                        {formatDateBR(fu.date)} às {to12h(fu.time)}
                      </div>
                      {fu.note && <div style={{ fontSize: '11px', color: '#86868B' }}>{fu.note}</div>}
                    </div>
                    <button
                      onClick={() => handleDone(fu)}
                      style={{ background: '#28A745', border: 'none', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                    >
                      ✓ Feito
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New follow-up form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Novo agendamento</div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868B', fontWeight: 600, marginBottom: '4px' }}>Data</label>
                  <input
                    type="date"
                    value={date}
                    min={todayStr}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E5EA', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#86868B', fontWeight: 600, marginBottom: '4px' }}>Hora</label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E5EA', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  >
                    {['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
                      '12:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00',
                      '16:30','17:00','17:30','18:00'].map(t => (
                      <option key={t} value={t}>{to12h(t)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#86868B', fontWeight: 600, marginBottom: '4px' }}>Observação (opcional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: confirmar orçamento, agendar cirurgia..."
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E5EA', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={() => setOpen(false)}
                  style={{ flex: 1, padding: '10px', background: '#F2F2F7', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: '#86868B', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!date}
                  style={{ flex: 2, padding: '10px', background: date ? '#007AFF' : '#E5E5EA', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, color: date ? '#fff' : '#86868B', cursor: date ? 'pointer' : 'not-allowed' }}
                >
                  Salvar lembrete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
