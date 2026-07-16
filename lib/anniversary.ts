// ============================================================
// ANNIVERSARY — Marcos de pós-operatório (3m, 6m, 1 ano, 2 anos…)
//
// Correções de precisão nesta versão (bugs reais em produção):
//
// 1. Comparação por DIA DE CALENDÁRIO (differenceInCalendarDays),
//    não por diferença de milissegundos arredondada. Antes, um
//    mesversário de HOJE aparecia como "ontem" depois do meio-dia,
//    porque (meia-noite do marco − agora 13h) = −0,54 dia ≈ −1.
//
// 2. Aritmética de meses com clamp (date-fns addMonths): cirurgia
//    em 31/01 + 3 meses = 30/04, e não 01/05 como o setMonth nativo
//    fazia por overflow. 30/11 + 3 meses = 28/02 (ou 29 em bissexto).
//
// 3. Parsing de datas ISO "YYYY-MM-DD" SEMPRE como data local.
//    new Date('2026-07-03') é interpretado como UTC e, no fuso do
//    Brasil (UTC−3), vira 02/07 às 21h — deslocando tudo em 1 dia.
//    Use parseISODateLocal() em qualquer string ISO vinda de API.
//
// 4. Marcos anuais ilimitados: quem operou em 10/05/2023 gera
//    "1 ano" em 10/05/2024, "2 anos" em 10/05/2025, "3 anos" em
//    10/05/2026 — sempre na data exata.
// ============================================================
import { addMonths, differenceInCalendarDays, format, isValid, startOfDay } from 'date-fns';
import type { Surgery } from './data-model';

export interface SurgeryAnniversary {
  patientName: string;
  procedure: string;
  surgeryDate: string;      // original DD/MM string
  surgeryYear: number;
  milestoneMonths: number;  // 3, 6, 12, 24, 36…
  milestoneLabel: string;   // "3 meses", "6 meses", "1 ano", "2 anos"…
  dueDate: Date;
  dueDateLabel: string;     // "dd/MM/yyyy" — data exata do marco
  daysUntil: number;        // negativo = passado, 0 = hoje, positivo = futuro
}

/** Parse "YYYY-MM-DD" (ou ISO completo) como data LOCAL, nunca UTC. */
export function parseISODateLocal(iso: string): Date | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isValid(d) ? d : null;
}

/** Dias de calendário até uma data ISO ("YYYY-MM-DD"), timezone-safe. */
export function daysUntilISODate(iso: string, today: Date = new Date()): number | null {
  const target = parseISODateLocal(iso);
  if (!target) return null;
  return differenceInCalendarDays(target, startOfDay(today));
}

/** Parse "DD/MM" + ano em data local. Rejeita valores inválidos (ex.: 31/02). */
function parseSurgeryDate(d: string, year: number): Date | null {
  const m = d.trim().match(/^(\d{1,2})\/(\d{1,2})/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]) - 1;
  const date = new Date(year, month, day);
  // new Date(2025, 1, 31) "funciona" mas vira 3 de março — rejeitar
  if (!isValid(date) || date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
}

function milestoneLabel(months: number): string {
  if (months < 12) return `${months} meses`;
  const years = months / 12;
  return years === 1 ? '1 ano' : `${years} anos`;
}

/** Marcos gerados por cirurgia: 3m, 6m e anuais (1..N anos). */
function milestonesFor(surgeryDate: Date, today: Date): number[] {
  const base = [3, 6];
  // Anos completos possíveis até (hoje + 1 ano), para cobrir janelas futuras
  const elapsedYears = Math.max(
    1,
    Math.ceil(differenceInCalendarDays(today, surgeryDate) / 365) + 1
  );
  for (let y = 1; y <= elapsedYears; y++) base.push(y * 12);
  return base;
}

/** Retorna os marcos de todas as cirurgias dentro de ±windowDays de hoje,
 *  ordenados por proximidade (daysUntil ascendente).
 */
export function computeAnniversaries(
  surgeries: Surgery[],
  year: number,
  today: Date = new Date(),
  windowDays = 90,
): SurgeryAnniversary[] {
  const todayStart = startOfDay(today);
  const result: SurgeryAnniversary[] = [];

  for (const s of surgeries) {
    const surgYear = s.ano ?? year;
    const surgDate = parseSurgeryDate(s.d, surgYear);
    if (!surgDate) continue;

    for (const months of milestonesFor(surgDate, todayStart)) {
      const due = startOfDay(addMonths(surgDate, months));
      const days = differenceInCalendarDays(due, todayStart);

      if (Math.abs(days) <= windowDays) {
        result.push({
          patientName:     s.p,
          procedure:       s.c,
          surgeryDate:     s.d,
          surgeryYear:     surgYear,
          milestoneMonths: months,
          milestoneLabel:  milestoneLabel(months),
          dueDate:         due,
          dueDateLabel:    format(due, 'dd/MM/yyyy'),
          daysUntil:       days,
        });
      }
    }
  }

  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Todos os marcos de um paciente (janela ampla). */
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
