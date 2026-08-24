'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthToken } from '@/lib/safe-storage';
import { getStoredTheme, applyTheme, type Theme } from '@/lib/theme';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';
import type { Notification, Patient } from '@/lib/data-model';
import type { SyncState } from '@/app/dashboard/page';

interface DashboardLayoutProps {
  children: React.ReactNode;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  syncing?: boolean;
  syncState?: SyncState;
  lastSyncAt?: string | null;
  onRefresh?: () => void;
  patients?: Patient[];
}

/** Traduz o estado técnico da sincronização para uma frase de clínica. */
function describeSync(syncState: SyncState | undefined, lastSyncAt: string | null | undefined) {
  const working = !syncState || syncState.dados === 'syncing' || syncState.agenda === 'syncing';
  if (working) return { tone: 'busy' as const, text: 'Atualizando dados…' };

  const hora = lastSyncAt
    ? new Date(lastSyncAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  if (syncState.dados === 'ok') {
    return {
      tone: 'ok' as const,
      text: hora ? `Atualizado às ${hora}` : 'Dados atualizados',
      detail: syncState.dadosMsg,
    };
  }

  return {
    tone: 'stale' as const,
    text: hora ? `Sem conexão desde ${hora}` : 'Mostrando os últimos dados salvos',
    detail: 'Os números continuam disponíveis. A atualização volta sozinha assim que a conexão retornar.',
  };
}

export default function DashboardLayout({
  children,
  notifications,
  onMarkRead,
  onMarkAllRead,
  syncing,
  syncState,
  lastSyncAt,
  onRefresh,
  patients,
}: DashboardLayoutProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
  }

  function handleLogout() {
    clearAuthToken();
    router.replace('/login');
  }

  const sync = describeSync(syncState, lastSyncAt);
  const busy = sync.tone === 'busy' || Boolean(syncing);
  const dotColor = sync.tone === 'ok' ? 'var(--c-green)' : sync.tone === 'busy' ? 'var(--c-blue)' : 'var(--c-orange)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <a href="#conteudo" className="skip-link">Ir direto para o conteúdo</a>

      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{
          maxWidth: '1180px', margin: '0 auto', padding: '0 28px',
          minHeight: '68px', display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          {/* Identidade */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            <span
              aria-hidden="true"
              style={{
                fontSize: '40px', fontWeight: 200, color: 'var(--brand)',
                letterSpacing: '-3px', lineHeight: 1, userSelect: 'none', paddingBottom: '6px',
              }}
            >
              b.
            </span>
            <div>
              <h1 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-.3px', lineHeight: 1.2, color: 'var(--text)' }}>
                Mydash
              </h1>
              <p className="header-sub" style={{ fontSize: '12.5px', color: 'var(--text-2)', marginTop: '2px' }}>
                Clínica Blue · Dr. Rafael Erthal
              </p>
            </div>
          </div>

          {/* Estado da atualização — uma frase, sem termos técnicos */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={busy || !onRefresh}
            title={sync.detail || 'Atualizar agora'}
            className="sync-chip"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              marginLeft: '10px', padding: '6px 12px', borderRadius: '999px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--text-2)', fontSize: '12.5px', fontWeight: 600,
              cursor: busy || !onRefresh ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: '8px', height: '8px', borderRadius: '50%', background: dotColor,
                animation: busy ? 'pulse 1.2s ease-in-out infinite' : undefined,
              }}
            />
            <span>{sync.text}</span>
            {!busy && onRefresh && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            )}
            <span className="sr-only">
              {busy ? 'Atualizando os dados' : 'Atualizar os dados agora'}
            </span>
          </button>

          {/* Ações */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {patients && patients.length > 0 && <GlobalSearch patients={patients} />}

            <button
              onClick={toggleTheme}
              className="icon-btn"
              aria-label={theme === 'dark' ? 'Mudar para o modo claro' : 'Mudar para o modo escuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                </svg>
              )}
            </button>

            <NotificationBell
              notifications={notifications}
              onMarkRead={onMarkRead}
              onMarkAllRead={onMarkAllRead}
            />

            <button onClick={handleLogout} className="icon-btn" aria-label="Sair do painel" title="Sair">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main id="conteudo" style={{ maxWidth: '1180px', margin: '0 auto', padding: '36px 28px 80px' }}>
        {children}
      </main>

      <footer
        style={{
          textAlign: 'center',
          padding: '22px 28px',
          fontSize: '12px',
          color: 'var(--text-3)',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        © 2026 Blue Clínica Médica e Cirúrgica · Todos os direitos reservados · Desenvolvido por{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>Letícia Nascimento</span>
      </footer>
    </div>
  );
}
