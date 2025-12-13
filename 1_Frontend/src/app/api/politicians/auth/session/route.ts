// Task: P4BA20 - 정치인 통합 이메일 인증 시스템
// POST /api/politicians/auth/session - 세션 상태 확인

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/politicians/auth/session] Starting...');

    const body = await request.json();
    const { politician_id, session_token } = body;

    if (!politician_id || !session_token) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: { message: '세션 정보가 없습니다.' }
      }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 세션 유효성 확인
    const { data: session, error } = await (supabase as any)
      .from('politician_sessions')
      .select('id, politician_id, expires_at, last_used_at')
      .eq('politician_id', politician_id)
      .eq('session_token', session_token)
      .gt('expires_at', new Date().toISOString())
      .single() as { data: { id: string; politician_id: string; expires_at: string; last_used_at: string | null } | null; error: any };

    if (error || !session) {
      console.log('[session] Invalid or expired session');
      return NextResponse.json({
        success: true,
        valid: false,
        message: '세션이 만료되었거나 유효하지 않습니다.',
      });
    }

    // 정치인 정보 조회
    const { data: politician } = await supabase
      .from('politicians')
      .select('id, name, party, position, verified_email')
      .eq('id', politician_id)
      .single() as { data: { id: string; name: string; party: string; position: string; verified_email: string | null } | null; error: any };

    // last_used_at 업데이트
    await (supabase as any)
      .from('politician_sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', session.id);

    console.log('[session] Valid session for:', politician?.name);

    return NextResponse.json({
      success: true,
      valid: true,
      politician: politician,
      expires_at: session.expires_at,
    });

  } catch (error) {
    console.error('[session] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      valid: false,
      error: { message: '서버 오류가 발생했습니다.' }
    }, { status: 500 });
  }
}
