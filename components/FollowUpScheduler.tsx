'use client';

import { useState, useEffect } from 'react';

interface ScheduledFollowUp {
  id: string;
  patientName: string;
  phone: string;
  date: string;     // YYYY-MM-DD
  hour: string;     // "09" – "23"
  period: 'AM' | 'PM';
  note?: string;
}

const STORAGE_KEY = 'followup_scheduler_v1';

function loadAll(): ScheduledFollowUp[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as ScheduledFollowUp[];
  } catch { return []; }
}

function saveAll(items: ScheduledFollowUp[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

interface FollowUpSchedulerProps {
  patientName: string;
  phone?: string;
}

export default function FollowUpScheduler({ patientName, phone = '' }: FollowUpSchedulerProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ScheduledFollowUp[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [hour, setHour] = useState('09');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  // Load from localStorage
  useEffect(() => {
    setItems(loadAll().filter(i => i.patientName === patientName));
  }, [patientName]);

  // Find existing follow-up for this patient
  const myItems = items.filter(i => i.patientName === patientName);
  const hasScheduled = myItems.length > 0;

  function handleSave() {
    const id = `fu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newItem: ScheduledFollowUp = { id, patientName, phone, date, hour, period, note: note.trim() || undefined };
    const all = loadAll().filter(i => !(i.patientName === patientName));
    all.push(newItem);
    saveAll(all);
    setItems([newItem]);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    setOpen(false);
  }

  function handleDelete(id: string) {
    const all = loadAll().filter(i => i.id !== id);
    saveAll(all);
    setItems(all.filter(i => i.patientName === patientName));
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* ⏰ trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Agendar follow-up"
        style={{
          background: hasScheduled ? '#E5F1FF' : 'none',
          border: hasScheduled ? '1.5px solid #007AFF40' : 'none',
          cursor: 'pointer',
          padding: '4px 6px',
          borderRadius: '7px',
          color: hasScheduled ? '#007AFF' : '#AEAEB2',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '14px',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#E5F1FF'; e.currentTarget.style.color = '#007AFF'; }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = hasScheduled ? '#E5F1FF' : 'none';
          e.currentTarget.style.color = hasScheduled ? '#007AFF' : '#AEAEB2';
        }}
      >
        ⏰
        {hasScheduled && (
          <span style={{ fontSize: '10px', fontWeight: 700, lineHeight: 1 }}>
            {myItems[0].date.slice(5).replace('-', '/')}
          </span>
        )}
      </button>

      {/* Dropdown popover */}
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            zIndex: 100,
            background: '#fff',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            padding: '14px',
            width: '240px',
            border: '1.5px solid #E5E5EA',
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1D1D1F', marginBottom: '10px' }}>
              ⏰ Follow-up — {patientName}
            </div>

            {/* Existing scheduled items */}
            {myItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: '#E5F1FF', borderRadius: '8px', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#007AFF' }}>
                    {item.date.slice(5).replace('-', '/')} às {item.hour}h {item.period}
                  </div>
                  {item.note && <div style={{ fontSize: '0.68rem', color: '#86868B' }}>{item.note}</div>}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AEAEB2', padding: '2px', fontSize: '12px' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FF3B30')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#AEAEB2')}
                >✕</button>
              </div>
            ))}

            {/* Date */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: '#86868B', marginBottom: '3px' }}>Data</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1.5px solid #E5E5EA', fontSize: '0.8rem', fontFamily: 'inherit', background: '#F9F9FB' }}
              />
            </div>

            {/* Time */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: '#86868B', marginBottom: '3px' }}>Hora</label>
                <select
                  value={hour}
                  onChange={e => setHour(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1.5px solid #E5E5EA', fontSize: '0.8rem', fontFamily: 'inherit', background: '#F9F9FB' }}
                >
                  {['06','07','08','09','10','11','12','01','02','03','04','05'].map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: '#86868B', marginBottom: '3px' }}>AM/PM</label>
                <select
                  value={period}
                  onChange={e => setPeriod(e.target.value as 'AM' | 'PM')}
                  style={{ padding: '6px 8px', borderRadius: '7px', border: '1.5px solid #E5E5EA', fontSize: '0.8rem', fontFamily: 'inherit', background: '#F9F9FB' }}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: '#86868B', marginBottom: '3px' }}>Nota</label>
              <input
                type="text"
                placeholder="Retorno pós-op, orçamento..."
                value={note}
                onChange={e => setNote(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1.5px solid #E5E5EA', fontSize: '0.8rem', fontFamily: 'inherit', background: '#F9F9FB' }}
              />
            </div>

            <button
              onClick={handleSave}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: saved ? '#28A745' : '#007AFF',
                color: '#fff',
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {saved ? '✓ Salvo!' : 'Salvar'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
