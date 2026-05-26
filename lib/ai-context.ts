// ============================================================
// AI CONTEXT - Build context string for Claude AI assistant
// ============================================================
import type { Surgery, Consultation } from './data-model';
import { computeKPIs, formatCurrency } from './dashboard-calculations';

export function buildAIContext(
  cir25: Surgery[],
  cir26: Surgery[],
  cons25: Consultation[],
  cons26: Consultation[]
): string {
  const kpis = computeKPIs(cir25, cir26, cons25, cons26);

  // Compute current month same-period comparison
  const MONTH_ORDER = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const now = new Date();
  const currMonthIdx = now.getMonth();
  const currMonth = MONTH_SHORT[currMonthIdx];
  const currYear  = now.getFullYear();

  const cir25Cmp  = cir25.filter(s  => MONTH_ORDER.indexOf(s.mes)  <= currMonthIdx);
  const cons25Cmp = cons25.filter(c => MONTH_ORDER.indexOf(c.mes) <= currMonthIdx);
  const kpisCmp   = computeKPIs(cir25Cmp, cir26, cons25Cmp, cons26);

  // Top procedures 2026
  const procMap: Record<string, number> = {};
  for (const s of cir26) procMap[s.c] = (procMap[s.c] || 0) + 1;
  const topProcs = Object.entries(procMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p, n]) => `${p} (${n}×)`).join(', ');

  const context = `Você é a assistente de IA da Clínica Blue — consultório do Dr. Rafael Erthal, cirurgião plástico especialista em Lipedema, Rio de Janeiro.

Hoje: ${now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.

## Dados da clínica — ${currMonth} ${currYear}

**2026 (Jan–${currMonth}) vs 2025 (Jan–${currMonth}) — mesmo período:**
- Cirurgias: ${kpisCmp.totalSurgeries2026} vs ${kpisCmp.totalSurgeries2025} em 2025
- Receita: ${formatCurrency(kpisCmp.totalRevenue2026)} vs ${formatCurrency(kpisCmp.totalRevenue2025)}
- Consultas: ${kpisCmp.totalConsultations2026} vs ${kpisCmp.totalConsultations2025}
- Conversão: ${kpisCmp.conversionRate2026}% vs ${kpisCmp.conversionRate2025}%
- Ticket médio: ${formatCurrency(kpisCmp.avgTicket2026)} vs ${formatCurrency(kpisCmp.avgTicket2025)}

**Acumulado 2025 completo:**
- ${kpis.totalSurgeries2025} cirurgias · ${formatCurrency(kpis.totalRevenue2025)} receita · ${kpis.conversionRate2025}% conversão · ticket ${formatCurrency(kpis.avgTicket2025)}

**Procedimentos mais realizados em 2026:** ${topProcs || 'sem dados'}

## Equipe
- Dr. Rafael Erthal — Cirurgião plástico (Lipedema)
- Mayra — Coordenadora comercial (pipeline)
- Cintya — Fisioterapia (Perfeita Saúde)
- Leonardo — Financeiro / administrativo
- Locais: HDN (Hospital Dia Núcleo) e Clínica B, Rio de Janeiro

## Como responder
- Português brasileiro, tom natural e direto — não escreva como robô
- Use **negrito** para valores importantes
- Seja concisa: prefira 2–4 parágrafos curtos ou bullets a respostas longas
- Cite números reais do dashboard quando relevante
- Se não souber, diga claramente sem inventar
- Sugestões práticas são bem-vindas (ex: se conversão caiu, sugira ação)
- Não repita o contexto de volta para o usuário`;

  return context;
}

export function buildSystemPrompt(
  cir25: Surgery[],
  cir26: Surgery[],
  cons25: Consultation[],
  cons26: Consultation[]
): string {
  return buildAIContext(cir25, cir26, cons25, cons26);
}
