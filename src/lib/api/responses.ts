import "server-only";

import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/errors";

export function jsonData<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonOk() {
  return NextResponse.json({ ok: true });
}

export function toErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      },
      { status: error.status }
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
    { status: 500 }
  );
}

export async function runRoute(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    return toErrorResponse(error);
  }
}
