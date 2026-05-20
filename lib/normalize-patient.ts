// ============================================================
// NORMALIZE PATIENT - Functions to normalize and merge patient records
// ============================================================
import type { Surgery, Consultation, Patient } from './data-model';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `55${digits}`;
  }
  if (digits.length === 13 && digits.startsWith('55')) {
    return digits;
  }
  return digits;
}

export function normalizePatient(
  name: string,
  phone: string,
  extra?: Partial<Patient>
): Patient {
  const id = slugify(name) + '_' + normalizePhone(phone).slice(-4);
  return {
    id,
    name,
    phone: normalizePhone(phone),
    surgeries: [],
    consultations: [],
    ...extra,
  };
}

export function mergePatientRecords(
  surgeries: Surgery[],
  consultations: Consultation[]
): Patient[] {
  const map = new Map<string, Patient>();

  // Index by name (normalized)
  for (const s of surgeries) {
    const key = slugify(s.p);
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: s.p,
        phone: '',
        surgeries: [],
        consultations: [],
      });
    }
    map.get(key)!.surgeries.push(s);
  }

  for (const c of consultations) {
    const key = slugify(c.p);
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: c.p,
        phone: normalizePhone(c.tel),
        age: c.idade,
        city: c.cidade,
        canal: c.canal,
        surgeries: [],
        consultations: [],
      });
    }
    const patient = map.get(key)!;
    // Merge phone if not set
    if (!patient.phone && c.tel) {
      patient.phone = normalizePhone(c.tel);
    }
    if (!patient.age && c.idade) {
      patient.age = c.idade;
    }
    if (!patient.city && c.cidade) {
      patient.city = c.cidade;
    }
    if (!patient.canal && c.canal) {
      patient.canal = c.canal;
    }
    patient.consultations.push(c);
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}
