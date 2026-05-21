import { NextRequest, NextResponse } from 'next/server';
import { attendances, patients, places, events } from '@/lib/amigo-client';

// -------------------------------------------------------
// Normalize AmigoClinic field names to our data model
// (API uses snake_case & alternate names)
// -------------------------------------------------------
function normalizeBirthday(p: Record<string, unknown>) {
  return {
    id:        String(p.id ?? ''),
    name:      String(p.name ?? p.patient_name ?? ''),
    phone:     String(p.contact_cellphone ?? p.phone ?? p.cellphone ?? ''),
    birthDate: String(p.born ?? p.birth_date ?? p.birthDate ?? ''),
  };
}

function normalizeAttendance(a: Record<string, unknown>) {
  return {
    id:          String(a.id ?? ''),
    patientId:   String(a.patient_id ?? a.patientId ?? ''),
    patientName: String(a.patient_name ?? a.patientName ?? a.name ?? ''),
    doctorName:  String(a.doctor_name  ?? a.doctorName  ?? ''),
    date:        String(a.date ?? a.scheduled_date ?? ''),
    time:        String(a.time ?? a.scheduled_time ?? a.hour ?? ''),
    procedure:   String(a.procedure ?? a.event_name ?? a.type ?? ''),
    status:      String(a.status ?? ''),
    notes:       String(a.notes ?? a.observation ?? ''),
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
      attendances: atts.status === 'fulfilled'
        ? (atts.value as Record<string, unknown>[]).map(normalizeAttendance)
        : [],
      birthdays: birthdays.status === 'fulfilled'
        ? (birthdays.value as Record<string, unknown>[]).map(normalizeBirthday)
        : [],
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
