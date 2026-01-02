// API: GET /api/admin/report-sales
// 관리자 전용: 보고서 구매 목록 조회

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // 관리자 쿠키 확인
    const isAdmin = request.cookies.get('isAdmin')?.value === 'true';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 401 }
      );
    }

    // Service Role로 Supabase 클라이언트 생성 (RLS 우회)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // report_purchases 테이블 조회
    const { data, error } = await supabase
      .from('report_purchases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('report_purchases 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('GET /api/admin/report-sales error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 입금 확인
export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = request.cookies.get('isAdmin')?.value === 'true';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, payment_confirmed } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('report_purchases')
      .update({
        payment_confirmed: payment_confirmed,
        payment_confirmed_at: payment_confirmed ? new Date().toISOString() : null
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('PATCH /api/admin/report-sales error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
