// P1BA4: Mock API - 기타 (신고 관리 API - 콘텐츠 조정)
// Supabase 연동 - 신고 데이터 관리

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Mock User UUID for testing
const MOCK_USER_ID = '7f61567b-bbdf-427a-90a9-0ee060ef4595';

const reportSchema = z.object({
  target_id: z.string().uuid(),
  target_type: z.enum(["post", "comment", "user"]),
  reason: z.enum(["spam", "violence", "hate_speech", "inappropriate", "copyright"]),
  description: z.string().optional(),
  reporter_id: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const report = reportSchema.parse({
      ...body,
      reporter_id: body.reporter_id || MOCK_USER_ID,
    });

    // 신고 대상 존재 여부 확인
    let targetExists = false;
    if (report.target_type === 'post') {
      const { data } = await supabase
        .from('posts')
        .select('id')
        .eq('id', report.target_id)
        .single();
      targetExists = !!data;
    } else if (report.target_type === 'comment') {
      const { data } = await supabase
        .from('comments')
        .select('id')
        .eq('id', report.target_id)
        .single();
      targetExists = !!data;
    } else if (report.target_type === 'user') {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('id', report.target_id)
        .single();
      targetExists = !!data;
    }

    if (!targetExists) {
      return NextResponse.json(
        { success: false, error: "신고 대상을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 신고 생성
    const { data: newReport, error: insertError } = await supabase
      .from('reports')
      .insert({
        target_id: report.target_id,
        target_type: report.target_type,
        reason: report.reason,
        description: report.description || '',
        reporter_id: report.reporter_id,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { success: false, error: "신고 생성 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: newReport }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }
    console.error('POST /api/admin/reports error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const status = request.nextUrl.searchParams.get("status");
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    let query = supabase
      .from('reports')
      .select('*, users!reports_reporter_id_fkey(id, username, email)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, count, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { success: false, error: "신고 목록 조회 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: data || [],
        pagination: { page, limit, total, totalPages },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/admin/reports error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { report_id, status, action, admin_notes } = body;

    if (!report_id || !status) {
      return NextResponse.json(
        { success: false, error: "report_id and status are required" },
        { status: 400 }
      );
    }

    // 신고 상태 업데이트
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({
        status,
        action: action || null,
        admin_notes: admin_notes || null,
        resolved_at: ['resolved', 'dismissed'].includes(status)
          ? new Date().toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', report_id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { success: false, error: "신고 업데이트 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    await supabase.from('audit_logs').insert({
      action: 'report_resolved',
      target_type: 'report',
      target_id: report_id,
      actor_id: MOCK_USER_ID, // 실제로는 관리자 ID 사용
      details: JSON.stringify({ status, action, admin_notes }),
    });

    return NextResponse.json({ success: true, data: updatedReport }, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/admin/reports error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
