// Admin Reports API - 관리자용 신고 관리
// Supabase 연동 - 관리자가 신고 내역을 조회/처리

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // 🔥 NO AUTH CHECK - DIRECT ADMIN CLIENT 🔥
  try {
    const supabase = createAdminClient();

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const status = request.nextUrl.searchParams.get('status');
    const targetType = request.nextUrl.searchParams.get('target_type');

    let query = (supabase as any)
      .from('reports')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 상태 필터
    if (status) {
      query = query.eq('status', status);
    }

    // 타겟 타입 필터
    if (targetType) {
      query = query.eq('target_type', targetType);
    }

    // 페이지네이션
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, count, error } = await query;

    if (error) {
      console.error('Reports query error:', error);
      return NextResponse.json(
        { success: false, error: '신고 목록 조회 중 오류가 발생했습니다', details: error.message },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: { page, limit, total, totalPages },
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  // 🔥 NO AUTH CHECK - DIRECT ADMIN CLIENT 🔥
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { report_id, status, resolution } = body;

    if (!report_id) {
      return NextResponse.json(
        { success: false, error: 'report_id is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'reviewing', 'accepted', 'rejected', 'resolved'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 상태값입니다' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'resolved' || status === 'accepted' || status === 'rejected') {
        updateData.resolved_at = new Date().toISOString();
      }
    }

    if (resolution) {
      updateData.resolution = resolution;
    }

    const { data, error } = await (supabase as any)
      .from('reports')
      .update(updateData)
      .eq('id', report_id)
      .select()
      .single();

    if (error) {
      console.error('Report update error:', error);
      return NextResponse.json(
        { success: false, error: '신고 처리 중 오류가 발생했습니다', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '신고가 처리되었습니다',
    }, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/admin/reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
