// ── /api/amigo/test — diagnoses the AmigoClinic connection ──────────────────
// Returns raw API response + headers + errors. Used for admin debugging.
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://amigobot-api.amigoapp.com.br';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const validToken = process.env.DASHBOARD_ACCESS_TOKEN;
  if (validToken && token !== validToken && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = process.env.AMIGOCLINIC_API_KEY;
  if (!key) {
    return NextResponse.json({
      ok: false,
      stage: 'env',
      error: 'AMIGOCLINIC_API_KEY não está definida no ambiente do servidor',
      hint: 'Verifique o .env.local (dev) ou as variáveis de ambiente do Vercel (prod)',
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const tests: Record<string, { url: string; ok: boolean; status?: number; body?: unknown; error?: string }> = {};

  // Test 1: birthday endpoint (lightweight)
  try {
    const url = `${BASE_URL}/patients/birthday?date=${today}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    let body: unknown;
    try { body = await res.json(); } catch { body = await res.text(); }
    tests.birthday = { url, ok: res.ok, status: res.status, body };
  } catch (e) {
    tests.birthday = { url: `${BASE_URL}/patients/birthday?date=${today}`, ok: false, error: (e as Error).message };
  }

  // Test 2: attendances (year start → today)
  const yearStart = `${new Date().getFullYear()}-01-01`;
  try {
    const url = `${BASE_URL}/attendances?from=${yearStart}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    let body: unknown;
    try { body = await res.json(); } catch { body = await res.text(); }
    // Don't include full array in response — just count and sample
    const arr = Array.isArray(body) ? body : (body as { data?: unknown[] })?.data;
    tests.attendances = {
      url, ok: res.ok, status: res.status,
      body: Array.isArray(arr)
        ? { count: arr.length, sample: arr.slice(0, 2) }
        : body,
    };
  } catch (e) {
    tests.attendances = { url: `${BASE_URL}/attendances?from=${yearStart}`, ok: false, error: (e as Error).message };
  }

  const allOk = Object.values(tests).every(t => t.ok);
  return NextResponse.json({
    ok: allOk,
    apiKey: `${key.slice(0, 4)}…${key.slice(-4)} (${key.length} chars)`,
    baseUrl: BASE_URL,
    tests,
    hint: allOk
      ? 'Conexão com AmigoClinic OK ✓'
      : 'Verifique: chave incorreta → HTTP 401 | endpoint errado → HTTP 404 | bloqueado → network error',
  });
}
