export interface DashboardSummary {
  disparosRealizados: number;
  disparosNoPeriodo: number;
  contatosInteragiram: number;
  interacoesNoPeriodo: number;
  mediaInteracoesPorContato: number;
  taxaEngajamento: number;
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

export interface Last24hSummary {
  chatsAbertos: number;
  comInteracao: number;
  taxaInteracao: number;
}

export interface DashboardConversationSource {
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
}

export interface DashboardAiTrigger {
  senderName: string;
  inboxName: string;
  inboxProvider: string;
  groupName: string;
  text: string;
  signature: string;
}

export interface DashboardAiSeed {
  schemaVersion: "dashboard-ai-seed-v1";
  generatedAt: string;
  timeZone: string;
  modelName: string;
  temperature: number;
  maxOutputTokens: number;
  trigger: DashboardAiTrigger;
  summary: DashboardSummary;
  overview: OverviewSummary;
  funil: FunnelStage[];
  conversations: DashboardConversationSource[];
}

export interface FunnelStage {
  key: string;
  label: string;
  value: number;
}

export interface ResponseHourBucket {
  hour: number; // 0–23 (no fuso configurado)
  label: string; // ex.: "08h"
  count: number; // total de respostas de leads nessa hora
}

export interface ResponseHoursSummary {
  totalRespostas: number;
  picoHour: number; // hora com mais respostas; -1 se não houver dados
  picoLabel: string; // ex.: "20h–21h" ou "—"
  picoCount: number; // respostas no horário de pico
  buckets: ResponseHourBucket[]; // sempre 24 posições (00h–23h)
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
  firstQuestion: string;
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
  aiContext?: DashboardAiSeed;
}
