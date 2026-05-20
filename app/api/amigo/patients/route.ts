import { NextRequest, NextResponse } from 'next/server';
import { patients } from '@/lib/amigo-client';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const validToken = process.env.DASHBOARD_ACCESS_TOKEN;
  if (validToken && token !== validToken && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.AMIGOCLINIC_API_KEY) {
    return NextResponse.json({ success: true, data: null, message: 'AmigoClinic não configurado' });
  }

  const { searchParams } = new URL(req.url);
  const id    = searchParams.get('id');
  const phone = searchParams.get('phone');
  const name  = searchParams.get('name');

  try {
    if (id) {
      const patient = await patients.getById(id);
      return NextResponse.json({ success: true, data: patient });
    }

    if (phone || name) {
      const result = await patients.exists({
        phone: phone ?? undefined,
        name: name ?? undefined,
      });
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: 'Informe id, phone ou name' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown' },
      { status: 502 }
    );
  }
}
