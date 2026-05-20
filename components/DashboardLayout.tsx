'use client';

import { useRouter } from 'next/navigation';
import { clearAuthToken } from '@/lib/safe-storage';
import NotificationBell from './NotificationBell';
import type { Notification } from '@/lib/data-model';

interface DashboardLayoutProps {
  children: React.ReactNode;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  syncing?: boolean;
  lastSync?: string;
}

export default function DashboardLayout({
  children,
  notifications,
  onMarkRead,
  onMarkAllRead,
  syncing,
}: DashboardLayoutProps) {
  const router = useRouter();

  function handleLogout() {
    clearAuthToken();
    router.replace('/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7' }}>
      {/* Header — matches original .brand layout */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #E5E5EA',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '0 28px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          {/* Logo — matches original .mono "b." */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '42px',
              fontWeight: 200,
              color: '#007AFF',
              letterSpacing: '-3px',
              lineHeight: 1,
              userSelect: 'none',
              fontFamily: "'Montserrat', sans-serif",
              paddingBottom: '4px',
            }}>
              b.
            </div>
            <div>
              <h1 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-.3px', lineHeight: 1.2, color: '#1D1D1F' }}>
                Mydash
              </h1>
              <p style={{ fontSize: '12px', fontWeight: 400, color: '#86868B', marginTop: '2px' }}>
                Clínica Blue · Dr. Rafael Erthal
              </p>
            </div>
          </div>

          {/* Right side */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Sync indicator */}
            {syncing && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '11px', color: '#007AFF', fontWeight: 600,
              }}>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: '#007AFF',
                  animation: 'pulse 1.2s ease-in-out infinite',
                  display: 'inline-block',
                }} />
                Syncing…
              </div>
            )}

            <NotificationBell
              notifications={notifications}
              onMarkRead={onMarkRead}
              onMarkAllRead={onMarkAllRead}
            />

            <button
              onClick={handleLogout}
              title="Sair"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '6px', borderRadius: '8px', color: '#86868B',
                display: 'flex', alignItems: 'center',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#FF3B30'; e.currentTarget.style.background = '#FFE5E3'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#86868B'; e.currentTarget.style.background = 'none'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: '1180px', margin: '0 auto', padding: '40px 28px 80px' }}>
        {children}
      </main>
    </div>
  );
}
