import { NextRequest, NextResponse } from 'next/server';
import { attendances, patients, places, events, doctors, calendar } from '@/lib/amigo-client';

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
  // Next 14 days for calendar
  const in14 = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  const [atts, birthdays, placesList, eventsList, doctorsList, calendarSlots] = await Promise.allSettled([
    attendances.list({ from: yearStart }),
    patients.birthday(today),
    places.list(),
    events.list(),
    doctors.list(),
    calendar.slots({ date: today }),
  ]);

  // Also try to get next 7 days of calendar
  const next7Days: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(Date.now() + i * 86400000).toISOString().split('T')[0];
    next7Days.push(d);
  }
  const futureCalendar = await Promise.allSettled(
    next7Days.map(d => calendar.slots({ date: d }))
  );
  const allCalendarSlots = [
    ...(calendarSlots.status === 'fulfilled' ? calendarSlots.value : []),
    ...futureCalendar.flatMap(r => r.status === 'fulfilled' ? r.value : []),
  ];

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      attendances:    atts.status === 'fulfilled' ? atts.value : [],
      birthdays:      birthdays.status === 'fulfilled' ? birthdays.value : [],
      places:         placesList.status === 'fulfilled' ? placesList.value : [],
      events:         eventsList.status === 'fulfilled' ? eventsList.value : [],
      doctors:        doctorsList.status === 'fulfilled' ? doctorsList.value : [],
      calendarSlots:  allCalendarSlots,
    },
    errors: {
      attendances: atts.status === 'rejected' ? (atts.reason as Error).message : null,
      birthdays:   birthdays.status === 'rejected' ? (birthdays.reason as Error).message : null,
    },
  });
}
