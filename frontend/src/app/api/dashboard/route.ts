import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/serverEnv";
import type { DashboardData } from "@/types/dashboard";

const backendBaseUrl = getServerEnv("BACKEND_URL", "http://127.0.0.1:3333");

function toPublicDashboardData(payload: Record<string, unknown>): DashboardData {
  return {
    updatedAt: String(payload.updatedAt || ""),
    periodoDias: Number(payload.periodoDias) || 0,
    summary: payload.summary as DashboardData["summary"],
    ultimas24h: payload.ultimas24h as DashboardData["ultimas24h"],
    acumuladoDiario: payload.acumuladoDiario as DashboardData["acumuladoDiario"],
    questionamentos: payload.questionamentos as DashboardData["questionamentos"],
    overview: payload.overview as DashboardData["overview"],
    funil: payload.funil as DashboardData["funil"],
    conversasRecentes: payload.conversasRecentes as DashboardData["conversasRecentes"],
    contatos: (payload.contatos as DashboardData["contatos"]) ?? [],
  };
}

export async function GET(request: Request) {
  try {
    const days = new URL(request.url).searchParams.get("days");
    const backendUrl = new URL(`${backendBaseUrl}/api/dashboard`);
    if (days) {
      backendUrl.searchParams.set("days", days);
    }

    const response = await fetch(backendUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = (await response.text()).trim();

      return NextResponse.json(
        {
          ok: false,
          error: "backend_error",
          message: errorBody || "Failed to load dashboard data from backend.",
        },
        { status: response.status },
      );
    }

    const data = (await response.json()) as Record<string, unknown>;
    return NextResponse.json(toPublicDashboardData(data));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "network_error",
        message: error instanceof Error ? error.message : "Unexpected error.",
      },
      { status: 502 },
    );
  }
}
