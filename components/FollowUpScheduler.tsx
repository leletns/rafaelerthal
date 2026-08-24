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
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: '14px', padding: '2px 6px', borderRadius: '6px' }}
        >‹</button>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>
          {MONTH_NAMES_PT[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: '14px', padding: '2px 6px', borderRadius: '6px' }}
        >›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '2px' }}>
        {WEEKDAYS.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-3)', padding: '2px 0' }}>{d}</div>
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
                background: isSelected ? 'var(--c-blue)' : isToday ? 'var(--tint-blue)' : 'none',
                color: isSelected ? 'var(--surface)' : isPast ? 'var(--text-3)' : isToday ? 'var(--c-blue)' : 'var(--text)',
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

// ── NotifBanner — explains notification status & how to fix it ────────────────
function NotifBanner({
  perm,
  onAllow,
}: {
  perm: NotificationPermission | 'unsupported';
  onAllow: () => void;
}) {
  if (perm === 'granted') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 8px', borderRadius: '7px', marginBottom: '8px', background: 'var(--tint-green)', border: '1px solid color-mix(in srgb, var(--c-green) 19%, transparent)', fontSize: '0.67rem', color: 'var(--c-green)' }}>
        <span style={{ fontWeight: 600 }}>Lembretes ativos neste aparelho</span>
      </div>
    );
  }

  if (perm === 'unsupported') {
    return (
      <div style={{ padding: '6px 8px', borderRadius: '7px', marginBottom: '8px', background: 'var(--fill)', border: '1px solid var(--border)', fontSize: '0.67rem', color: 'var(--text-2)' }}>
        <span style={{ fontWeight: 700 }}>Lembretes indisponíveis neste navegador</span>
        <div style={{ marginTop: '2px' }}>No iPhone, adicione o painel à tela de início e abra por lá.</div>
      </div>
    );
  }

  if (perm === 'denied') {
    return (
      <div style={{ padding: '6px 8px', borderRadius: '7px', marginBottom: '8px', background: 'var(--tint-red)', border: '1px solid color-mix(in srgb, var(--c-red) 19%, transparent)', fontSize: '0.67rem', color: 'var(--c-red)' }}>
        <span style={{ fontWeight: 700 }}>Lembretes bloqueados</span>
        <div style={{ marginTop: '3px', lineHeight: 1.4 }}>
          Toque no cadeado ao lado do endereço do site e libere as notificações.
        </div>
      </div>
    );
  }

  // 'default' — not yet asked or dismissed
  return (
    <div style={{ padding: '6px 8px', borderRadius: '7px', marginBottom: '8px', background: 'var(--tint-orange)', border: '1px solid color-mix(in srgb, var(--c-orange) 19%, transparent)', fontSize: '0.67rem', color: 'var(--c-orange)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700 }}>Receber lembretes</span>
        <button
          type="button"
          onClick={onAllow}
          style={{ background: 'var(--c-orange)', color: 'var(--on-accent)', border: 'none', borderRadius: '5px', padding: '3px 8px', fontSize: '0.67rem', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          Permitir
        </button>
      </div>
      <div style={{ marginTop: '2px', lineHeight: 1.4 }}>
        Clique em <strong>Permitir</strong> para receber alertas no dia do follow-up.
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
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | 'unsupported'>('default');
  const askedRef = useRef(false);

  // Load from localStorage + read current notif permission
  useEffect(() => {
    setItems(loadAll().filter(i => i.patientName === patientName));
    if (!('Notification' in window)) {
      setNotifPerm('unsupported');
    } else {
      setNotifPerm(Notification.permission);
    }
  }, [patientName]);

  const myItems = items.filter(i => i.patientName === patientName);
  const hasScheduled = myItems.length > 0;

  function handleDatePick(d: string) {
    setDate(d);
    setShowCalendar(false); // collapse calendar on selection
  }

  function handleSave() {
    const id = `fu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newItem: ScheduledFollowUp = { id, patientName, phone, date, hour, period, note: note.trim() || undefined };
    const all = loadAll().filter(i => !(i.patientName === patientName));
    all.push(newItem);
    saveAll(all);
    setItems([newItem]);
    setSaved(true);

    // ── Browser notification ────────────────────────────────────
    if ('Notification' in window) {
      // Permission should already have been granted when popover opened.
      // Only fire notifications if actually granted — don't request again here.
      const perm = Notification.permission;
      if (perm === 'granted') {
        // Immediate confirmation
        const dateFormatted = date.split('-').reverse().join('/');
        new Notification('Follow-up agendado', {
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
              new Notification('Hora do follow-up', {
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
      {/* Botão que abre o agendamento */}
      <button
        onClick={() => {
          const opening = !open;
          setOpen(opening);
          if (opening) {
            setShowCalendar(true);
            // Sync current permission state
            if (!('Notification' in window)) {
              setNotifPerm('unsupported');
            } else {
              setNotifPerm(Notification.permission);
              // Proactively request if still 'default' and we haven't asked yet
              if (Notification.permission === 'default' && !askedRef.current) {
                askedRef.current = true;
                Notification.requestPermission().then(p => setNotifPerm(p));
              }
            }
          }
        }}
        title="Agendar follow-up"
        aria-label={hasScheduled ? `Follow-up de ${patientName} já agendado. Abrir para alterar.` : `Agendar follow-up de ${patientName}`}
        aria-expanded={open}
        style={{
          background: hasScheduled ? 'var(--tint-blue)' : 'none',
          border: hasScheduled ? '1.5px solid color-mix(in srgb, var(--c-blue) 25%, transparent)' : 'none',
          cursor: 'pointer',
          padding: '4px 6px',
          borderRadius: '7px',
          color: hasScheduled ? 'var(--c-blue)' : 'var(--text-3)',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '14px',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--tint-blue)'; e.currentTarget.style.color = 'var(--c-blue)'; }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = hasScheduled ? 'var(--tint-blue)' : 'none';
          e.currentTarget.style.color = hasScheduled ? 'var(--c-blue)' : 'var(--text-3)';
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="13" r="8" /><polyline points="12 9 12 13 15 15" /><path d="M5 3 2.5 5.5M19 3l2.5 2.5" />
        </svg>
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
              background: 'var(--surface)',
              borderRadius: '14px',
              boxShadow: 'var(--shadow-2)',
              padding: '14px',
              width: '230px',
              border: '1.5px solid var(--border)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text)', marginBottom: '8px' }}>
              Follow-up — {patientName}
            </div>

            {/* Notification permission status */}
            <NotifBanner perm={notifPerm} onAllow={() => {
              if (!('Notification' in window)) return;
              Notification.requestPermission().then(p => setNotifPerm(p));
            }} />

            {/* Existing scheduled items */}
            {myItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'var(--tint-blue)', borderRadius: '8px', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-blue)' }}>
                    {formatDate(item.date)} às {item.hour}h {item.period}
                  </div>
                  {item.note && <div style={{ fontSize: '0.68rem', color: 'var(--text-2)' }}>{item.note}</div>}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '2px', fontSize: '12px' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-red)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
                 aria-label="Remover lembrete">×</button>
              </div>
            ))}

            {/* Date toggle button (shows selected date, click to reopen calendar) */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '4px' }}>Data</label>
              <button
                type="button"
                onClick={() => setShowCalendar(v => !v)}
                style={{
                  width: '100%', padding: '6px 10px', borderRadius: '8px',
                  border: '1.5px solid var(--border)', background: 'var(--surface-2)',
                  fontSize: '0.8rem', fontFamily: 'inherit', color: 'var(--text)',
                  cursor: 'pointer', textAlign: 'left', fontWeight: 600,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span>{formatDate(date)}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true" style={{ color: 'var(--text-3)', transform: showCalendar ? 'rotate(180deg)' : undefined }}><polyline points="6 9 12 15 18 9" /></svg>
              </button>
            </div>

            {/* Mini calendar (collapsible) */}
            {showCalendar && (
              <div style={{ marginBottom: '8px', padding: '8px', background: 'var(--surface-2)', borderRadius: '10px', border: '1.5px solid var(--border)' }}>
                <MiniCalendar value={date} onChange={handleDatePick} />
              </div>
            )}

            {/* Time */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '3px' }}>Hora</label>
                <select
                  aria-label="Hora do follow-up"
                  value={hour}
                  onChange={e => setHour(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1.5px solid var(--border)', fontSize: '0.8rem', fontFamily: 'inherit', background: 'var(--surface-2)' }}
                >
                  {['06','07','08','09','10','11','12','01','02','03','04','05'].map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '3px' }}>AM/PM</label>
                <select
                  aria-label="Manhã ou tarde"
                  value={period}
                  onChange={e => setPeriod(e.target.value as 'AM' | 'PM')}
                  style={{ padding: '6px 8px', borderRadius: '7px', border: '1.5px solid var(--border)', fontSize: '0.8rem', fontFamily: 'inherit', background: 'var(--surface-2)' }}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '3px' }}>Nota</label>
              <input
                type="text"
                aria-label="Observação do follow-up"
                placeholder="Retorno pós-op, orçamento…"
                value={note}
                onChange={e => setNote(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1.5px solid var(--border)', fontSize: '0.8rem', fontFamily: 'inherit', background: 'var(--surface-2)' }}
              />
            </div>

            <button
              onClick={handleSave}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: saved ? 'var(--c-green)' : 'var(--c-blue)',
                color: 'var(--on-accent)',
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {saved ? 'Salvo' : 'Salvar'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
