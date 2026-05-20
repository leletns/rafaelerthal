'use client';

import ReminderCalendar from '../ReminderCalendar';
import { useState, useEffect } from 'react';
import type { Reminder } from '@/lib/data-model';
import { safeStorage, REMINDERS_KEY } from '@/lib/safe-storage';

function generateId(): string {
  return `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function EquipePane() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    const saved = safeStorage.get<Reminder[]>(REMINDERS_KEY, []);
    setReminders(saved);
  }, []);

  function saveReminders(updated: Reminder[]) {
    setReminders(updated);
    safeStorage.set(REMINDERS_KEY, updated);
  }

  function handleAddReminder(data: Omit<Reminder, 'id' | 'completed'>) {
    const newRem: Reminder = { ...data, id: generateId(), completed: false };
    saveReminders([...reminders, newRem]);
  }

  function handleToggleReminder(id: string) {
    saveReminders(reminders.map((r) => r.id === id ? { ...r, completed: !r.completed } : r));
  }

  function handleDeleteReminder(id: string) {
    saveReminders(reminders.filter((r) => r.id !== id));
  }

  const teamMembers = [
    { name: 'Dr. Rafael Erthal', role: 'Cirurgião Plástico', specialty: 'Lipedema', color: '#007AFF' },
    { name: 'Mayra', role: 'Coordenadora Comercial', specialty: 'Pipeline & Orçamentos', color: '#28A745' },
    { name: 'Recepção', role: 'Atendimento', specialty: 'Agendamentos', color: '#FF9500' },
    { name: 'Equipe Cirúrgica', role: 'Auxiliares', specialty: 'Centro cirúrgico', color: '#5856D6' },
  ];

  const pendingReminders = reminders.filter((r) => !r.completed);
  const completedReminders = reminders.filter((r) => r.completed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Team cards */}
      <div>
        <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 700, color: '#1D1D1F' }}>
          Equipe Clínica Blue
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {teamMembers.map((m) => (
            <div
              key={m.name}
              style={{
                background: '#fff',
                borderRadius: '14px',
                padding: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                borderTop: `3px solid ${m.color}`,
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: `${m.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: m.color,
                }}
              >
                {m.name.charAt(0)}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1D1D1F', marginBottom: '2px' }}>{m.name}</div>
              <div style={{ fontSize: '0.75rem', color: m.color, fontWeight: 600, marginBottom: '2px' }}>{m.role}</div>
              <div style={{ fontSize: '0.72rem', color: '#86868B' }}>{m.specialty}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar & Reminders */}
      <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1D1D1F' }}>
          Agenda & Lembretes
        </h3>
        <ReminderCalendar
          reminders={reminders}
          onAddReminder={handleAddReminder}
          onToggleReminder={handleToggleReminder}
          onDeleteReminder={handleDeleteReminder}
        />
      </div>

      {/* Reminder stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Lembretes pendentes', value: String(pendingReminders.length), color: '#FF9500' },
          { label: 'Concluídos', value: String(completedReminders.length), color: '#28A745' },
          { label: 'Total', value: String(reminders.length), color: '#007AFF' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: `${color}10`, border: `1.5px solid ${color}30`, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '0.7rem', color: '#86868B', fontWeight: 600, marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
