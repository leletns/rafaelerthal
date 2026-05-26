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

/** Extract significant name tokens (>2 chars, no stop words) */
function nameTokens(name: string): string[] {
  const stop = new Set(['dos', 'das', 'des', 'del', 'von', 'van', 'de', 'da', 'do', 'di', 'e']);
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2 && !stop.has(t));
}

/** Fuzzy same-person check: ≥2 significant tokens in common */
function isSamePerson(a: string, b: string): boolean {
  const tokA = new Set(nameTokens(a));
  const tokB = nameTokens(b);
  return tokB.filter(t => tokA.has(t)).length >= 2;
}

export function normalizePhone(phone: string): string {
  if (!phone) return '';
  // Strip + prefix and whitespace
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  // Strip leading 00 (international dialing prefix)
  if (digits.startsWith('00')) digits = digits.slice(2);
  // Already has full international country code (12+ digits)
  if (digits.length >= 12) return digits;
  // Brazilian mobile: 11 digits (DDD + 9 + 8 digits)
  if (digits.length === 11) return `55${digits}`;
  // Brazilian landline: 10 digits (DDD + 8 digits)
  if (digits.length === 10) return `55${digits}`;
  // Anything else — return as-is
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
  // Use an array for fuzzy O(n) lookup instead of exact-slug Map
  const patients: Patient[] = [];

  function findPatient(name: string): Patient | undefined {
    const tokensB = nameTokens(name);
    const setB = new Set(tokensB);
    return patients.find(p => {
      const tokA = nameTokens(p.name);
      return tokA.filter(t => setB.has(t)).length >= 2;
    });
  }

  // First pass: surgeries
  for (const s of surgeries) {
    let patient = findPatient(s.p);
    if (!patient) {
      patient = {
        id: slugify(s.p),
        name: s.p,
        phone: '',
        surgeries: [],
        consultations: [],
      };
      patients.push(patient);
    } else {
      // Keep the most complete (longer) name
      if (s.p.length > patient.name.length) patient.name = s.p;
    }
    patient.surgeries.push(s);
  }

  // Second pass: consultations
  for (const c of consultations) {
    let patient = findPatient(c.p);
    if (!patient) {
      patient = {
        id: slugify(c.p),
        name: c.p,
        phone: normalizePhone(c.tel),
        age: c.idade,
        city: c.cidade,
        canal: c.canal,
        surgeries: [],
        consultations: [],
      };
      patients.push(patient);
    } else {
      // Keep longer name
      if (c.p.length > patient.name.length) patient.name = c.p;
    }
    const patient_ = patient;
    if (!patient_.phone && c.tel) patient_.phone = normalizePhone(c.tel);
    if (!patient_.age && c.idade) patient_.age = c.idade;
    if (!patient_.city && c.cidade) patient_.city = c.cidade;
    if (!patient_.canal && c.canal) patient_.canal = c.canal;
    patient_.consultations.push(c);
  }

  return patients.sort((a, b) => a.name.localeCompare(b.name));
}
