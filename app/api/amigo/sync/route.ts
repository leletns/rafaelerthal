import { NextRequest, NextResponse } from 'next/server';
import { attendances, patients, places, events } from '@/lib/amigo-client';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const validToken = process.env.DASHBOARD_ACCESS_TOKEN;
  if (validToken && token !== validToken && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.AMIGOCLINIC_API_KEY) {
    return NextResponse.json({
      success: true, data: null,
      message: 'AmigoClinic não configurado (AMIGOCLINIC_API_KEY ausente)',
    });
  }

  const yearStart = `${new Date().getFullYear()}-01-01`;
  const today = new Date().toISOString().split('T')[0];

  const [atts, birthdays, placesList, eventsList] = await Promise.allSettled([
    attendances.list({ from: yearStart }),
    patients.birthday(today),
    places.list(),
    events.list(),
  ]);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      attendances: atts.status === 'fulfilled' ? atts.value : [],
      birthdays:   birthdays.status === 'fulfilled' ? birthdays.value : [],
      places:      placesList.status === 'fulfilled' ? placesList.value : [],
      events:      eventsList.status === 'fulfilled' ? eventsList.value : [],
    },
    errors: {
      attendances: atts.status === 'rejected' ? (atts.reason as Error).message : null,
      birthdays:   birthdays.status === 'rejected' ? (birthdays.reason as Error).message : null,
      places:      placesList.status === 'rejected' ? (placesList.reason as Error).message : null,
      events:      eventsList.status === 'rejected' ? (eventsList.reason as Error).message : null,
    },
  });
}
