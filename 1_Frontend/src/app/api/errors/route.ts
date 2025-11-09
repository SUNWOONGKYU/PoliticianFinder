// P7BA3: 오류 추적 API - 시스템 오류 기록

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const errorSchema = z.object({
  error_code: z.string(),
  message: z.string(),
  context: z.record(z.any()).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]),
});

const mockErrors: Record<string, any> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const error = errorSchema.parse(body);

    const errorId = Math.random().toString(36).substring(7);
    const newError = {
      id: errorId,
      ...error,
      createdAt: new Date().toISOString(),
      status: "reported", // reported, investigating, resolved
    };

    mockErrors[errorId] = newError;

    return NextResponse.json({ success: true, data: newError }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const severity = request.nextUrl.searchParams.get("severity");
    let errors = Object.values(mockErrors);

    if (severity) {
      errors = errors.filter((e) => e.severity === severity);
    }

    errors.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(
      { success: true, data: errors, total: errors.length },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
