import { mockDashboardData } from "../data/mockData";
import type { DashboardData } from "../types/dashboard";

export async function getDashboardData(): Promise<DashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, 250);
  });

  return mockDashboardData;
}
