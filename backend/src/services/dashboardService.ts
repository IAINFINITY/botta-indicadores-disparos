import type {
  AccumulatedDay,
  ConversationContact,
  ConversationThread,
  DashboardAiSeed,
  DashboardData,
  FunnelStage,
  Last24hSummary,
  RecentConversation,
  ResponseHoursSummary,
  ThreadAuthor,
  ThreadMessage,
  QuestionSummary,
} from "../types/dashboard.js";
import { buildDashboardAiSeed, getAiConfig } from "../ai/index.js";
import { createChatwootClient, type ChatwootConversationSummary, type ChatwootMessage } from "./chatwootClient.js";

const TRIGGER_MESSAGE_TEXT = `
Você acaba de ter acesso a algo que a maioria das pessoas nunca teve — um especialista em saúde disponível 24 horas, direto no seu WhatsApp.

Uma inteligência artificial criada para te ajudar a cuidar da saúde de forma prática, contínua e personalizada.

Veja o que você pode fazer agora:

📸 Análise de refeições — manda a foto do prato e descubro na hora se está alinhado com seus objetivos.
💊 Suplementação personalizada — avalio sua rotina e indico o que faz sentido para o seu corpo.
🏃 Atividade física sob medida — do nível em que você está até onde quer chegar.
💬 Dúvidas na hora — sintomas, sono, alimentação. Qualquer hora, pode me chamar.

Saúde se constrói um dia de cada vez — e agora você tem com quem contar em todos eles.
`;

const TRIGGER_SIGNATURE = normalizeForMatch(TRIGGER_MESSAGE_TEXT);
const DEFAULT_LOOKBACK_DAYS = 7;
const DEFAULT_MAX_PAGES = 12;
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_TIME_ZONE = "America/Fortaleza";

interface ChatwootConfig {
  baseUrl: string;
  apiToken: string;
  accountId: number;
  inboxId: number;
  inboxName: string;
  inboxProvider: string;
  groupName: string;
  lookbackDays: number;
  maxPages: number;
  requestTimeoutMs: number;
}

interface FilteredConversation {
  id: number;
  patient: string;
  status: string;
  channel: string;
  lastMessage: string;
  firstQuestion: string;
  topic: string;
  time: string;
  triggerCreatedAt: number;
  latestActivityAt: number;
  contactMessageCount: number;
  hasContactResponse: boolean;
  waitingForHuman: boolean;
  disparoNoPeriodo: boolean;
  interagiuNoPeriodo: boolean;
  responseHours: number[];
}

interface DailyWindowEntry {
  key: string;
  day: string;
}

function getChatwootConfig(): ChatwootConfig {
  const accountId = Number(process.env.CHATWOOT_ACCOUNT_ID || 0);
  const inboxId = Number(process.env.CHATWOOT_INBOX_ID || 0);
  const lookbackDays = Math.max(1, Number(process.env.CHATWOOT_SCAN_LOOKBACK_DAYS || DEFAULT_LOOKBACK_DAYS));
  const maxPages = Math.max(1, Number(process.env.CHATWOOT_MAX_PAGES || DEFAULT_MAX_PAGES));
  const requestTimeoutMs = Math.max(1_000, Number(process.env.CHATWOOT_REQUEST_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));

  return {
    baseUrl: String(process.env.CHATWOOT_BASE_URL || "").replace(/\/$/, ""),
    apiToken: String(process.env.CHATWOOT_API_ACCESS_TOKEN || ""),
    accountId: Number.isFinite(accountId) ? accountId : 0,
    inboxId: Number.isFinite(inboxId) ? inboxId : 0,
    inboxName: String(process.env.CHATWOOT_INBOX_NAME || "Atendimento Dr. Bem Estar"),
    inboxProvider: String(process.env.CHATWOOT_INBOX_PROVIDER || "whatsapp"),
    groupName: String(process.env.CHATWOOT_GROUP_NAME || "Clinic+"),
    lookbackDays,
    maxPages,
    requestTimeoutMs,
  };
}

function assertRequiredConfig(config: ChatwootConfig): void {
  const missing: string[] = [];

  if (!config.baseUrl) missing.push("CHATWOOT_BASE_URL");
  if (!config.apiToken) missing.push("CHATWOOT_API_ACCESS_TOKEN");
  if (!config.accountId) missing.push("CHATWOOT_ACCOUNT_ID");
  if (!config.inboxId) missing.push("CHATWOOT_INBOX_ID");

  if (missing.length > 0) {
    throw new Error(`Variáveis obrigatórias ausentes: ${missing.join(", ")}`);
  }
}

