'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthToken } from '@/lib/safe-storage';
import { getStoredTheme, applyTheme } from '@/lib/theme';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';
import type { Notification, Patient } from '@/lib/data-model';
import type { SyncState, ConnStatus } from '@/app/dashboard/page';

interface DashboardLayoutProps {
  children: React.ReactNode;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  syncing?: boolean;
  syncState?: SyncState;
  lastSync?: string;
  patients?: Patient[];
}

// ── Status pill helper ────────────────────────────────────────────────────────
const STATUS_STYLE: Record<ConnStatus, { dot: string; bg: string; text: string; border: string }> = {
  pending:      { dot: '#AEAEB2', bg: '#F2F2F7',   text: '#86868B', border: '#E5E5EA' },
  syncing:      { dot: '#007AFF', bg: '#E5F1FF',   text: '#007AFF', border: '#007AFF30' },
  ok:           { dot: '#28A745', bg: '#E6F7EC',   text: '#1D7A33', border: '#28A74530' },
  error:        { dot: '#FF3B30', bg: '#FFE5E3',   text: '#CC0000', border: '#FF3B3030' },
  unconfigured: { dot: '#FF9500', bg: '#FFF3E0',   text: '#B85C00', border: '#FF950030' },
};

function StatusPill({
  label, status, msg, pulse,
}: {
  label: string;
  status: ConnStatus;
  msg: string;
  pulse?: boolean;
}) {
  const s = STATUS_STYLE[status];
  const [tip, setTip] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => msg && setTip(true)}
      onMouseLeave={() => setTip(false)}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '3px 8px', borderRadius: '20px',
        background: s.bg, border: `1.5px solid ${s.border}`,
        cursor: msg ? 'default' : 'default',
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0,
          ...(pulse && status === 'syncing' ? { animation: 'pulse 1.2s ease-in-out infinite' } : {}),
        }} />
        <span style={{ fontSize: '11px', fontWeight: 600, color: s.text, whiteSpace: 'nowrap' }}>
          {label}
          {status === 'ok' && msg ? (
            <span style={{ fontWeight: 400, marginLeft: '4px', opacity: 0.75 }}>· {msg}</span>
          ) : status === 'syncing' ? (
            <span style={{ fontWeight: 400, marginLeft: '4px', opacity: 0.75 }}>· sincronizando…</span>
          ) : null}
        </span>
      </div>
      {/* Tooltip — only on error/unconfigured/pending with a message */}
      {tip && msg && status !== 'ok' && status !== 'syncing' && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
          background: '#1D1D1F', color: '#fff', borderRadius: '8px',
          padding: '7px 12px', fontSize: '11px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.22)', pointerEvents: 'none',
          maxWidth: '280px', wordBreak: 'break-word',
        }}>
          {msg}
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
  notifications,
  onMarkRead,
  onMarkAllRead,
  syncing,
  syncState,
  patients,
}: DashboardLayoutProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
  }

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
  }

  function handleLogout() {
    clearAuthToken();
    router.replace('/login');
  }

  const sheetsPill = syncState
    ? { status: syncState.sheets, msg: syncState.sheetsMsg }
    : { status: (syncing ? 'syncing' : 'pending') as ConnStatus, msg: '' };

  const amigoPill = syncState
    ? { status: syncState.amigo, msg: syncState.amigoMsg }
    : { status: 'pending' as ConnStatus, msg: '' };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7' }}>
      {/* Header */}
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
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            <div style={{
              width: '52px', height: '52px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '42px', fontWeight: 200, color: '#007AFF',
              letterSpacing: '-3px', lineHeight: 1, userSelect: 'none',
              fontFamily: "'Montserrat', sans-serif", paddingBottom: '4px',
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

          {/* Connection status pills — hidden on very small screens */}
          <div style={{
            display: 'flex', gap: '6px', alignItems: 'center',
            marginLeft: '12px',
            // hide on very small viewports
            overflow: 'hidden',
          }}
            className="sync-pills"
          >
            <StatusPill label="Sheets"      status={sheetsPill.status} msg={sheetsPill.msg} pulse />
            <StatusPill label="AmigoClinic" status={amigoPill.status}  msg={amigoPill.msg}  pulse />
          </div>

          {/* Right side */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {/* Global search */}
            {patients && patients.length > 0 && (
              <GlobalSearch patients={patients} />
            )}

            {/* Dark / Light toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '6px', borderRadius: '8px', color: '#86868B',
                display: 'flex', alignItems: 'center',
                fontSize: '16px',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F2F2F7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

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

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '20px 28px',
        fontSize: '11px',
        color: '#AEAEB2',
        borderTop: '1px solid #E5E5EA',
        background: '#fff',
        letterSpacing: '0.02em',
      }}>
        © 2026 Blue Clínica Médica e Cirúrgica · Todos os direitos reservados · Desenvolvido por{' '}
        <span style={{ fontWeight: 600, color: '#86868B' }}>Letícia Nascimento</span>
      </footer>
    </div>
  );
}
