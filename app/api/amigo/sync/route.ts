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

  // Fetch birthdays for today + next 14 days (15 calls total)
  const today = new Date().toISOString().split('T')[0];
  const dateRange = Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

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
