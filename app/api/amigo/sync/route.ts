import { NextRequest, NextResponse } from 'next/server';
import { attendances, patients, places, events, doctors, calendar } from '@/lib/amigo-client';

/** Normalise a raw AmigoClinic patient/birthday record to our schema */
function normalizeBirthday(p: Record<string, unknown>) {
  return {
    id:        p.id,
    name:      p.name ?? p.patient_name ?? '',
    phone:     p.contact_cellphone ?? p.phone ?? p.cellphone ?? null,
    birthDate: p.born ?? p.birth_date ?? p.birthDate ?? null,
  };
}

/** Normalise a raw AmigoClinic attendance record to our schema */
function normalizeAttendance(a: Record<string, unknown>) {
  return {
    id:          a.id,
    patientId:   a.patient_id ?? a.patientId ?? null,
    patientName: a.patient_name ?? a.patientName ?? a.name ?? null,
    doctorName:  a.doctor_name ?? a.doctorName ?? null,
    date:        a.date ?? a.scheduled_date ?? null,
    time:        a.time ?? a.scheduled_time ?? a.hour ?? null,
    procedure:   a.procedure ?? a.event_name ?? a.type ?? null,
    status:      a.status ?? null,
    notes:       a.notes ?? a.observation ?? null,
  };
}

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

  const [atts, birthdays, placesList, eventsList, doctorsList, calendarSlots] = await Promise.allSettled([
    attendances.list({ from: yearStart }),
    patients.birthday(today),
    places.list(),
    events.list(),
    doctors.list(),
    calendar.slots({ date: today }),
  ]);

  // Next 7 days of calendar slots
  const next7Days: string[] = [];
  for (let i = 1; i <= 7; i++) {
    next7Days.push(new Date(Date.now() + i * 86400000).toISOString().split('T')[0]);
  }
  const futureCalendar = await Promise.allSettled(
    next7Days.map(d => calendar.slots({ date: d }))
  );
  const allCalendarSlots = [
    ...(calendarSlots.status === 'fulfilled' ? (calendarSlots.value as unknown[]) : []),
    ...futureCalendar.flatMap(r => r.status === 'fulfilled' ? (r.value as unknown[]) : []),
  ];

  const rawAtts  = atts.status === 'fulfilled'      ? (atts.value      as Record<string, unknown>[]) : [];
  const rawBdays = birthdays.status === 'fulfilled' ? (birthdays.value as Record<string, unknown>[]) : [];

  const normalizedAtts  = Array.isArray(rawAtts)  ? rawAtts.map(normalizeAttendance)  : [];
  const normalizedBdays = Array.isArray(rawBdays) ? rawBdays.map(normalizeBirthday) : [];

  // Today filter
  const todayAtts = normalizedAtts.filter(a => {
    if (!a.date) return false;
    const d = String(a.date);
    if (d.startsWith(today)) return true;
    const parts = d.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}` === today;
    }
    return false;
  });

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      attendances:      normalizedAtts,
      todayAttendances: todayAtts,
      birthdays:        normalizedBdays,
      places:           placesList.status === 'fulfilled'  ? placesList.value  : [],
      events:           eventsList.status === 'fulfilled'  ? eventsList.value  : [],
      doctors:          doctorsList.status === 'fulfilled' ? doctorsList.value : [],
      calendarSlots:    allCalendarSlots,
    },
    errors: {
      attendances: atts.status === 'rejected'         ? (atts.reason      as Error).message : null,
      birthdays:   birthdays.status === 'rejected'    ? (birthdays.reason as Error).message : null,
      calendar:    calendarSlots.status === 'rejected' ? (calendarSlots.reason as Error).message : null,
    },
  });
}
