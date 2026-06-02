// ============================================================
// AMIGO CLIENT — Adapter server-side para AmigoClinic API
// Base: https://amigobot-api.amigoapp.com.br
// Auth: Bearer via env AMIGOCLINIC_API_KEY (nunca no browser)
// ============================================================

const BASE_URL = 'https://amigobot-api.amigoapp.com.br';

function headers(): HeadersInit {
  const key = process.env.AMIGOCLINIC_API_KEY;
  if (!key) throw new Error('AMIGOCLINIC_API_KEY não configurada');
  return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = `${BASE_URL}${path}${qs}`;
  const res = await fetch(url, { headers: headers(), cache: 'no-store' });
  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch { /* ignore */ }
    throw new Error(`AmigoAPI ${path} → HTTP ${res.status}${body ? ': ' + body.slice(0, 300) : ''}`);
  }
  const raw = await res.json();
  // Unwrap AmigoClinic's standard { data: T, status: 'success' } envelope
  if (raw && typeof raw === 'object' && 'status' in raw && 'data' in raw) {
    return (raw as { data: T }).data;
  }
  // Also try { result: T } envelope (some API versions)
  if (raw && typeof raw === 'object' && 'result' in raw) {
    return (raw as { result: T }).result;
  }
  return raw as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST', headers: headers(), body: JSON.stringify(body), cache: 'no-store',
  });
  if (!res.ok) {
    let errBody = '';
    try { errBody = await res.text(); } catch { /* ignore */ }
    throw new Error(`AmigoAPI POST ${path} → HTTP ${res.status}${errBody ? ': ' + errBody.slice(0, 300) : ''}`);
  }
  return res.json() as Promise<T>;
}

async function put<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT', headers: headers(), body: body ? JSON.stringify(body) : undefined, cache: 'no-store',
  });
  if (!res.ok) throw new Error(`AmigoAPI PUT ${path} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// -------------------------------------------------------
// Types
// -------------------------------------------------------
export interface AmigoPatient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  cpf?: string;
  [key: string]: unknown;
}

export interface AmigoAttendance {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  date: string;
  time?: string;
  procedure?: string;
  status?: string;
  placeId?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface AmigoDoctor {
  id: string;
  name: string;
  specialty?: string;
  [key: string]: unknown;
}

export interface AmigoPlace {
  id: string;
  name: string;
  address?: string;
  [key: string]: unknown;
}

export interface AmigoCalendarSlot {
  date: string;
  time: string;
  doctorId: string;
  available: boolean;
  [key: string]: unknown;
}

// -------------------------------------------------------
// Pacientes
// -------------------------------------------------------
export const patients = {
  getById: (patientId: string) =>
    get<AmigoPatient>(`/patients/${patientId}`),

  exists: (params: { phone?: string; email?: string; name?: string }) =>
    get<{ exists: boolean; patientId?: string }>('/patients/exists', params as Record<string, string>),

  birthday: (date?: string) =>
    get<AmigoPatient[]>('/patients/birthday', date ? { date } : undefined),

  getDoctors: (patientId: string) =>
    get<AmigoDoctor[]>(`/patients/${patientId}/doctors`),

  update: (patientId: string, data: Partial<AmigoPatient>) =>
    put<AmigoPatient>(`/patients/${patientId}`, data),

  create: (data: Omit<AmigoPatient, 'id'>) =>
    post<AmigoPatient>('/patients', data),
};

// -------------------------------------------------------
// Atendimentos (consultas agendadas)
// -------------------------------------------------------
export const attendances = {
  list: (params?: { from?: string; to?: string; doctorId?: string; status?: string }) =>
    get<AmigoAttendance[]>('/attendances', params as Record<string, string>),

  getByPatient: (patientId: string) =>
    get<AmigoAttendance[]>(`/attendances/${patientId}`),

  create: (data: Omit<AmigoAttendance, 'id'>) =>
    post<AmigoAttendance>('/attendances', data),

  cancel: (id: string) =>
    put<{ ok: boolean }>(`/attendances/cancel/${id}`),

  updateStatus: (status: string, data: { id: string; [key: string]: unknown }) =>
    put<{ ok: boolean }>(`/attendances/${status}`, data),

  reschedule: (id: string, data: { date: string; time?: string }) =>
    put<AmigoAttendance>(`/attendances/${id}/reschedule`, data),
};

// -------------------------------------------------------
// Médicos
// -------------------------------------------------------
export const doctors = {
  list: () =>
    get<AmigoDoctor[]>('/doctors'),

  available: () =>
    get<AmigoDoctor[]>('/doctors/available'),

  specialties: () =>
    get<{ id: string; name: string }[]>('/doctors/specialties'),

  availableDates: (doctorId: string, params?: { from?: string; to?: string }) =>
    get<string[]>(`/doctors/${doctorId}/available-dates`, params as Record<string, string>),
};

// -------------------------------------------------------
// Calendário
// -------------------------------------------------------
export const calendar = {
  slots: (params?: { doctorId?: string; date?: string; placeId?: string }) =>
    get<AmigoCalendarSlot[]>('/calendar', params as Record<string, string>),
};

// -------------------------------------------------------
// Convênios
// -------------------------------------------------------
export const insurances = {
  list: () =>
    get<{ id: string; name: string }[]>('/insurances'),

  plans: (insuranceGroupId: string) =>
    get<{ id: string; name: string }[]>(`/insurances/plans/${insuranceGroupId}`),
};

// -------------------------------------------------------
// Geral
// -------------------------------------------------------
export const places = {
  list: () =>
    get<AmigoPlace[]>('/places'),
};

export const events = {
  list: () =>
    get<{ id: string; name: string; [key: string]: unknown }[]>('/events'),
};
