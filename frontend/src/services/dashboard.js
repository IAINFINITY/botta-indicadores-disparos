import { mockDashboardData } from "../data/mockData";

export async function getDashboardData() {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 250);
  });

  return mockDashboardData;
}
