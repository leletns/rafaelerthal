// ============================================================
// COMMERCIAL INTEL — Inteligência para o time comercial
//
// 1. buildAnniversaryMessage(): rascunho humanizado de parabéns
//    por marco de pós-operatório, pronto para WhatsApp/e-mail.
// 2. classifyPatientValue(): tag de LTV/recorrência do paciente.
// 3. buildAttentionQueue(): fila de "Atenção Imediata" — cruza
//    mesversários, aniversários, pipeline e comprovantes lidos
//    pelo OCR, ordenando leads por prioridade (score), não por
//    ordem alfabética.
// ============================================================
import { differenceInCalendarDays, startOfDay } from 'date-fns';
import type { Surgery, Consultation, PipelineCard, AmigoBirthdayItem } from './data-model';
import type { SurgeryAnniversary } from './anniversary';
import { daysUntilISODate } from './anniversary';
import { safeStorage } from './safe-storage';

// ─────────────────────────────────────────────────────────────
// 1. Smart Follow-up Trigger — mensagens humanizadas
// ─────────────────────────────────────────────────────────────

function firstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/**
 * Gera um rascunho de mensagem de parabéns personalizada por marco
 * de pós-operatório. Tom humano, sem cara de template automático.
 */
export function buildAnniversaryMessage(a: SurgeryAnniversary): string {
  const name = firstName(a.patientName);

  const byMilestone: Record<number, string> = {
    3: `Oi ${name}, tudo bem? Aqui é da equipe do Dr. Rafael Erthal, da Clínica Blue. Hoje completam 3 meses da sua cirurgia e queríamos saber como você está se sentindo com os resultados até aqui. Se surgiu qualquer dúvida sobre a recuperação, é só nos chamar — estamos à disposição.`,
    6: `Oi ${name}! Passando para comemorar com você: já são 6 meses desde a sua cirurgia na Clínica Blue. Essa é uma ótima fase para avaliarmos juntos a evolução do resultado. Se quiser agendar um retorno com o Dr. Rafael, é só responder por aqui.`,
    12: `${name}, hoje é um dia especial: 1 ano da sua cirurgia com o Dr. Rafael Erthal! Toda a equipe da Clínica Blue celebra essa conquista com você. Adoraríamos ver como está o resultado — que tal agendar sua avaliação anual? Conte com a gente sempre.`,
  };

  if (byMilestone[a.milestoneMonths]) return byMilestone[a.milestoneMonths];

  const years = Math.round(a.milestoneMonths / 12);
  return `${name}, hoje completam ${years} anos da sua cirurgia com o Dr. Rafael Erthal — uma data que celebramos junto com você! A equipe da Clínica Blue está à disposição para sua avaliação de acompanhamento e para os cuidados de manutenção do seu resultado. Um abraço!`;
}

/** Mensagem de aniversário (nascimento) do paciente. */
export function buildBirthdayMessage(patientName: string): string {
  const name = firstName(patientName);
  return `${name}, feliz aniversário! O Dr. Rafael Erthal e toda a equipe da Clínica Blue desejam um dia maravilhoso e um novo ciclo cheio de saúde. Conte sempre com a gente!`;
}

// ─────────────────────────────────────────────────────────────
// 2. Indicador de LTV e Recorrência
// ─────────────────────────────────────────────────────────────

export interface ValueTag {
  label: string;
  tone: 'high' | 'medium' | 'neutral';
  /** Explicação exibida em tooltip. */
  reason: string;
}

const HIGH_LTV_THRESHOLD = 45000;

/**
 * Classifica o potencial de LTV/recorrência de um paciente a partir
 * do histórico de cirurgias e consultas.
 */
export function classifyPatientValue(
  patientName: string,
  surgeries: Surgery[],
  consultations: Consultation[] = [],
): ValueTag | null {
  const key = patientName.toLowerCase().trim();
  const mine = surgeries.filter((s) => s.p.toLowerCase().trim() === key);
  if (mine.length === 0) return null;

  const revenue = mine.reduce((acc, s) => acc + s.v, 0);
  const visits = consultations.filter((c) => c.p.toLowerCase().trim() === key).length;

  if (mine.length >= 2) {
    return {
      label: 'Recorrente',
      tone: 'high',
      reason: `${mine.length} cirurgias · ${formatBRL(revenue)} em receita`,
    };
  }
  if (revenue >= HIGH_LTV_THRESHOLD) {
    return {
      label: 'Alto LTV',
      tone: 'high',
      reason: `${formatBRL(revenue)} em procedimentos — priorizar relacionamento`,
    };
  }
  // Lipedema costuma exigir manutenção clínica (tecnologias, fisio, retoques)
  const lipedema = mine.some((s) => s.cl.toLowerCase().includes('lipedema'));
  if (lipedema) {
    return {
      label: 'Potencial manutenção',
      tone: 'medium',
      reason: 'Pós-op de Lipedema — candidata a tratamentos de manutenção',
    };
  }
  if (visits >= 2) {
    return {
      label: 'Engajada',
      tone: 'medium',
      reason: `${visits} consultas registradas — relacionamento ativo`,
    };
  }
  return null;
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

// ─────────────────────────────────────────────────────────────
// 3. Filtro de "Atenção Imediata" — fila priorizada
// ─────────────────────────────────────────────────────────────

export interface AttentionItem {
  patientName: string;
  phone: string;
  score: number;
  reasons: string[];
  tag: ValueTag | null;
  /** Rascunho de mensagem pronto para a ação rápida. */
  message: string;
}

/** Comprovante salvo pelo fluxo de OCR (EquipePane / OcrScanner). */
interface OcrReceipt {
  pagador?: string;
  valor?: string;
  uploadedAt: string;
}

const RECEIPTS_KEY = 'equipe_receipts_v1';

/** Matching tolerante de nomes (≥2 tokens significativos em comum). */
function nameTokens(name: string): string[] {
  const stop = new Set(['dos', 'das', 'de', 'da', 'do', 'di', 'e']);
  return name.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/).filter((t) => t.length > 2 && !stop.has(t));
}

