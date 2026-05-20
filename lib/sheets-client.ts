// ============================================================
// SHEETS CLIENT - Client-side Google Sheets sync functions
// ============================================================

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp?: string;
  rowsUpdated?: number;
}

export interface PullResult {
  success: boolean;
  data?: Record<string, unknown>;
  message: string;
}

export async function pullFromSheets(token: string): Promise<PullResult> {
  try {
    const res = await fetch('/api/sheets/pull', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return { success: false, message: `Erro ${res.status}: ${res.statusText}` };
    }

    const data = await res.json();
    return { success: true, data, message: 'Dados sincronizados com sucesso' };
  } catch (err) {
    return { success: false, message: `Falha na conexão: ${err instanceof Error ? err.message : 'erro desconhecido'}` };
  }
}

export async function pushToSheets(
  token: string,
  payload: Record<string, unknown>
): Promise<SyncResult> {
  try {
    const res = await fetch('/api/sheets/push', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, message: `Erro ${res.status}: ${res.statusText}` };
    }

    const data = await res.json();
    return {
      success: true,
      message: 'Dados enviados com sucesso',
      timestamp: new Date().toISOString(),
      rowsUpdated: data.rowsUpdated,
    };
  } catch (err) {
    return { success: false, message: `Falha na conexão: ${err instanceof Error ? err.message : 'erro desconhecido'}` };
  }
}

export async function syncWithSheets(token: string): Promise<SyncResult> {
  try {
    const res = await fetch('/api/sheets/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return { success: false, message: `Erro ${res.status}: ${res.statusText}` };
    }

    const data = await res.json();
    return {
      success: true,
      message: data.message || 'Sincronização concluída',
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return { success: false, message: `Falha na conexão: ${err instanceof Error ? err.message : 'erro desconhecido'}` };
  }
}
