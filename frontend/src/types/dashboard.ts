export interface DashboardSummary {
  disparosRealizados: number;
  contatosInteragiram: number;
  mediaInteracoesPorContato: number;
  taxaEngajamento: number;
}

export interface AccumulatedDay {
  day: string;
  novasConversas: number;
  acumulado: number;
}

export interface TopicSummary {
  name: string;
  share: number;
  resume: string;
}

export interface OverviewSummary {
  totalConversas: number;
  respondidas: number;
  aguardandoHumano: number;
  oportunidades: number;
}

export interface FunnelStage {
  label: string;
  value: number;
}

export interface RecentConversation {
  patient: string;
  status: string;
  channel: string;
  lastMessage: string;
  topic: string;
  time: string;
}

export interface DashboardData {
  updatedAt: string;
  summary: DashboardSummary;
  acumuladoDiario: AccumulatedDay[];
  topicos: TopicSummary[];
  overview: OverviewSummary;
  funil: FunnelStage[];
  conversasRecentes: RecentConversation[];
}
