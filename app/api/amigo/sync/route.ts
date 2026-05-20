import { NextRequest, NextResponse } from 'next/server';
import {
  getAppointments,
  getSurgeries,
  getBirthdayPatients,
} from '@/lib/amigo-client';

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

  if (!process.env.AMIGOCLINIC_API_KEY) {
    return NextResponse.json({
      success: true,
      data: null,
      message: 'AmigoClinic not configured (AMIGOCLINIC_API_KEY missing)',
    });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const yearStart = `${new Date().getFullYear()}-01-01`;

    const [appointments, surgeries, birthdays] = await Promise.allSettled([
      getAppointments({ from: yearStart }),
      getSurgeries({ from: yearStart }),
      getBirthdayPatients(today),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        appointments: appointments.status === 'fulfilled' ? appointments.value : [],
        surgeries: surgeries.status === 'fulfilled' ? surgeries.value : [],
        birthdays: birthdays.status === 'fulfilled' ? birthdays.value : [],
      },
      errors: {
        appointments: appointments.status === 'rejected' ? appointments.reason?.message : null,
        surgeries: surgeries.status === 'rejected' ? surgeries.reason?.message : null,
        birthdays: birthdays.status === 'rejected' ? birthdays.reason?.message : null,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `AmigoClinic sync failed: ${err instanceof Error ? err.message : 'unknown'}` },
      { status: 502 }
    );
  }
}
