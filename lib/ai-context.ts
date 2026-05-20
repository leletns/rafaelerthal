// ============================================================
// AI CONTEXT - Build context string for Claude AI assistant
// ============================================================
import type { Surgery, Consultation, KPIData } from './data-model';
import { computeKPIs } from './dashboard-calculations';
import { formatCurrency } from './dashboard-calculations';

export function buildAIContext(
  cir25: Surgery[],
  cir26: Surgery[],
  cons25: Consultation[],
  cons26: Consultation[]
): string {
  const kpis = computeKPIs(cir25, cir26, cons25, cons26);

  const context = `
Você é o assistente de IA do dashboard médico da Clínica Blue, especializado em ajudar o Dr. Rafael Erthal (cirurgião plástico especialista em Lipedema) a analisar seus dados clínicos e comerciais.

## Dados do Dashboard - Contexto Atual

### KPIs 2025
- Total de cirurgias: ${kpis.totalSurgeries2025}
- Receita total: ${formatCurrency(kpis.totalRevenue2025)}
- Total de consultas: ${kpis.totalConsultations2025}
- Taxa de conversão: ${kpis.conversionRate2025}%
- Ticket médio: ${formatCurrency(kpis.avgTicket2025)}

### KPIs 2026 (até agora)
- Total de cirurgias: ${kpis.totalSurgeries2026}
- Receita total: ${formatCurrency(kpis.totalRevenue2026)}
- Total de consultas: ${kpis.totalConsultations2026}
- Taxa de conversão: ${kpis.conversionRate2026}%
- Ticket médio: ${formatCurrency(kpis.avgTicket2026)}

### Informações da Clínica
- Médico: Dr. Rafael Erthal
- Especialidade: Cirurgia Plástica - Lipedema
- Locais de cirurgia: HDN (Hospital Dia Núcleo) e Clínica B
- Coordenadora comercial: Mayra
- Canais de captação: Instagram, Indicação, Google, TikTok

### Instruções
- Responda sempre em português brasileiro
- Seja preciso e direto com números e análises
- Quando analisar tendências, compare 2025 vs 2026
- Sugira ações práticas baseadas nos dados
- Se não souber algo, diga claramente
- Formate respostas com markdown quando adequado
`.trim();

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
