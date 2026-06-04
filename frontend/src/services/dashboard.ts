import type { DashboardData } from "../types/dashboard";

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
    Array.isArray(payload.topicos) &&
    typeof payload.overview === "object" &&
    Array.isArray(payload.funil) &&
    Array.isArray(payload.conversasRecentes)
  );
}

export async function getDashboardData(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard", {
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
