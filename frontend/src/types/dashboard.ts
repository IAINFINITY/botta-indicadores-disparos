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

export interface DashboardAiSeed {
  schemaVersion: "dashboard-ai-seed-v1";
  generatedAt: string;
  timeZone: string;
  modelName: string;
  temperature: number;
  maxOutputTokens: number;
  trigger: {
    senderName: string;
    inboxName: string;
    inboxProvider: string;
    groupName: string;
    text: string;
    signature: string;
  };
  summary: DashboardSummary;
  overview: OverviewSummary;
  funil: FunnelStage[];
  conversations: Array<{
    id: number;
    patient: string;
    status: string;
    channel: string;
    lastMessage: string;
    topic: string;
    time: string;
    triggerCreatedAt: number;
    latestActivityAt: number;
    contactMessageCount: number;
    hasContactResponse: boolean;
    waitingForHuman: boolean;
  }>;
}

export interface DashboardData {
  updatedAt: string;
  summary: DashboardSummary;
  acumuladoDiario: AccumulatedDay[];
  topicos: TopicSummary[];
  overview: OverviewSummary;
  funil: FunnelStage[];
  conversasRecentes: RecentConversation[];
  aiContext?: DashboardAiSeed;
}
