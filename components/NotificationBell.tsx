'use client';

import { useState } from 'react';
import type { Notification } from '@/lib/data-model';

interface NotificationBellProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export default function NotificationBell({
  notifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;


  const typeColors: Record<string, string> = {
    surgery: '#007AFF',
    followup: '#FF9500',
    birthday: '#FF3B30',
    payment: '#28A745',
    info: '#5856D6',
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          color: '#1D1D1F',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F5F7')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              background: '#FF3B30',
              color: '#fff',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
            }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '340px',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              zIndex: 50,
              overflow: 'hidden',
              border: '1px solid #E5E5EA',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid #F2F2F7',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1D1D1F' }}>
                Notificações {unread > 0 && <span style={{ color: '#FF3B30' }}>({unread})</span>}
              </span>
              {unread > 0 && (
                <button
                  onClick={onMarkAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: '#007AFF',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                  }}
                >
                  Marcar todas lidas
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#86868B', fontSize: '0.875rem' }}>
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => onMarkRead(n.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #F2F2F7',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                      background: n.read ? '#fff' : '#F0F7FF',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F5F7')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? '#fff' : '#F0F7FF')}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: `${typeColors[n.type]}12`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: typeColors[n.type] }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1D1D1F', marginBottom: '2px' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#86868B', lineHeight: 1.4 }}>
                        {n.body}
                      </div>
                    </div>
                    {!n.read && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#007AFF', flexShrink: 0, marginTop: '4px' }} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
