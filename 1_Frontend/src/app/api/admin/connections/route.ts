// P3BA39: 연결 서비스 관리 Admin API
/**
 * 연결 서비스 관리 API
 * GET: 연결 요청 목록 조회
 * PATCH: 연결 요청 상태 변경
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 연결 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 기본 쿼리
    let query = supabaseAdmin
      .from('connections')
      .select(`
        *,
        politicians(id, name, party, position)
      `, { count: 'exact' });

    // 상태 필터
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 페이지네이션 및 정렬
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('연결 요청 목록 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: '연결 요청 목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('연결 요청 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 연결 요청 상태 변경
export async function PATCH(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, status, admin_notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '연결 요청 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: '변경할 상태가 필요합니다.' },
        { status: 400 }
      );
    }

    // 유효한 상태값 확인
    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 상태값입니다.' },
        { status: 400 }
      );
    }

    // 상태 업데이트
    const updateData: Record<string, unknown> = {
      status,
      processed_at: new Date().toISOString(),
      processed_by: user.id
    };

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    const { data, error } = await supabaseAdmin
      .from('connections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('연결 요청 상태 변경 실패:', error);
      return NextResponse.json(
        { success: false, error: '연결 요청 상태 변경에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'connection_status_change',
        target_type: 'connection',
        target_id: id,
        details: { new_status: status, admin_notes }
      });

    return NextResponse.json({
      success: true,
      message: '연결 요청이 처리되었습니다.',
      data
    });

  } catch (error) {
    console.error('연결 요청 상태 변경 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