function normalizeForMatch(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getMessageContent(message: ChatwootMessage): string {
  return String(message.content || message.processed_message_content || "").trim();
}

function isContactMessage(message: ChatwootMessage): boolean {
  const senderType = String(message.sender_type || message.sender?.type || "").toLowerCase();
  return senderType === "contact" || Number(message.message_type || -1) === 0;
}

function isInfinityMessage(message: ChatwootMessage): boolean {
  const senderName = normalizeForMatch(message.sender?.name || "");
  const availableName = normalizeForMatch(message.sender?.available_name || "");
  return senderName.includes("acessoinfinity") || availableName === "infinity";
}

function isTriggerMessage(message: ChatwootMessage): boolean {
  return isInfinityMessage(message) && normalizeForMatch(getMessageContent(message)) === TRIGGER_SIGNATURE;
}

function toDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}`;
}

function formatDateTime(value: number, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value * 1000));
}

function getHourInTimeZone(epochSeconds: number, timeZone: string): number {
  if (!epochSeconds) {
    return -1;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date(epochSeconds * 1000));

  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  // Alguns ambientes retornam 24 à meia-noite com hour12:false — normaliza para 0–23.
  return Number.isFinite(hour) ? hour % 24 : -1;
}

function formatChannel(channel?: string | null): string {
  const normalized = normalizeForMatch(channel || "");
  if (normalized.includes("whatsapp")) return "WhatsApp";
  if (!channel) return "Canal";
  return channel.replace(/^Channel::/i, "");
}

function classifyTopic(text: string): string {
  const normalized = normalizeForMatch(text);

  if (/(massa|musculo|energia|treino|academia)/.test(normalized)) {
    return "Performance e energia";
  }

  if (/(lactose|whey|suplement|proteina|proteinas|suplementacao)/.test(normalized)) {
    return "Suplementação";
  }

  if (/(emagrecer|peso|dieta|gordura|perderpeso)/.test(normalized)) {
    return "Controle de peso";
  }

  if (/(sono|ansiedade|stress|estresse|bemestar)/.test(normalized)) {
    return "Bem-estar";
  }

  return "Interesse geral";
}

function mapStatus(hasResponse: boolean, waitingForHuman: boolean): string {
  if (!hasResponse) return "quente";
  if (waitingForHuman) return "em análise";
  return "resolvido";
}

function createEmptyQuestionamentos(): QuestionSummary[] {
  return [
    {
      question: "Ainda não há questionamentos registrados no período consultado.",
      topic: "Sem dados",
      count: 0,
    },
  ];
}

function toDayWindow(lookbackDays: number, timeZone: string): string[] {
  const days: string[] = [];
  const now = new Date();

  for (let offset = lookbackDays - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    days.push(toDateKey(date, timeZone));
  }

  return days;
}

function createEmptyDailySeries(lookbackDays: number, timeZone: string): DailyWindowEntry[] {
  return toDayWindow(lookbackDays, timeZone).map((dateKey) => ({
    key: dateKey,
    day: formatDayLabel(dateKey),
  }));
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R | null>,
): Promise<R[]> {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += limit) {
    const batch = items.slice(index, index + limit);
    const batchResults = await Promise.all(batch.map((item) => mapper(item)));

    for (const result of batchResults) {
      if (result !== null) {
        results.push(result);
      }
    }
  }

  return results;
}

async function analyzeConversation(
  client: ReturnType<typeof createChatwootClient>,
  conversation: ChatwootConversationSummary,
  timeZone: string,
  cutoffEpochSeconds: number,
): Promise<FilteredConversation | null> {
  const messages = await client.getConversationMessages(conversation.id);
  if (messages.length === 0) {
    return null;
  }

  const triggerIndex = messages.findIndex(isTriggerMessage);
  if (triggerIndex < 0) {
    return null;
  }

  const triggerMessage = messages[triggerIndex];
  const latestMessage = messages[messages.length - 1];
  const contactMessagesAfterTrigger = messages.slice(triggerIndex + 1).filter(isContactMessage);
  const hasContactResponse = contactMessagesAfterTrigger.length > 0;
  const waitingForHuman = hasContactResponse && isContactMessage(latestMessage);
  const topicSource = contactMessagesAfterTrigger[0] || latestMessage;
  const triggerCreatedAt = Number(triggerMessage.created_at || conversation.created_at || latestMessage.created_at || 0);
  const latestActivityAt = Number(latestMessage.created_at || conversation.last_activity_at || conversation.updated_at || triggerCreatedAt);
  const interagiuNoPeriodo = contactMessagesAfterTrigger.some(
    (message) => Number(message.created_at || 0) >= cutoffEpochSeconds,
  );
  const responseHours = contactMessagesAfterTrigger
    .map((message) => getHourInTimeZone(Number(message.created_at || 0), timeZone))
    .filter((hour) => hour >= 0);

  return {
    id: conversation.id,
    patient: conversation.meta?.sender?.name || "Contato sem nome",
    status: mapStatus(hasContactResponse, waitingForHuman),
    channel: formatChannel(conversation.meta?.channel),
    lastMessage: getMessageContent(latestMessage),
    firstQuestion: hasContactResponse ? getMessageContent(topicSource) : "",
    topic: classifyTopic(getMessageContent(topicSource)),
    time: formatDateTime(latestActivityAt, timeZone),
    triggerCreatedAt,
    latestActivityAt,
    contactMessageCount: contactMessagesAfterTrigger.length,
    hasContactResponse,
    waitingForHuman,
    disparoNoPeriodo: triggerCreatedAt >= cutoffEpochSeconds,
    interagiuNoPeriodo,
    responseHours,
  };
}

function buildSummary(conversations: FilteredConversation[]) {
  const total = conversations.length;
  const responded = conversations.filter((conversation) => conversation.hasContactResponse).length;
  const awaitingHuman = conversations.filter((conversation) => conversation.waitingForHuman).length;
  const responsesAfterTrigger = conversations.reduce((sum, conversation) => sum + conversation.contactMessageCount, 0);
  const disparosNoPeriodo = conversations.filter((conversation) => conversation.disparoNoPeriodo).length;
  const interacoesNoPeriodo = conversations.filter((conversation) => conversation.interagiuNoPeriodo).length;

  return {
    disparosRealizados: total,
    disparosNoPeriodo,
    contatosInteragiram: responded,
    interacoesNoPeriodo,
    mediaInteracoesPorContato: responded > 0 ? responsesAfterTrigger / responded : 0,
    taxaEngajamento: total > 0 ? (responded / total) * 100 : 0,
    overview: {
      totalConversas: total,
      respondidas: responded,
      aguardandoHumano: awaitingHuman,
      oportunidades: Math.max(total - awaitingHuman, 0),
    },
  };
}

function buildDailySeries(conversations: FilteredConversation[], lookbackDays: number, timeZone: string): AccumulatedDay[] {
  const windowDays = createEmptyDailySeries(lookbackDays, timeZone);
  const countsByDay = new Map<string, number>();

  for (const conversation of conversations) {
    const key = toDateKey(new Date(conversation.triggerCreatedAt * 1000), timeZone);
    countsByDay.set(key, (countsByDay.get(key) || 0) + 1);
  }

  let cumulative = 0;
  return windowDays.map((entry) => {
    const novasConversas = countsByDay.get(entry.key) || 0;
    cumulative += novasConversas;
    return {
      day: entry.day,
      novasConversas,
      acumulado: cumulative,
    };
  });
}

function buildQuestionamentos(conversations: FilteredConversation[]): QuestionSummary[] {
  const grouped = new Map<string, QuestionSummary>();

  for (const conversation of conversations) {
    if (!conversation.hasContactResponse) {
      continue;
    }

    const question = conversation.firstQuestion.trim();
    if (!question) {
      continue;
    }

    const key = normalizeForMatch(question);
    const current = grouped.get(key);
    if (current) {
      current.count += 1;
    } else {
      grouped.set(key, { question, topic: conversation.topic, count: 1 });
    }
  }

  const ranked = [...grouped.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  return ranked.length > 0 ? ranked : createEmptyQuestionamentos();
}

function buildFunil(summary: ReturnType<typeof buildSummary>): FunnelStage[] {
  return [
    {
      label: "Disparos identificados",
      value: summary.disparosRealizados,
    },
    {
      label: "Com resposta",
      value: summary.contatosInteragiram,
    },
    {
      label: "Aguardando humano",
      value: summary.overview.aguardandoHumano,
    },
    {
      label: "Em andamento",
      value: Math.max(summary.contatosInteragiram - summary.overview.aguardandoHumano, 0),
    },
  ];
}

function buildRecentConversations(conversations: FilteredConversation[]): RecentConversation[] {
  return [...conversations]
    .sort((a, b) => b.latestActivityAt - a.latestActivityAt)
    .slice(0, 6)
    .map((conversation) => ({
      id: conversation.id,
      patient: conversation.patient,
      status: conversation.status,
      channel: conversation.channel,
      lastMessage: conversation.lastMessage,
      topic: conversation.topic,
      time: conversation.time,
    }));
}

function isWithinLookback(conversation: ChatwootConversationSummary, cutoffEpochSeconds: number): boolean {
  const activity = Number(conversation.last_activity_at || conversation.updated_at || conversation.created_at || 0);
  return activity >= cutoffEpochSeconds;
}

function clampDays(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.min(90, Math.max(1, Math.floor(value)));
}

/**
 * Resolve o período efetivo (em dias) a partir do parâmetro recebido, aplicando o
 * mesmo clamp/fallback usado internamente. Fonte única de verdade para a chave do snapshot.
 */
export function resolvePeriodDays(days?: number): number {
  const config = getChatwootConfig();
  return clampDays(Number(days), config.lookbackDays);
}

function buildLast24h(conversations: FilteredConversation[]): Last24hSummary {
  const cutoff = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
  const opened = conversations.filter((conversation) => conversation.triggerCreatedAt >= cutoff);
  const chatsAbertos = opened.length;
  const comInteracao = opened.filter((conversation) => conversation.hasContactResponse).length;

  return {
    chatsAbertos,
    comInteracao,
    taxaInteracao: chatsAbertos > 0 ? Number(((comInteracao / chatsAbertos) * 100).toFixed(1)) : 0,
  };
}

function buildHorariosResposta(conversations: FilteredConversation[]): ResponseHoursSummary {
  const counts = new Array<number>(24).fill(0);

  for (const conversation of conversations) {
    for (const hour of conversation.responseHours) {
      if (hour >= 0 && hour < 24) {
        counts[hour] += 1;
      }
    }
  }

  const totalRespostas = counts.reduce((sum, value) => sum + value, 0);

  let picoHour = -1;
  let picoCount = 0;
  if (totalRespostas > 0) {
    for (let hour = 0; hour < 24; hour += 1) {
      if (counts[hour] > picoCount) {
        picoCount = counts[hour];
        picoHour = hour;
      }
    }
  }

  const pad = (hour: number) => String(hour).padStart(2, "0");
  const buckets = counts.map((count, hour) => ({
    hour,
    label: `${pad(hour)}h`,
    count,
  }));

  return {
    totalRespostas,
    picoHour,
    picoCount,
    picoLabel: picoHour >= 0 ? `${pad(picoHour)}h–${pad((picoHour + 1) % 24)}h` : "—",
    buckets,
  };
}

function buildContatos(conversations: FilteredConversation[]): ConversationContact[] {
  return [...conversations]
    .sort((a, b) => b.latestActivityAt - a.latestActivityAt)
    .slice(0, 500)
    .map((conversation) => ({
      id: conversation.id,
      patient: conversation.patient,
      status: conversation.status,
      channel: conversation.channel,
      lastMessage: conversation.lastMessage,
      topic: conversation.topic,
      time: conversation.time,
      interacoes: conversation.contactMessageCount,
      respondeu: conversation.hasContactResponse,
      aguardandoHumano: conversation.waitingForHuman,
      disparoNoPeriodo: conversation.disparoNoPeriodo,
      interagiuNoPeriodo: conversation.interagiuNoPeriodo,
    }));
}

function classifyThreadAuthor(message: ChatwootMessage): ThreadAuthor {
  if (isInfinityMessage(message)) return "infinity";
  if (isContactMessage(message)) return "contato";
  if (Number(message.message_type ?? -1) === 2) return "sistema";
  return "equipe";
}

export async function getDashboardData(options: { days?: number } = {}): Promise<DashboardData> {
  const config = getChatwootConfig();
  assertRequiredConfig(config);
  const timeZone = process.env.TIMEZONE || DEFAULT_TIME_ZONE;
  const lookbackDays = resolvePeriodDays(options.days);

  const client = createChatwootClient({
    baseUrl: config.baseUrl,
    apiToken: config.apiToken,
    accountId: config.accountId,
    inboxId: config.inboxId,
    requestTimeoutMs: config.requestTimeoutMs,
  });

  const cutoffEpochSeconds = Math.floor(Date.now() / 1000) - lookbackDays * 24 * 60 * 60;
  const candidateConversations: ChatwootConversationSummary[] = [];

  for (let page = 1; page <= config.maxPages; page += 1) {
    const pageConversations = await client.listConversationsPage(page);
    if (pageConversations.length === 0) {
      break;
    }

    const recentItems = pageConversations.filter((conversation) => isWithinLookback(conversation, cutoffEpochSeconds));
    candidateConversations.push(...recentItems);

    const oldestActivityOnPage = Math.min(
      ...pageConversations.map((conversation) => Number(conversation.last_activity_at || conversation.updated_at || conversation.created_at || 0)),
    );

    if (oldestActivityOnPage < cutoffEpochSeconds) {
      break;
    }
  }

  const analyzedConversations = await mapWithConcurrency(candidateConversations, 8, async (conversation) =>
    analyzeConversation(client, conversation, timeZone, cutoffEpochSeconds),
  );

  analyzedConversations.sort((a, b) => b.latestActivityAt - a.latestActivityAt);

  const summary = buildSummary(analyzedConversations);
  const acumuladoDiario = buildDailySeries(analyzedConversations, lookbackDays, timeZone);
  const questionamentos = buildQuestionamentos(analyzedConversations);
  const funil = buildFunil(summary);
  const conversasRecentes = buildRecentConversations(analyzedConversations);
  const ultimas24h = buildLast24h(analyzedConversations);
  const contatos = buildContatos(analyzedConversations);
  const horariosResposta = buildHorariosResposta(analyzedConversations);
  const aiConfig = getAiConfig();
  const aiContext: DashboardAiSeed = buildDashboardAiSeed({
    generatedAt: new Date().toISOString(),
    timeZone,
    modelName: aiConfig.modelName,
    temperature: aiConfig.temperature,
    maxOutputTokens: aiConfig.maxOutputTokens,
    trigger: {
      senderName: "Acesso Infinity",
      inboxName: config.inboxName,
      inboxProvider: config.inboxProvider,
      groupName: config.groupName,
      text: TRIGGER_MESSAGE_TEXT.trim(),
      signature: TRIGGER_SIGNATURE,
    },
    summary,
    overview: summary.overview,
    funil,
    conversations: analyzedConversations,
  });

  return {
    updatedAt: new Date().toISOString(),
    periodoDias: lookbackDays,
    summary: {
      disparosRealizados: summary.disparosRealizados,
      disparosNoPeriodo: summary.disparosNoPeriodo,
      contatosInteragiram: summary.contatosInteragiram,
      interacoesNoPeriodo: summary.interacoesNoPeriodo,
      mediaInteracoesPorContato: Number(summary.mediaInteracoesPorContato.toFixed(1)),
      taxaEngajamento: Number(summary.taxaEngajamento.toFixed(1)),
    },
    ultimas24h,
    acumuladoDiario,
    questionamentos,
    overview: summary.overview,
    funil,
    conversasRecentes,
    contatos,
    horariosResposta,
    aiContext,
  };
}

export async function getConversationThread(conversationId: number): Promise<ConversationThread> {
  const config = getChatwootConfig();
  assertRequiredConfig(config);
  const timeZone = process.env.TIMEZONE || DEFAULT_TIME_ZONE;

  const client = createChatwootClient({
    baseUrl: config.baseUrl,
    apiToken: config.apiToken,
    accountId: config.accountId,
    inboxId: config.inboxId,
    requestTimeoutMs: config.requestTimeoutMs,
  });

  const messages = await client.getConversationMessages(conversationId);
  const sorted = [...messages].sort((a, b) => Number(a.created_at || 0) - Number(b.created_at || 0));

  const threadMessages: ThreadMessage[] = sorted
    .map((message) => ({
      id: Number(message.id || 0),
      author: classifyThreadAuthor(message),
      content: getMessageContent(message),
      time: formatDateTime(Number(message.created_at || 0), timeZone),
    }))
    .filter((message) => message.content.length > 0);

  const patient =
    sorted.find((message) => isContactMessage(message))?.sender?.name?.trim() || "Contato sem nome";

  return {
    conversationId,
    patient,
    messages: threadMessages,
  };
}
