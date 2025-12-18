/**
 * 고객센터 문의하기 API
 * POST: 문의 등록
 * GET: 내 문의 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Lazy initialization to avoid build-time errors
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// POST: 문의 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // 필수 필드 검증
    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: '문의 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 로그인한 사용자인지 확인 (선택적)
    let userId = null;
    try {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch (e) {
      // 로그인 안 된 경우 무시
    }

    // 문의 등록 (기존 테이블 컬럼에 맞춤: title, content)
    // name, phone은 content에 포함하여 저장
    const contentWithInfo = [
      name ? `이름: ${name}` : null,
      phone ? `연락처: ${phone}` : null,
      '',
      message
    ].filter(Boolean).join('\n');

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .insert({
        email,
        title: subject || '일반문의',
        content: contentWithInfo,
        user_id: userId,
        status: 'pending',
        priority: 'normal'
      })
      .select()
      .single();

    if (error) {
      console.error('문의 등록 실패:', error);
      return NextResponse.json(
        { success: false, error: '문의 등록에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '문의가 성공적으로 접수되었습니다.',
      data: {
        id: data.id,
        created_at: data.created_at
      }
    });

  } catch (error) {
    console.error('문의 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 내 문의 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 내 문의 목록 조회 (user_id 또는 이메일로)
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .select('*')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('문의 목록 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: '문의 목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('문의 목록 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
