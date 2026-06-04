export type AiEngagementState = "new" | "engaged" | "handoff" | "resolved";

export interface AiConversationAnalysis {
  conversationId: number;
  matchedTrigger: boolean;
  category: string;
  summary: string;
  userIntent: string;
  engagementState: AiEngagementState;
  nextAction: string;
  confidence: number;
  evidence: string[];
}

export interface AiDashboardAnalysis {
  schemaVersion: "dashboard-ai-analysis-v1";
  generatedAt: string;
  promptVersion: string;
  promptSignature: string;
  triggerSignature: string;
  overviewSummary: string;
  mainThemes: string[];
  conversations: AiConversationAnalysis[];
}

export interface AiPromptBundle {
  context: string;
  main: string;
  promptVersion: string;
  promptSignature: string;
}

