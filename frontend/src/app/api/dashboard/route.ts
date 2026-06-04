import { NextResponse } from "next/server";

const backendBaseUrl = process.env.BACKEND_URL || "http://127.0.0.1:3333";

export async function GET() {
  try {
    const response = await fetch(`${backendBaseUrl}/api/dashboard`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "backend_error",
          message: "Failed to load dashboard data from backend.",
        },
        { status: response.status },
      );
    }

    const data = await response.json();
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
