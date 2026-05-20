// ============================================================
// AMIGO CLIENT — Server-side adapter for AmigoClinic API
// Base URL: https://amigobot-api.amigoapp.com.br
// Auth: Bearer token via AMIGOCLINIC_API_KEY env var
// ============================================================

const BASE_URL = 'https://amigobot-api.amigoapp.com.br';

function getHeaders(): HeadersInit {
  const key = process.env.AMIGOCLINIC_API_KEY;
  if (!key) throw new Error('AMIGOCLINIC_API_KEY not configured');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

async function amigoFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: getHeaders(),
    next: { revalidate: 0 }, // always fresh
  });
  if (!res.ok) {
    throw new Error(`AmigoAPI ${path} → HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// -------------------------------------------------------
// Types (expand as you discover real response shapes)
// -------------------------------------------------------
export interface AmigoPatient {
  id: string;
  name: string;
  phone?: string;
  birthDate?: string;
  email?: string;
  [key: string]: unknown;
}

export interface AmigoAppointment {
  id: string;
  patientId: string;
  patientName?: string;
  date: string;
  time?: string;
  procedure?: string;
  status?: string;
  doctorId?: string;
  [key: string]: unknown;
}

export interface AmigoSurgery {
  id: string;
  patientId: string;
  patientName?: string;
  date: string;
  procedure?: string;
  value?: number;
  clinic?: string;
  status?: string;
  [key: string]: unknown;
}

// -------------------------------------------------------
// Pacientes
// -------------------------------------------------------
export async function getPatientById(patientId: string): Promise<AmigoPatient> {
  return amigoFetch<AmigoPatient>(`/patients/${patientId}`);
}

export async function patientExists(params: {
  phone?: string;
  email?: string;
  name?: string;
}): Promise<{ exists: boolean; patientId?: string }> {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return amigoFetch(`/patients/exists?${qs}`);
}

export async function getBirthdayPatients(date?: string): Promise<AmigoPatient[]> {
  const qs = date ? `?date=${encodeURIComponent(date)}` : '';
  return amigoFetch<AmigoPatient[]>(`/patients/birthday${qs}`);
}

export async function getPatientDoctors(patientId: string): Promise<unknown[]> {
  return amigoFetch<unknown[]>(`/patients/${patientId}/doctors`);
}

// -------------------------------------------------------
// Agendamentos / Consultas
// (paths to be confirmed from full Swagger)
// -------------------------------------------------------
export async function getAppointments(params?: {
  from?: string;
  to?: string;
  doctorId?: string;
  status?: string;
}): Promise<AmigoAppointment[]> {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return amigoFetch<AmigoAppointment[]>(`/appointments${qs}`);
}

export async function getAppointmentById(id: string): Promise<AmigoAppointment> {
  return amigoFetch<AmigoAppointment>(`/appointments/${id}`);
}

// -------------------------------------------------------
// Cirurgias
// (paths to be confirmed from full Swagger)
// -------------------------------------------------------
export async function getSurgeries(params?: {
  from?: string;
  to?: string;
  doctorId?: string;
}): Promise<AmigoSurgery[]> {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return amigoFetch<AmigoSurgery[]>(`/surgeries${qs}`);
}

// -------------------------------------------------------
// Financeiro
// (paths to be confirmed from full Swagger)
// -------------------------------------------------------
export async function getFinancialSummary(params?: {
  from?: string;
  to?: string;
}): Promise<unknown> {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return amigoFetch(`/financial/summary${qs}`);
}
