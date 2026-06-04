import type {
  DashboardAiSeed,
  DashboardAiTrigger,
  DashboardConversationSource,
  DashboardSummary,
  FunnelStage,
  OverviewSummary,
} from "../types/dashboard.js";

export interface BuildDashboardAiSeedInput {
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

export function buildDashboardAiSeed(input: BuildDashboardAiSeedInput): DashboardAiSeed {
  return {
    schemaVersion: "dashboard-ai-seed-v1",
    generatedAt: input.generatedAt,
    timeZone: input.timeZone,
    modelName: input.modelName,
    temperature: input.temperature,
    maxOutputTokens: input.maxOutputTokens,
    trigger: input.trigger,
    summary: input.summary,
    overview: input.overview,
    funil: input.funil,
    conversations: input.conversations,
  };
}
