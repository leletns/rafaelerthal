import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body as { token?: string };

    if (!token) {
      return NextResponse.json({ error: 'Token not provided' }, { status: 400 });
    }

    const validToken = process.env.DASHBOARD_ACCESS_TOKEN;

    if (!validToken) {
      // In development without env var, accept any non-empty token
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (token === validToken) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
