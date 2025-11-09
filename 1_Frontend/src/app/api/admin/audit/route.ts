// P6BA5: 감사 로그 API - 관리자 활동 추적

import { NextRequest, NextResponse } from "next/server";

const mockAuditLogs: Record<string, any> = {
  log1: { id: "log1", admin_id: "admin1", action: "user_ban", target: "user123", reason: "Spam", timestamp: "2025-01-10T14:00:00Z" },
  log2: { id: "log2", admin_id: "admin1", action: "content_delete", target: "post456", reason: "Inappropriate", timestamp: "2025-01-10T13:30:00Z" },
};

export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get("limit") || "50";
    const admin_id = request.nextUrl.searchParams.get("admin_id");

    let logs = Object.values(mockAuditLogs);

    if (admin_id) {
      logs = logs.filter((l) => l.admin_id === admin_id);
    }

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    logs = logs.slice(0, parseInt(limit));

    return NextResponse.json(
      { success: true, data: logs, total: Object.keys(mockAuditLogs).length },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const logId = Math.random().toString(36).substring(7);
    const newLog = {
      id: logId,
      ...body,
      timestamp: new Date().toISOString(),
    };

    mockAuditLogs[logId] = newLog;

    return NextResponse.json({ success: true, data: newLog }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
