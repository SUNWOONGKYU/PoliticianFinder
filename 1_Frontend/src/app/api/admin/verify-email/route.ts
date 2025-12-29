// Admin API: 이메일 수동 인증
// POST /api/admin/verify-email
// 관리자 전용: 이메일 발송 실패 시 수동으로 사용자 이메일 인증 처리

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// 간단한 관리자 비밀키 (환경변수로 관리 권장)
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'politicianfinder-admin-2025';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, admin_key } = body;

    // 1. 관리자 키 검증
    if (admin_key !== ADMIN_SECRET) {
      return NextResponse.json(
        { success: false, error: '관리자 인증 실패' },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일이 필요합니다' },
        { status: 400 }
      );
    }

    console.log('[Admin] 이메일 수동 인증 시작:', email?.substring(0, 3) + '***@***');

    const supabase = createAdminClient();

    // 2. 이메일로 사용자 찾기
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('[Admin] 사용자 목록 조회 실패:', listError);
      return NextResponse.json(
        { success: false, error: '사용자 조회 실패', details: listError.message },
        { status: 500 }
      );
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      return NextResponse.json(
        { success: false, error: '해당 이메일의 사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    console.log('[Admin] 사용자 찾음:', { id: user.id, email: user.email?.substring(0, 3) + '***@***' });

    // 3. 이미 인증된 경우
    if (user.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        message: '이미 이메일 인증이 완료된 사용자입니다',
        user: {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at
        }
      });
    }

    // 4. 이메일 인증 처리 (email_confirmed_at 업데이트)
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error('[Admin] 이메일 인증 업데이트 실패:', updateError);
      return NextResponse.json(
        { success: false, error: '이메일 인증 처리 실패', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('[Admin] 이메일 인증 완료:', updatedUser.user?.email?.substring(0, 3) + '***@***');

    return NextResponse.json({
      success: true,
      message: '이메일 인증이 완료되었습니다',
      user: {
        id: updatedUser.user?.id,
        email: updatedUser.user?.email,
        email_confirmed_at: updatedUser.user?.email_confirmed_at
      }
    });

  } catch (error) {
    console.error('[Admin] 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류', details: String(error) },
      { status: 500 }
    );
  }
}
