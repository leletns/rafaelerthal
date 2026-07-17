// ============================================================
// DATA MODEL - TypeScript interfaces for Clínica Blue dashboard
// Matches exactly the ORIGINAL data shapes from the HTML/Sheets.
// ============================================================

export interface Surgery {
  d: string;           // date string "DD/MM"
  mes: string;         // month name in PT (e.g. "Janeiro")
  p: string;           // patient name
  c: string;           // procedure/cirurgia
  cl: string;          // clinic category (e.g. "LIPEDEMA E TECNOLOGIA")
  v: number;           // value in BRL
  reg?: string;        // region (e.g. "RJ", "SP", "INTERNACIONAL")
  ano?: number;        // year
}

export interface Consultation {
  d: string;           // date string "DD/MM"
  mes: string;         // month name in PT
  p: string;           // patient name
  tel: string;         // phone
  idade: number;       // age
  canal: string;       // acquisition channel (raw text from spreadsheet)
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
  | 'orc_enviado'
  | 'sinal_pago'
  | 'followup'
  | 'cirurgia_agendada'
  | 'cirurgia_realizada'
  | 'perdida';

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

// Canal/Age/City/Intl stats: plain Record<string, number> matching the original HTML ORIGINAL object
export type CanalStats  = Record<string, number>;
export type FxStats     = Record<string, number>;   // faixa etária: "17–29", "30–40", ...
export type CidadeStats = Record<string, number>;
export type IntlStats   = Record<string, number>;

// Orçamento stats — matches the ORIGINAL.orc25 / orc26 shape
export interface OrcStats {
  total: number;
  fechou: number;     // fechou cirurgia
  nao: number;        // não fechou / recusado
  plano: number;      // plano de pagamento
  pendente: number;   // em aberto
}

export interface MonthlyData {
  mes: string;
  cirurgias: number;
  receita: number;
  consultas: number;
}

export interface FunnelData {
  label: string;
  value: number;
  pct?: number;
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

export interface DashboardData {
  cir25: Surgery[];
  cir26: Surgery[];
  cons25: Consultation[];
  cons26: Consultation[];
  // Stats objects (Record<string, number>) — matching original HTML shapes
  canal25: CanalStats;
  canal26: CanalStats;
  fx25: FxStats;
  fx26: FxStats;
  cidades25: CidadeStats;
  cidades26: CidadeStats;
  intl25: IntlStats;
  intl26: IntlStats;
  orc25: OrcStats;
  orc26: OrcStats;
  // Monthly consultation counts (from ORIGINAL.cons25_mes / cons26_mes)
  cons25_mes?: number[];
  cons26_mes?: number[];
}

// -------------------------------------------------------
// AmigoClinic live data — fetched from /api/amigo/sync
// -------------------------------------------------------
export interface AmigoAttendanceItem {
  id: string;
  patientId?: string;
  patientName?: string;
  doctorName?: string;
  date: string;
  time?: string;
  procedure?: string;
  status?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface AmigoBirthdayItem {
  id: string;
  name: string;
  birthDate?: string;
  birthdayDate?: string;  // YYYY-MM-DD: date of their birthday this year (for upcoming birthdays)
  phone?: string;
  [key: string]: unknown;
}

export interface AmigoLiveData {
  attendances?:     AmigoAttendanceItem[];  // kept for backward compat, no longer synced
  birthdays:        AmigoBirthdayItem[];    // today's birthdays
  upcomingBirthdays?: AmigoBirthdayItem[]; // next 14 days
  syncedAt?:        string;
}
