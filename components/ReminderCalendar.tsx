'use client';

import { useState } from 'react';
import type { Reminder } from '@/lib/data-model';

interface ReminderCalendarProps {
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'completed'>) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function ReminderCalendar({
  reminders,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
}: ReminderCalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ patientName: '', phone: '', title: '', notes: '' });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  function formatDateStr(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function remindersForDate(dateStr: string) {
    return reminders.filter((r) => r.date === dateStr);
  }

  function handleAddReminder() {
    if (!selectedDate || !form.title.trim()) return;
    onAddReminder({
      patientName: form.patientName.trim(),
      phone: form.phone.trim(),
      date: selectedDate,
      title: form.title.trim(),
      notes: form.notes.trim() || undefined,
    });
    setForm({ patientName: '', phone: '', title: '', notes: '' });
    setShowAddForm(false);
  }

  const dayReminders = selectedDate ? remindersForDate(selectedDate) : [];

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      {/* Calendar grid */}
      <div style={{ flex: '1 1 260px', minWidth: '240px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <button
            onClick={prevMonth}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#007AFF', padding: '4px 8px', borderRadius: '6px', fontSize: '1rem' }}
          >
            ‹
          </button>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1D1D1F' }}>
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#007AFF', padding: '4px 8px', borderRadius: '6px', fontSize: '1rem' }}
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, color: '#86868B', padding: '4px 0' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {/* Blank cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = formatDateStr(year, month, day);
            const isToday = dateStr === formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());
            const isSelected = dateStr === selectedDate;
            const hasReminders = remindersForDate(dateStr).length > 0;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: isToday ? 800 : 500,
                  background: isSelected ? '#007AFF' : isToday ? '#007AFF15' : 'transparent',
                  color: isSelected ? '#fff' : isToday ? '#007AFF' : '#1D1D1F',
                  position: 'relative',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#F5F5F7';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = isToday ? '#007AFF15' : 'transparent';
                }}
              >
                {day}
                {hasReminders && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '1px',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: isSelected ? '#fff' : '#007AFF',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reminders panel */}
      <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
        {selectedDate ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>
                {new Date(selectedDate + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </h4>
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  background: '#007AFF',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                + Lembrete
              </button>
            </div>

            {dayReminders.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#86868B', textAlign: 'center', padding: '16px 0' }}>
                Sem lembretes para este dia
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dayReminders.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '10px 12px',
                      background: r.completed ? '#F9F9FB' : '#F0F7FF',
                      borderRadius: '10px',
                      borderLeft: `3px solid ${r.completed ? '#AEAEB2' : '#007AFF'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: r.completed ? '#86868B' : '#1D1D1F', textDecoration: r.completed ? 'line-through' : 'none' }}>
                          {r.title}
                        </div>
                        {r.patientName && (
                          <div style={{ fontSize: '0.72rem', color: '#86868B' }}>{r.patientName}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => onToggleReminder(r.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: r.completed ? '#AEAEB2' : '#28A745' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteReminder(r.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#AEAEB2' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#FF3B30')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#AEAEB2')}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {r.notes && (
                      <div style={{ fontSize: '0.7rem', color: '#86868B', marginTop: '4px' }}>{r.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showAddForm && (
              <div style={{ marginTop: '12px', background: '#F9F9FB', borderRadius: '10px', padding: '12px' }}>
                {[
                  { label: 'Título *', key: 'title', placeholder: 'ex: Follow-up' },
                  { label: 'Paciente', key: 'patientName', placeholder: 'Nome' },
                  { label: 'Telefone', key: 'phone', placeholder: '(47) 99900-0000' },
                  { label: 'Notas', key: 'notes', placeholder: 'Observações...' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#86868B', marginBottom: '3px' }}>
                      {label}
                    </label>
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '7px',
                        border: '1.5px solid #E5E5EA',
                        fontSize: '0.8rem',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowAddForm(false)}
                    style={{ flex: 1, padding: '7px', borderRadius: '7px', border: '1.5px solid #E5E5EA', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddReminder}
                    disabled={!form.title.trim()}
                    style={{ flex: 1, padding: '7px', borderRadius: '7px', border: 'none', background: form.title.trim() ? '#007AFF' : '#99C9FF', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p style={{ fontSize: '0.8rem', color: '#86868B', textAlign: 'center', padding: '24px 0' }}>
            Selecione uma data para ver lembretes
          </p>
        )}
      </div>
    </div>
  );
}
