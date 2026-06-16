export interface DashboardSummary {
  disparosRealizados: number;
  disparosNoPeriodo: number;
  contatosInteragiram: number;
  interacoesNoPeriodo: number;
  mediaInteracoesPorContato: number;
  taxaEngajamento: number;
}

export interface Last24hSummary {
  chatsAbertos: number;
  comInteracao: number;
  taxaInteracao: number;
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

export interface ConversationContact extends RecentConversation {
  id: number;
  interacoes: number;
  respondeu: boolean;
  aguardandoHumano: boolean;
  disparoNoPeriodo: boolean;
  interagiuNoPeriodo: boolean;
}

export type ThreadAuthor = "contato" | "equipe" | "infinity" | "sistema";

export interface ThreadMessage {
  id: number;
  author: ThreadAuthor;
  content: string;
  time: string;
}

export interface ConversationThread {
  conversationId: number;
  patient: string;
  messages: ThreadMessage[];
}

export interface DashboardData {
  updatedAt: string;
  periodoDias: number;
  summary: DashboardSummary;
  ultimas24h: Last24hSummary;
  acumuladoDiario: AccumulatedDay[];
  topicos: TopicSummary[];
  overview: OverviewSummary;
  funil: FunnelStage[];
  conversasRecentes: RecentConversation[];
  contatos: ConversationContact[];
}
