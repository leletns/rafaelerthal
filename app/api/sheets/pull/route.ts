import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
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
    // Return empty data when not configured
    return NextResponse.json({
      success: true,
      data: null,
      message: 'Google Sheets not configured (APPS_SCRIPT_URL missing)',
    });
  }

  const appsScriptToken = process.env.APPS_SCRIPT_TOKEN || '';
  const tokenParam = appsScriptToken ? `&token=${encodeURIComponent(appsScriptToken)}` : '';

  try {
    const res = await fetch(`${sheetsUrl}?action=pull${tokenParam}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Sheets fetch failed: ${res.statusText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to reach Sheets: ${err instanceof Error ? err.message : 'unknown'}` },
      { status: 502 }
    );
  }
}