export function isSamePerson(a: string, b: string): boolean {
  const tokA = new Set(nameTokens(a));
  return nameTokens(b).filter((t) => tokA.has(t)).length >= 2;
}

interface AttentionInput {
  anniversaries: SurgeryAnniversary[];
  birthdaysToday: AmigoBirthdayItem[];
  pipeline: PipelineCard[];
  surgeries: Surgery[];
  consultations: Consultation[];
  phoneByName: (name: string) => string;
  today?: Date;
}

/**
 * Cruza todas as fontes (mesversários, aniversários, pipeline e
 * pagamentos detectados pelo OCR) e devolve os leads que precisam
 * de contato hoje, ordenados por prioridade decrescente.
 */
export function buildAttentionQueue({
  anniversaries,
  birthdaysToday,
  pipeline,
  surgeries,
  consultations,
  phoneByName,
  today = new Date(),
}: AttentionInput): AttentionItem[] {
  const items = new Map<string, AttentionItem>();
  const todayStart = startOfDay(today);

  function upsert(name: string, points: number, reason: string, message?: string) {
    const key = name.toLowerCase().trim();
    const existing = items.get(key);
    if (existing) {
      existing.score += points;
      if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
      if (message && !existing.message) existing.message = message;
      return;
    }
    const tag = classifyPatientValue(name, surgeries, consultations);
    items.set(key, {
      patientName: name,
      phone: phoneByName(name),
      score: points + (tag?.tone === 'high' ? 25 : tag?.tone === 'medium' ? 10 : 0),
      reasons: [reason],
      tag,
      message: message ?? '',
    });
  }

  // Mesversários — quanto mais próximo, maior a prioridade
  for (const a of anniversaries) {
    if (a.daysUntil === 0) {
      upsert(a.patientName, 50, `${a.milestoneLabel} de pós-op hoje`, buildAnniversaryMessage(a));
    } else if (a.daysUntil > 0 && a.daysUntil <= 3) {
      upsert(a.patientName, 25, `${a.milestoneLabel} de pós-op ${a.daysUntil === 1 ? 'amanhã' : `em ${a.daysUntil} dias`}`, buildAnniversaryMessage(a));
    }
  }

  // Aniversários de nascimento hoje (AmigoClinic)
  for (const b of birthdaysToday) {
    const days = b.birthdayDate ? daysUntilISODate(b.birthdayDate, today) : 0;
    if (days === 0 || days === null) {
      upsert(b.name, 40, 'Aniversário hoje', buildBirthdayMessage(b.name));
    }
  }

  // Pipeline comercial — sinal pago espera agendamento; orçamento espera resposta
  for (const card of pipeline) {
    if (card.stage === 'sinal_pago') {
      upsert(card.patientName, 30, 'Sinal pago — agendar cirurgia');
    } else if (card.stage === 'followup') {
      upsert(card.patientName, 20, 'Follow-up comercial pendente');
    } else if (card.stage === 'orc_enviado' && card.value && card.value >= HIGH_LTV_THRESHOLD) {
      upsert(card.patientName, 25, `Orçamento alto em aberto (${formatBRL(card.value)})`);
    }
  }

  // OCR × banco de dados: pagador de comprovante recente que é
  // paciente/lead conhecido → pagamento em andamento, contato quente.
  const receipts = safeStorage.get<OcrReceipt[]>(RECEIPTS_KEY, []);
  const knownNames = new Set<string>([
    ...surgeries.map((s) => s.p),
    ...consultations.map((c) => c.p),
    ...pipeline.map((p) => p.patientName),
  ]);
  const knownList = Array.from(knownNames);
  for (const r of receipts) {
    if (!r.pagador) continue;
    const age = differenceInCalendarDays(todayStart, startOfDay(new Date(r.uploadedAt)));
    if (isNaN(age) || age > 7) continue;
    const match = knownList.find((n) => isSamePerson(n, r.pagador!));
    if (match) {
      upsert(match, 35, `Pagamento detectado via OCR${r.valor ? ` (${r.valor})` : ''} — confirmar recebimento`);
    }
  }

  return Array.from(items.values())
    .filter((i) => i.score >= 30)
    .sort((a, b) => b.score - a.score);
}
