import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/serverEnv";
import type { DashboardData } from "@/types/dashboard";

const backendBaseUrl = getServerEnv("BACKEND_URL", "http://127.0.0.1:3333");

function toPublicDashboardData(payload: Record<string, unknown>): DashboardData {
  return {
    updatedAt: String(payload.updatedAt || ""),
    summary: payload.summary as DashboardData["summary"],
    acumuladoDiario: payload.acumuladoDiario as DashboardData["acumuladoDiario"],
    topicos: payload.topicos as DashboardData["topicos"],
    overview: payload.overview as DashboardData["overview"],
    funil: payload.funil as DashboardData["funil"],
    conversasRecentes: payload.conversasRecentes as DashboardData["conversasRecentes"],
  };
}

export async function GET() {
  try {
    const response = await fetch(`${backendBaseUrl}/api/dashboard`, {
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
