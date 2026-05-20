import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const validToken = process.env.DASHBOARD_ACCESS_TOKEN;
  if (validToken && token !== validToken && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sheetsUrl = process.env.APPS_SCRIPT_URL;

  if (!sheetsUrl) {
    return NextResponse.json({
      success: true,
      message: 'Google Sheets not configured (APPS_SCRIPT_URL missing)',
      rowsUpdated: 0,
    });
  }

  try {
    const payload = await req.json();

    const res = await fetch(sheetsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'push', ...payload }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Sheets push failed: ${res.statusText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to reach Sheets: ${err instanceof Error ? err.message : 'unknown'}` },
      { status: 502 }
    );
  }
}
