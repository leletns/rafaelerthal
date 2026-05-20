'use client';

import { useState } from 'react';
import { syncWithSheets } from '@/lib/sheets-client';
import { getAuthToken } from '@/lib/safe-storage';

interface SyncStatusProps {
  lastSync?: string;
  onSyncComplete?: () => void;
}

export default function SyncStatus({ lastSync, onSyncComplete }: SyncStatusProps) {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  async function handleSync() {
    setSyncing(true);
    setStatus('idle');
    try {
      const token = getAuthToken() || '';
      const result = await syncWithSheets(token);
      setStatus(result.success ? 'success' : 'error');
      if (result.success && onSyncComplete) {
        onSyncComplete();
      }
    } catch {
      setStatus('error');
    } finally {
      setSyncing(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  const colors = {
    idle: '#86868B',
    success: '#28A745',
    error: '#FF3B30',
  };

  const labels = {
    idle: lastSync ? `Sync: ${lastSync}` : 'Não sincronizado',
    success: 'Sincronizado!',
    error: 'Erro no sync',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: colors[status],
          transition: 'background 0.3s',
          animation: syncing ? 'pulse 1s infinite' : 'none',
        }}
      />
      <span style={{ fontSize: '0.75rem', color: colors[status], transition: 'color 0.3s' }}>
        {syncing ? 'Sincronizando...' : labels[status]}
      </span>
      <button
        onClick={handleSync}
        disabled={syncing}
        title="Sincronizar com Google Sheets"
        style={{
          background: 'none',
          border: 'none',
          cursor: syncing ? 'not-allowed' : 'pointer',
          padding: '4px',
          borderRadius: '6px',
          color: '#86868B',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.15s, background 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#007AFF'; e.currentTarget.style.background = '#E5F1FF'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#86868B'; e.currentTarget.style.background = 'none'; }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }}
        >
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          <path d="M1 4v6h6M23 20v-6h-6" />
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
        </svg>
      </button>
    </div>
  );
}
