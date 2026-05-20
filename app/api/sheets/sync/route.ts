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
    });
  }

  try {
    // Pull from sheets first
    const pullRes = await fetch(`${sheetsUrl}?action=pull`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!pullRes.ok) {
      return NextResponse.json(
        { error: `Sheets sync pull failed: ${pullRes.statusText}` },
        { status: 502 }
      );
    }

    const sheetsData = await pullRes.json();

    return NextResponse.json({
      success: true,
      message: 'Sincronização concluída',
      data: sheetsData,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Sync failed: ${err instanceof Error ? err.message : 'unknown'}` },
      { status: 502 }
    );
  }
}
