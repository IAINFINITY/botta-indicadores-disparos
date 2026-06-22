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

export interface QuestionSummary {
  question: string;
  topic: string;
  count: number;
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

export interface ResponseHourBucket {
  hour: number;
  label: string;
  count: number;
}

export interface ResponseHoursSummary {
  totalRespostas: number;
  picoHour: number;
  picoLabel: string;
  picoCount: number;
  buckets: ResponseHourBucket[];
}

export interface RecentConversation {
  id: number;
  patient: string;
  status: string;
  channel: string;
  lastMessage: string;
  topic: string;
  time: string;
}

export interface ConversationContact extends RecentConversation {
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
  questionamentos: QuestionSummary[];
  overview: OverviewSummary;
  funil: FunnelStage[];
  conversasRecentes: RecentConversation[];
  contatos: ConversationContact[];
  horariosResposta: ResponseHoursSummary;
}
