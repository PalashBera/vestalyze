import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

export function jsonError(message: string, status = 400, code?: string) {
  return NextResponse.json(
    { error: message, code },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export function errorFromUnknown(error: unknown) {
  if (error instanceof Error) {
    const status = "status" in error && typeof error.status === "number" ? error.status : 400;
    return jsonError(error.message, status);
  }
  return jsonError("Unexpected error", 500);
}
