'use client';

import { useState, useEffect, useRef } from 'react';

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

const WEEKDAYS = ['D','S','T','Q','Q','S','S'];
const MONTH_NAMES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

interface MiniCalendarProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

function MiniCalendar({ value, onChange }: MiniCalendarProps) {
  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseInt(value.split('-')[0]);
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return parseInt(value.split('-')[1]) - 1;
    return new Date().getMonth();
  });

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ userSelect: 'none' }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <button
          type="button"
          onClick={prevMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86868B', fontSize: '14px', padding: '2px 6px', borderRadius: '6px' }}
        >‹</button>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D1D1F' }}>
          {MONTH_NAMES_PT[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86868B', fontSize: '14px', padding: '2px 6px', borderRadius: '6px' }}
        >›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '2px' }}>
        {WEEKDAYS.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#AEAEB2', padding: '2px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = dateStr === value;
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(dateStr)}
              style={{
                padding: '4px 0',
                borderRadius: '6px',
                border: 'none',
                cursor: isPast ? 'default' : 'pointer',
                background: isSelected ? '#007AFF' : isToday ? '#E5F1FF' : 'none',
                color: isSelected ? '#fff' : isPast ? '#AEAEB2' : isToday ? '#007AFF' : '#1D1D1F',
                fontSize: '0.72rem',
                fontWeight: isSelected || isToday ? 700 : 400,
                textAlign: 'center',
                transition: 'background 0.1s',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface FollowUpSchedulerProps {
  patientName: string;
  phone?: string;
}

export default function FollowUpScheduler({ patientName, phone = '' }: FollowUpSchedulerProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ScheduledFollowUp[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(true);
  const [hour, setHour] = useState('09');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>('default');
  const permAsked = useRef(false);

  // Load from localStorage + read current notif permission
  useEffect(() => {
    setItems(loadAll().filter(i => i.patientName === patientName));
    if ('Notification' in window) setNotifPerm(Notification.permission);
  }, [patientName]);

  const myItems = items.filter(i => i.patientName === patientName);
  const hasScheduled = myItems.length > 0;

  function handleDatePick(d: string) {
    setDate(d);
    setShowCalendar(false); // collapse calendar on selection
  }

  async function handleSave() {
    const id = `fu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newItem: ScheduledFollowUp = { id, patientName, phone, date, hour, period, note: note.trim() || undefined };
    const all = loadAll().filter(i => !(i.patientName === patientName));
    all.push(newItem);
    saveAll(all);
    setItems([newItem]);
    setSaved(true);

    // ── Browser notification ────────────────────────────────────
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        // Immediate confirmation
        const dateFormatted = date.split('-').reverse().join('/');
        new Notification('⏰ Follow-up agendado!', {
          body: `${patientName} — ${dateFormatted} às ${hour}h ${period}${newItem.note ? ' · ' + newItem.note : ''}`,
          tag: `followup_confirm_${id}`,
        });

        // If scheduled for today, fire a timed notification at the exact time
        const todayIso = new Date().toISOString().split('T')[0];
        if (date === todayIso) {
          let h24 = parseInt(hour, 10);
          if (period === 'PM' && h24 !== 12) h24 += 12;
          if (period === 'AM' && h24 === 12) h24 = 0;
          const scheduledMs = new Date();
          scheduledMs.setHours(h24, 0, 0, 0);
          const delay = scheduledMs.getTime() - Date.now();
          if (delay > 0) {
            setTimeout(() => {
              new Notification('⏰ Follow-up agora!', {
                body: `${patientName}${newItem.note ? ' — ' + newItem.note : ''}`,
                tag: `followup_due_${id}`,
              });
            }, delay);
          }
        }
      }
    }
    // ─────────────────────────────────────────────────────────────

    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 800);
  }

  function handleDelete(id: string) {
    const all = loadAll().filter(i => i.id !== id);
    saveAll(all);
    setItems(all.filter(i => i.patientName === patientName));
  }

  // Format date for display
  function formatDate(d: string) {
    const parts = d.split('-');
    if (parts.length !== 3) return d;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* ⏰ trigger button */}
      <button
        onClick={() => {
          const opening = !open;
          setOpen(opening);
          if (opening) {
            setShowCalendar(true);
            // Request permission proactively when popover opens
            if ('Notification' in window && Notification.permission === 'default' && !permAsked.current) {
              permAsked.current = true;
              Notification.requestPermission().then(p => setNotifPerm(p));
            } else if ('Notification' in window) {
              setNotifPerm(Notification.permission);
            }
          }
        }}
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
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              zIndex: 100,
              background: '#fff',
              borderRadius: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              padding: '14px',
              width: '230px',
              border: '1.5px solid #E5E5EA',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1D1D1F', marginBottom: '8px' }}>
              ⏰ Follow-up — {patientName}
            </div>

            {/* Notification permission status */}
            {'Notification' in window && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 8px', borderRadius: '7px', marginBottom: '8px',
                background: notifPerm === 'granted' ? '#E6F7EC' : notifPerm === 'denied' ? '#FFE5E3' : '#FFF3E0',
                border: `1px solid ${notifPerm === 'granted' ? '#28A74530' : notifPerm === 'denied' ? '#FF3B3030' : '#FF950030'}`,
                fontSize: '0.68rem',
                color: notifPerm === 'granted' ? '#1D7A33' : notifPerm === 'denied' ? '#CC0000' : '#B85C00',
              }}>
                <span>{notifPerm === 'granted' ? '🔔' : notifPerm === 'denied' ? '🔕' : '🔔'}</span>
                <span style={{ fontWeight: 600 }}>
                  {notifPerm === 'granted'
                    ? 'Notificações ativas'
                    : notifPerm === 'denied'
                      ? 'Notificações bloqueadas pelo navegador'
                      : 'Aguardando permissão de notificação…'}
                </span>
                {notifPerm === 'default' && (
                  <button
                    type="button"
                    onClick={() => Notification.requestPermission().then(p => setNotifPerm(p))}
                    style={{ marginLeft: 'auto', background: '#FF9500', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Permitir
                  </button>
                )}
              </div>
            )}

            {/* Existing scheduled items */}
            {myItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: '#E5F1FF', borderRadius: '8px', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#007AFF' }}>
                    {formatDate(item.date)} às {item.hour}h {item.period}
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

            {/* Date toggle button (shows selected date, click to reopen calendar) */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: '#86868B', marginBottom: '4px' }}>Data</label>
              <button
                type="button"
                onClick={() => setShowCalendar(v => !v)}
                style={{
                  width: '100%', padding: '6px 10px', borderRadius: '8px',
                  border: '1.5px solid #E5E5EA', background: '#F9F9FB',
                  fontSize: '0.8rem', fontFamily: 'inherit', color: '#1D1D1F',
                  cursor: 'pointer', textAlign: 'left', fontWeight: 600,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span>{formatDate(date)}</span>
                <span style={{ fontSize: '10px', color: '#AEAEB2' }}>{showCalendar ? '▲' : '▼'}</span>
              </button>
            </div>

            {/* Mini calendar (collapsible) */}
            {showCalendar && (
              <div style={{ marginBottom: '8px', padding: '8px', background: '#F9F9FB', borderRadius: '10px', border: '1.5px solid #E5E5EA' }}>
                <MiniCalendar value={date} onChange={handleDatePick} />
              </div>
            )}

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
