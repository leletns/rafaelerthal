'use client';

import { useState, useRef, useEffect } from 'react';
import type { Notification } from '@/lib/data-model';

interface NotificationBellProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const TYPE_COLOR: Record<string, string> = {
  surgery:  'var(--c-blue)',
  followup: 'var(--c-orange)',
  birthday: 'var(--c-red)',
  payment:  'var(--c-green)',
  info:     'var(--c-purple)',
};

function TypeIcon({ type }: { type: string }) {
  const common = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true } as const;
  switch (type) {
    case 'birthday':
      return <svg {...common}><path d="M4 20h16v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6Z" /><path d="M12 8V5" /><path d="M8 12V9" /><path d="M16 12V9" /></svg>;
    case 'surgery':
      return <svg {...common}><path d="M12 3v18M3 12h18" /></svg>;
    case 'payment':
      return <svg {...common}><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20" /></svg>;
    case 'followup':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></svg>;
  }
}

export default function NotificationBell({
  notifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className="icon-btn"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unread > 0 ? `Avisos, ${unread} não ${unread === 1 ? 'lido' : 'lidos'}` : 'Avisos'}
        style={{ position: 'relative' }}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute', top: '3px', right: '3px',
              background: 'var(--c-red)', color: 'var(--on-accent)',
              borderRadius: '999px', minWidth: '17px', height: '17px', padding: '0 4px',
              fontSize: '10.5px', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label="Avisos"
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: 'min(340px, calc(100vw - 32px))',
              background: 'var(--surface)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-2)',
              zIndex: 50,
              overflow: 'hidden',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{
              padding: '14px 16px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text)' }}>
                Avisos {unread > 0 && <span style={{ color: 'var(--c-red)' }}>({unread})</span>}
              </span>
              {unread > 0 && (
                <button
                  onClick={onMarkAllRead}
                  style={{ background: 'none', border: 'none', fontSize: '12.5px', color: 'var(--c-blue)', fontWeight: 600 }}
                >
                  Marcar todos como lidos
                </button>
              )}
            </div>

            <ul style={{ maxHeight: '380px', overflowY: 'auto', listStyle: 'none', margin: 0, padding: 0 }}>
              {notifications.length === 0 ? (
                <li style={{ padding: '24px', textAlign: 'center', color: 'var(--text-2)', fontSize: '13.5px' }}>
                  Nenhum aviso no momento
                </li>
              ) : (
                notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => onMarkRead(n.id)}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '13px 16px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex', gap: '11px', alignItems: 'flex-start',
                        background: n.read ? 'transparent' : 'var(--tint-blue)',
                        border: 'none',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: '30px', height: '30px', borderRadius: '9px',
                          background: `color-mix(in srgb, ${TYPE_COLOR[n.type] ?? 'var(--c-purple)'} 14%, transparent)`,
                          color: TYPE_COLOR[n.type] ?? 'var(--c-purple)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                      >
                        <TypeIcon type={n.type} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: 'var(--text)', marginBottom: '2px' }}>
                          {n.title}
                        </span>
                        <span style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.45 }}>
                          {n.body}
                        </span>
                      </span>
                      {!n.read && (
                        <span aria-hidden="true" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--c-blue)', flexShrink: 0, marginTop: '5px' }} />
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
