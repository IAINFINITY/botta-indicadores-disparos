import type { Request, Response } from "express";
import { getDashboardData } from "../services/dashboardService.js";

export async function dashboardHandler(_req: Request, res: Response) {
  try {
    const dashboard = await getDashboardData();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({
      error: "dashboard_fetch_failed",
      message: error instanceof Error ? error.message : "Falha ao montar o dashboard.",
    });
  }
}
