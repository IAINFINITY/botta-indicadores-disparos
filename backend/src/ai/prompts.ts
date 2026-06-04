import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { AiPromptBundle } from "./contracts.js";

const PROMPTS_DIRECTORY = path.resolve(process.cwd(), "prompts");

function buildPromptSignature(context: string, main: string): string {
  return createHash("sha256").update(context).update("\n---\n").update(main).digest("hex");
}

function renderTemplate(text: string, variables: Record<string, string>): string {
  let rendered = text;

  for (const [key, value] of Object.entries(variables)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    rendered = rendered.replace(new RegExp(`\\{\\{${escapedKey}\\}\\}`, "g"), value);
  }

  return rendered;
}

async function readPromptFile(filename: string): Promise<string> {
  const filePath = path.resolve(PROMPTS_DIRECTORY, filename);

  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read AI prompt file ${filePath}: ${message}`);
  }
}

export async function loadDashboardAiPrompts(): Promise<AiPromptBundle> {
  const [context, main] = await Promise.all([
    readPromptFile("contexto_chatbot_empresa.txt"),
    readPromptFile("mainprompt_chatbot_empresa.txt"),
  ]);

  return {
    context,
    main,
    promptVersion: buildPromptSignature(context, main).slice(0, 12),
    promptSignature: buildPromptSignature(context, main),
  };
}

export async function loadDashboardAnalysisPrompt(): Promise<string> {
  return readPromptFile("entrada_analise_chatbot_empresa.txt");
}

export interface DashboardPromptRenderInput {
  currentDate: string;
  context: string;
}

export function buildDashboardSystemPrompt(bundle: AiPromptBundle, input: DashboardPromptRenderInput): string {
  const renderedMain = renderTemplate(bundle.main, {
    current_date: input.currentDate,
    context: input.context,
  });

  return [bundle.context.trim(), renderedMain.trim()]
    .filter(Boolean)
    .join("\n\n");
}

export function renderPromptTemplate(template: string, variables: Record<string, string>): string {
  return renderTemplate(template, variables);
}
