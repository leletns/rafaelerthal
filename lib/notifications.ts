// ============================================================
// NOTIFICATIONS - Generate dashboard notifications
// ============================================================
import type { Notification, Surgery, Consultation, PipelineCard } from './data-model';

let notifCounter = 0;
function genId(): string {
  return `notif_${Date.now()}_${++notifCounter}`;
}

export function generateSurgeryNotifications(
  cir26: Surgery[],
  todayStr: string
): Notification[] {
  const notifications: Notification[] = [];
  const today = parseDate(todayStr);
  if (!today) return notifications;

  for (const s of cir26) {
    const surgDate = parseLegacyDate(s.d, 2026);
    if (!surgDate) continue;
    const diffDays = Math.round((surgDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 7) {
      notifications.push({
        id: genId(),
        type: 'surgery',
        title: 'Cirurgia em 7 dias',
        body: `${s.p} — ${s.c} (${s.d})`,
        date: todayStr,
        read: false,
      });
    } else if (diffDays === 1) {
      notifications.push({
        id: genId(),
        type: 'surgery',
        title: 'Cirurgia AMANHÃ',
        body: `${s.p} — ${s.c} (${s.d})`,
        date: todayStr,
        read: false,
      });
    }
  }

  return notifications;
}

export function generateFollowUpNotifications(
  pipeline: PipelineCard[],
  todayStr: string
): Notification[] {
  const notifications: Notification[] = [];
  const today = parseDate(todayStr);
  if (!today) return notifications;

  const staleCutoff = new Date(today);
  staleCutoff.setDate(staleCutoff.getDate() - 7);

  for (const card of pipeline) {
    if (card.stage === 'orc_enviado') {
      const updated = new Date(card.updatedAt);
      if (updated < staleCutoff) {
        notifications.push({
          id: genId(),
          type: 'followup',
          title: 'Follow-up pendente',
          body: `${card.patientName} — sem atualização há mais de 7 dias`,
          date: todayStr,
          read: false,
        });
      }
    }
  }

  return notifications;
}

export function generateConsultationNotifications(
  cons26: Consultation[],
  todayStr: string
): Notification[] {
  const notifications: Notification[] = [];
  const today = parseDate(todayStr);
  if (!today) return notifications;

  for (const c of cons26) {
    const consDate = parseLegacyDate(c.d, 2026);
    if (!consDate) continue;
    const diffDays = Math.round((consDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      notifications.push({
        id: genId(),
        type: 'info',
        title: 'Consulta amanhã',
        body: `${c.p} — ${c.tel} (${c.d})`,
        date: todayStr,
        read: false,
      });
    }
  }

  return notifications;
}

function parseDate(str: string): Date | null {
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d;
}

function parseLegacyDate(d: string, year: number): Date | null {
  const parts = d.split('/');
  if (parts.length !== 2) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  return new Date(year, month, day);
}
