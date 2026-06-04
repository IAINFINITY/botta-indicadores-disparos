import type { DashboardData } from "../types/dashboard";

export async function getDashboardData(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar dashboard: ${response.status}`);
  }

  return (await response.json()) as DashboardData;
}
