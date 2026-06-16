import type { Request, Response } from "express";
import { getConversationThread, getDashboardData } from "../services/dashboardService.js";

export async function dashboardHandler(req: Request, res: Response) {
  try {
    const rawDays = Number(req.query.days);
    const days = Number.isFinite(rawDays) && rawDays > 0 ? rawDays : undefined;
    const dashboard = await getDashboardData({ days });
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({
      error: "dashboard_fetch_failed",
      message: error instanceof Error ? error.message : "Falha ao montar o dashboard.",
    });
  }
}

export async function conversationThreadHandler(req: Request, res: Response) {
  const conversationId = Number(req.params.id);

  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    res.status(400).json({
      error: "invalid_conversation_id",
      message: "Identificador de conversa inválido.",
    });
    return;
  }

  try {
    const thread = await getConversationThread(conversationId);
    res.json(thread);
  } catch (error) {
    res.status(500).json({
      error: "conversation_thread_failed",
      message: error instanceof Error ? error.message : "Falha ao carregar a conversa.",
    });
  }
}
