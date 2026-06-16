import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/serverEnv";

const backendBaseUrl = getServerEnv("BACKEND_URL", "http://127.0.0.1:3333");

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const response = await fetch(`${backendBaseUrl}/api/conversations/${id}/messages`, {
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = (await response.text()).trim();

      return NextResponse.json(
        {
          ok: false,
          error: "backend_error",
          message: errorBody || "Failed to load conversation thread from backend.",
        },
        { status: response.status },
      );
    }

    const data = (await response.json()) as Record<string, unknown>;
    return NextResponse.json(data);
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
