// ============================================================
// SAFE STORAGE - Safe localStorage wrapper with fallback
// ============================================================

const memoryFallback: Record<string, string> = {};

function isAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const key = '__test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export const safeStorage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      if (isAvailable()) {
        const raw = localStorage.getItem(key);
        if (raw === null) return defaultValue;
        return JSON.parse(raw) as T;
      }
      const raw = memoryFallback[key];
      if (raw === undefined) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      if (isAvailable()) {
        localStorage.setItem(key, serialized);
      } else {
        memoryFallback[key] = serialized;
      }
    } catch {
      memoryFallback[key] = JSON.stringify(value);
    }
  },

  remove(key: string): void {
    try {
      if (isAvailable()) {
        localStorage.removeItem(key);
      }
      delete memoryFallback[key];
    } catch {
      delete memoryFallback[key];
    }
  },

  clear(): void {
    try {
      if (isAvailable()) {
        localStorage.clear();
      }
      Object.keys(memoryFallback).forEach((k) => delete memoryFallback[k]);
    } catch {
      Object.keys(memoryFallback).forEach((k) => delete memoryFallback[k]);
    }
  },
};

// Auth helpers
export const AUTH_TOKEN_KEY = 'clinica_blue_auth';
export const PIPELINE_KEY = 'clinica_blue_pipeline';
export const REMINDERS_KEY = 'clinica_blue_reminders';
export const NOTIFICATIONS_READ_KEY = 'clinica_blue_notifications_read';

export function getAuthToken(): string | null {
  return safeStorage.get<string | null>(AUTH_TOKEN_KEY, null);
}

export function setAuthToken(token: string): void {
  safeStorage.set(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  safeStorage.remove(AUTH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
