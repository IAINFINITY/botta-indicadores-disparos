import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadEnvFile } from "../env.js";
import { getDashboardData } from "../services/dashboardService.js";
import { createChatwootClient } from "../services/chatwootClient.js";
import {
  getAiConfig,
  loadDashboardAiPrompts,
  loadDashboardAnalysisPrompt,
  buildDashboardSystemPrompt,
  renderPromptTemplate,
} from "./index.js";
import { generateChatCompletion } from "./openai.js";

function formatPreviewFile(parameters: {
  promptSignature: string;
  promptVersion: string;
  model: string;
  conversationId: number | null;
  content: string;
  generatedAt: string;
}): string {
  let renderedContent = parameters.content.trim();

  try {
    const parsed = JSON.parse(renderedContent) as unknown;
    renderedContent = JSON.stringify(parsed, null, 2);
  } catch {
    // Mantem o retorno bruto se o modelo nao entregar JSON valido.
  }

  return [
    "# Primeira analise da IA",
    `Generated at: ${parameters.generatedAt}`,
    `Model: ${parameters.model}`,
    `Prompt version: ${parameters.promptVersion}`,
    `Prompt signature: ${parameters.promptSignature}`,
    `Conversation ID: ${parameters.conversationId ?? "null"}`,
    "",
    "## Resposta",
    renderedContent,
    "",
  ].join("\n");
}

function getPreviewChatwootClient() {
  const accountId = Number(process.env.CHATWOOT_ACCOUNT_ID || 0);
  const inboxId = Number(process.env.CHATWOOT_INBOX_ID || 0);
  const requestTimeoutMs = Math.max(1_000, Number(process.env.CHATWOOT_REQUEST_TIMEOUT_MS || 45_000));

  return createChatwootClient({
    baseUrl: String(process.env.CHATWOOT_BASE_URL || "").replace(/\/$/, ""),
    apiToken: String(process.env.CHATWOOT_API_ACCESS_TOKEN || ""),
    accountId,
    inboxId,
    requestTimeoutMs,
  });
}

function parseConversationIdArg(): number | null {
  const rawArgs = process.argv.slice(2);

  for (const arg of rawArgs) {
    const match = arg.match(/^--conversation(?:Id)?=(\d+)$/i);
    if (match) {
      return Number(match[1]);
    }
  }

  const positional = rawArgs.find((arg) => /^\d+$/.test(arg));
  return positional ? Number(positional) : null;
}

function formatDashboardOverview(parameters: {
  dashboard: Awaited<ReturnType<typeof getDashboardData>>;
  selectedConversationId: number;
}): string {
  const { dashboard, selectedConversationId } = parameters;
  const recent = dashboard.conversasRecentes
    .map(
      (conversation, index) =>
        `${index + 1}. ${conversation.patient} | ${conversation.status} | ${conversation.topic} | ${conversation.time}`,
    )
    .join("\n");

  const topicLines = dashboard.topicos
    .map((topic, index) => `${index + 1}. ${topic.name} (${topic.share}%) - ${topic.resume}`)
    .join("\n");

  const dailyLines = dashboard.acumuladoDiario
    .map((day) => `${day.day}: novas=${day.novasConversas} | acumulado=${day.acumulado}`)
    .join("\n");

  return [
    "## Relatorio e overview",
    `Updated at: ${dashboard.updatedAt}`,
    `Selected conversation: ${selectedConversationId}`,
    "",
    "### Summary",
    JSON.stringify(dashboard.summary, null, 2),
    "",
    "### Overview",
    JSON.stringify(dashboard.overview, null, 2),
    "",
    "### Funnel",
    JSON.stringify(dashboard.funil, null, 2),
    "",
    "### Topics",
    topicLines || "Sem topicos disponiveis.",
    "",
    "### Daily accumulation",
    dailyLines || "Sem serie diaria disponivel.",
    "",
    "### Recent conversations",
    recent || "Sem conversas recentes.",
    "",
  ].join("\n");
}

function formatTranscript(transcript: Array<{ id: number; createdAt: number | null; senderType: string | null; senderName: string | null; content: string }>): string {
  return transcript
    .map((message, index) => {
      const stamp = message.createdAt ? new Date(message.createdAt * 1000).toISOString() : "null";
      return [
        `${index + 1}. [${stamp}]`,
        `   senderType: ${message.senderType ?? "null"}`,
        `   senderName: ${message.senderName ?? "null"}`,
        `   content: ${message.content || "(vazio)"}`,
      ].join("\n");
    })
    .join("\n\n");
}

async function main(): Promise<void> {
  loadEnvFile();

  const openAiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!openAiKey) {
    throw new Error("OPENAI_API_KEY não configurada.");
  }

  const dashboard = await getDashboardData();
  if (!dashboard.aiContext || dashboard.aiContext.conversations.length === 0) {
    throw new Error("Não há conversas elegíveis para análise.");
  }

  const requestedConversationId = parseConversationIdArg();
  const selectedConversation = requestedConversationId
    ? dashboard.aiContext.conversations.find((conversation) => conversation.id === requestedConversationId)
    : dashboard.aiContext.conversations[0];

  if (!selectedConversation) {
    throw new Error(
      requestedConversationId
        ? `Conversation ${requestedConversationId} não encontrada entre as conversas elegíveis.`
        : "Não foi possível selecionar uma conversa para análise.",
    );
  }
  const chatwootClient = getPreviewChatwootClient();
  const transcript = await chatwootClient.getConversationMessages(selectedConversation.id);
  const prompts = await loadDashboardAiPrompts();
  const aiConfig = getAiConfig();

  const snapshotConversation = {
    ...selectedConversation,
    transcript: transcript.map((message) => ({
      id: message.id,
      createdAt: message.created_at || null,
      senderType: message.sender_type || message.sender?.type || null,
      senderName: message.sender?.name || message.sender?.available_name || null,
      content: String(message.content || message.processed_message_content || "").trim(),
    })),
  };

  const snapshot = {
    dashboardGeneratedAt: dashboard.updatedAt,
    trigger: dashboard.aiContext.trigger,
    summary: dashboard.aiContext.summary,
    overview: dashboard.aiContext.overview,
    funil: dashboard.aiContext.funil,
    conversation: snapshotConversation,
  };

  const systemPrompt = buildDashboardSystemPrompt(prompts, {
    currentDate: new Date().toISOString().slice(0, 10),
    context: JSON.stringify(snapshot, null, 2),
  });
  const analysisPromptTemplate = await loadDashboardAnalysisPrompt();
  const userPrompt = renderPromptTemplate(analysisPromptTemplate, {
    snapshot: JSON.stringify(snapshot, null, 2),
  });

  const content = await generateChatCompletion({
    apiKey: openAiKey,
    model: aiConfig.modelName,
    systemPrompt,
    userPrompt,
    temperature: aiConfig.temperature,
    maxTokens: aiConfig.maxOutputTokens,
  });

  const outputDir = path.resolve(process.cwd(), "ai-output");
  await mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `preview-conversa-${selectedConversation.id}.txt`);
  await writeFile(
    outputPath,
    [
      formatDashboardOverview({
        dashboard,
        selectedConversationId: selectedConversation.id,
      }),
      formatPreviewFile({
        promptSignature: prompts.promptSignature,
        promptVersion: prompts.promptVersion,
        model: aiConfig.modelName,
        conversationId: selectedConversation.id,
        content,
        generatedAt: new Date().toISOString(),
      }),
      "",
      "## Transcript",
      formatTranscript(snapshotConversation.transcript),
      "",
    ].join("\n"),
    "utf8",
  );

  console.log(`Analise salva em: ${outputPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
