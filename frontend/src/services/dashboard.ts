import type { ConversationThread, DashboardData } from "../types/dashboard";

interface ApiErrorBody {
  message?: string;
}

function isDashboardData(value: unknown): value is DashboardData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.updatedAt === "string" &&
    typeof payload.summary === "object" &&
    Array.isArray(payload.acumuladoDiario) &&
    Array.isArray(payload.questionamentos) &&
    typeof payload.overview === "object" &&
    Array.isArray(payload.funil) &&
    Array.isArray(payload.conversasRecentes)
  );
}

export async function getDashboardData(days?: number): Promise<DashboardData> {
  const query = days && Number.isFinite(days) ? `?days=${days}` : "";
  const response = await fetch(`/api/dashboard${query}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new Error(errorBody?.message || `Falha ao carregar o dashboard: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;

  if (!isDashboardData(payload)) {
    throw new Error("Resposta do dashboard em formato inesperado.");
  }

  return payload;
}

export async function getConversationThread(id: number): Promise<ConversationThread> {
  const response = await fetch(`/api/conversations/${id}/messages`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new Error(errorBody?.message || `Falha ao carregar a conversa: ${response.status}`);
  }

  return (await response.json()) as ConversationThread;
}
