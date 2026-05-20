// ============================================================
// DATA MODEL - TypeScript interfaces for Clínica Blue dashboard
// ============================================================

export interface Surgery {
  d: string;           // date string "DD/MM"
  mes: string;         // month name in PT
  p: string;           // patient name
  c: string;           // procedure/cirurgia
  cl: string;          // clinic/local
  v: number;           // value in BRL
  reg?: string;        // region (e.g., "EX" for exterior)
  ano?: number;        // year
}

export interface Consultation {
  d: string;           // date string "DD/MM"
  mes: string;         // month
  p: string;           // patient name
  tel: string;         // phone
  idade: number;       // age
  canal: string;       // acquisition channel
  cidade?: string;     // city
  obs?: string;        // notes
  ano?: number;        // year
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age?: number;
  city?: string;
  canal?: string;
  surgeries: Surgery[];
  consultations: Consultation[];
  lastContact?: string;
  notes?: string;
  pipelineStage?: PipelineStage;
}

export type PipelineStage =
  | 'consulta_agendada'
  | 'compareceu'
  | 'orc_pendente'
  | 'orc_apresentado'
  | 'nao_fechou'
  | 'followup_agendado'
  | 'sinal_pago'
  | 'avista_pago'
  | 'cirurgia_agendada'
  | 'perdida'
  | 'retomada';

export interface PipelineCard {
  id: string;
  patientName: string;
  phone: string;
  procedure?: string;
  value?: number;
  stage: PipelineStage;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface KPIData {
  totalSurgeries2025: number;
  totalSurgeries2026: number;
  totalRevenue2025: number;
  totalRevenue2026: number;
  totalConsultations2025: number;
  totalConsultations2026: number;
  conversionRate2025: number;
  conversionRate2026: number;
  avgTicket2025: number;
  avgTicket2026: number;
}

export interface CanalStat {
  canal: string;
  count: number;
  pct: number;
}

export interface AgeStat {
  faixa: string;
  count: number;
  pct: number;
}

export interface CityStat {
  cidade: string;
  count: number;
}

export interface FunnelData {
  label: string;
  value: number;
  pct?: number;
}

export interface MonthlyData {
  mes: string;
  cirurgias: number;
  receita: number;
  consultas: number;
}

export interface Notification {
  id: string;
  type: 'birthday' | 'followup' | 'surgery' | 'payment' | 'info';
  title: string;
  body: string;
  date: string;
  read: boolean;
}

export interface Reminder {
  id: string;
  patientName: string;
  phone: string;
  date: string;
  title: string;
  notes?: string;
  completed: boolean;
}

export interface OrcStats {
  total: number;
  aceitos: number;
  pendentes: number;
  recusados: number;
  valorTotal: number;
  valorAceito: number;
}

export interface IntlStat {
  pais: string;
  count: number;
}

export interface DashboardData {
  cir25: Surgery[];
  cir26: Surgery[];
  cons25: Consultation[];
  cons26: Consultation[];
  canal25: CanalStat[];
  canal26: CanalStat[];
  age25: AgeStat[];
  age26: AgeStat[];
  city25: CityStat[];
  city26: CityStat[];
  intl25: IntlStat[];
  intl26: IntlStat[];
  orc25: OrcStats;
  orc26: OrcStats;
}
