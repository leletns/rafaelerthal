import { NextRequest, NextResponse } from 'next/server';
import { patients } from '@/lib/amigo-client';

// ── Normalize AmigoClinic birthday fields ────────────────────────────────────
function normalizeBirthday(p: Record<string, unknown>, birthdayDate?: string) {
  return {
    id:           String(p.id ?? ''),
    name:         String(p.name ?? p.patient_name ?? ''),
    phone:        String(p.contact_cellphone ?? p.phone ?? p.cellphone ?? ''),
    birthDate:    String(p.born ?? p.birth_date ?? p.birthDate ?? ''),
    birthdayDate: birthdayDate ?? null,
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

  // Fetch birthdays for today + next 14 days (15 calls total).
  // Dates must be computed in the clinic's timezone — the server runs in UTC,
  // and toISOString() would flip to the next day at 21h no Brasil.
  const spDate = (offsetDays: number) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(Date.now() + offsetDays * 86400000));
  const today = spDate(0);
  const dateRange = Array.from({ length: 15 }, (_, i) => spDate(i));

  const results = await Promise.allSettled(
    dateRange.map(d => patients.birthday(d))
  );

  const todayResult  = results[0];
  const futureResults = results.slice(1);

  const todayBirthdays = todayResult.status === 'fulfilled'
    ? (todayResult.value as Record<string, unknown>[]).map(p => normalizeBirthday(p, today))
    : [];

  const upcomingBirthdays = futureResults.flatMap((r, i) =>
    r.status === 'fulfilled'
      ? (r.value as Record<string, unknown>[]).map(p => normalizeBirthday(p, dateRange[i + 1]))
      : []
  );

  const firstError = todayResult.status === 'rejected'
    ? (todayResult.reason as Error).message
    : null;

  if (firstError) {
    console.error('[amigo/sync] birthday error:', firstError);
  }

  const totalBirthdays = todayBirthdays.length + upcomingBirthdays.length;

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    firstError,
    data: {
      birthdays:         todayBirthdays,
      upcomingBirthdays,
    },
    meta: {
      totalBirthdays,
      daysChecked: 15,
    },
  });
}
