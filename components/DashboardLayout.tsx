'use client';

import { useRouter } from 'next/navigation';
import { clearAuthToken } from '@/lib/safe-storage';
import NotificationBell from './NotificationBell';
import SyncStatus from './SyncStatus';
import type { Notification } from '@/lib/data-model';

interface DashboardLayoutProps {
  children: React.ReactNode;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  lastSync?: string;
  onSyncComplete?: () => void;
}

export default function DashboardLayout({
  children,
  notifications,
  onMarkRead,
  onMarkAllRead,
  lastSync,
  onSyncComplete,
}: DashboardLayoutProps) {
  const router = useRouter();

  function handleLogout() {
    clearAuthToken();
    router.replace('/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7' }}>
      {/* Header */}
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #E5E5EA',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 24px',
            height: '56px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #007AFF, #0051D5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>b.</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1D1D1F', lineHeight: 1.1 }}>Clínica Blue</div>
              <div style={{ fontWeight: 400, fontSize: '0.68rem', color: '#86868B', lineHeight: 1.1 }}>Dr. Rafael Erthal</div>
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SyncStatus lastSync={lastSync} onSyncComplete={onSyncComplete} />
            <NotificationBell
              notifications={notifications}
              onMarkRead={onMarkRead}
              onMarkAllRead={onMarkAllRead}
            />
            <button
              onClick={handleLogout}
              title="Sair"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                color: '#86868B',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#FF3B30'; e.currentTarget.style.background = '#FFE5E3'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#86868B'; e.currentTarget.style.background = 'none'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '24px',
        }}
      >
        {children}
      </main>
    </div>
  );
}
