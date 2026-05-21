// ============================================================
// ANNIVERSARY — Surgery follow-up milestones (3mo, 6mo, 1yr)
// Computes upcoming post-op anniversaries from Surgery list
// ============================================================
import type { Surgery } from './data-model';

export interface SurgeryAnniversary {
  patientName: string;
  procedure: string;
  surgeryDate: string;      // original DD/MM string
  surgeryYear: number;
  milestoneMonths: number;  // 3, 6, or 12
  milestoneLabel: string;   // "3 meses", "6 meses", "1 ano"
  dueDate: Date;
  daysUntil: number;        // negative = past, 0 = today, positive = future
}

const MILESTONES = [
  { months: 3,  label: '3 meses' },
  { months: 6,  label: '6 meses' },
  { months: 12, label: '1 ano'   },
];

function parseSurgeryDate(d: string, year: number): Date | null {
  const parts = d.split('/');
  if (parts.length !== 2) return null;
  const day   = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  if (isNaN(day) || isNaN(month)) return null;
  return new Date(year, month, day);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/** Returns all milestone dates for surgeries, sorted by dueDate ascending.
 *  Pass windowDays to limit to only events within ±windowDays of today.
 */
export function computeAnniversaries(
  surgeries: Surgery[],
  year: number,
  today: Date = new Date(),
  windowDays = 90,
): SurgeryAnniversary[] {
  const result: SurgeryAnniversary[] = [];

  for (const s of surgeries) {
    const surgDate = parseSurgeryDate(s.d, year);
    if (!surgDate) continue;

    for (const ms of MILESTONES) {
      const due = addMonths(surgDate, ms.months);
      const days = daysBetween(today, due);

      if (Math.abs(days) <= windowDays) {
        result.push({
          patientName:    s.p,
          procedure:      s.c,
          surgeryDate:    s.d,
          surgeryYear:    year,
          milestoneMonths: ms.months,
          milestoneLabel:  ms.label,
          dueDate:         due,
          daysUntil:       days,
        });
      }
    }
  }

  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}

/** All milestone dates for a single patient (any window) */
export function patientAnniversaries(
  surgeries: Surgery[],
  year: number,
): SurgeryAnniversary[] {
  const today = new Date();
  return computeAnniversaries(surgeries, year, today, 99999);
}

export function formatDue(days: number): string {
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  if (days === -1) return 'Ontem';
  if (days > 0)  return `em ${days} dia${days !== 1 ? 's' : ''}`;
  return `há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`;
}
