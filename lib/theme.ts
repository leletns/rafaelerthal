// ============================================================
// TEMA — claro / escuro reais, persistidos por navegador
// ============================================================

export type Theme = 'light' | 'dark';

export const THEME_EVENT = 'mydash:themechange';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('theme', theme); } catch { /* modo privado */ }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

/** Lê uma variável de cor do tema atual (para bibliotecas que não aceitam CSS vars). */
export function readToken(name: string, fallback = '#000000'): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
