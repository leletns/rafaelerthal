import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://amigobot-api.amigoapp.com.br';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const validToken = process.env.DASHBOARD_ACCESS_TOKEN;
  if (validToken && token !== validToken && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = process.env.AMIGOCLINIC_API_KEY;
  if (!key) {
    return NextResponse.json({
      configured: false,
      message: 'AMIGOCLINIC_API_KEY não configurada',
    });
  }

  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  // Test multiple common endpoint paths to discover the correct API structure
  const testPaths = [
    '/attendances',
    '/api/attendances',
    '/api/v1/attendances',
    '/patients',
    '/api/patients',
    '/health',
    '/api/health',
    '/',
  ];

  const results = await Promise.allSettled(
    testPaths.map(async (path) => {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers,
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      const body = await res.text().catch(() => '');
      return {
        path,
        status: res.status,
        ok: res.ok,
        body: body.slice(0, 500),
      };
    })
  );

  return NextResponse.json({
    configured: true,
    baseUrl: BASE_URL,
    keyPreview: `${key.slice(0, 8)}…`,
    tests: results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { path: testPaths[i], error: (r.reason as Error).message }
    ),
  });
}
