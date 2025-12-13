// Task: P4BA20 - 정치인 통합 이메일 인증 시스템
// POST /api/politicians/auth/verify-code - 코드 확인 + 세션 발급

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

const verifyCodeSchema = z.object({
  verification_id: z.string().uuid('유효하지 않은 인증 요청입니다'),
  code: z.string().length(6, '6자리 코드를 입력해주세요'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/politicians/auth/verify-code] Starting...');

    const body = await request.json();
    const validated = verifyCodeSchema.parse(body);

    console.log('[verify-code] verification_id:', validated.verification_id);

    const supabase = createAdminClient();

    // 1. 인증 요청 조회
    const { data: verification, error: verificationError } = await (supabase as any)
      .from('politician_email_verifications')
      .select('*')
      .eq('id', validated.verification_id)
      .single() as { data: { id: string; politician_id: string; email: string; verification_code: string; expires_at: string; verified: boolean } | null; error: any };

    if (verificationError || !verification) {
      console.log('[verify-code] Verification not found:', verificationError);
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '인증 요청을 찾을 수 없습니다.' }
      }, { status: 404 });
    }

    // 2. 이미 인증됨 체크
    if (verification.verified) {
      return NextResponse.json({
        success: false,
        error: { code: 'ALREADY_VERIFIED', message: '이미 인증된 요청입니다.' }
      }, { status: 400 });
    }

    // 3. 만료 체크
    if (new Date() > new Date(verification.expires_at)) {
      return NextResponse.json({
        success: false,
        error: { code: 'EXPIRED', message: '인증 코드가 만료되었습니다. 다시 발송해주세요.' }
      }, { status: 400 });
    }

    // 4. 코드 일치 확인 (대소문자 무시)
    if (verification.verification_code.toUpperCase() !== validated.code.toUpperCase()) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_CODE', message: '인증 코드가 일치하지 않습니다.' }
      }, { status: 400 });
    }

    console.log('[verify-code] Code matched for politician:', verification.politician_id);

    // 5. 인증 완료 처리
    await (supabase as any)
      .from('politician_email_verifications')
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq('id', validated.verification_id);

    // 6. politicians.verified_email 업데이트 (새 이메일이면 변경)
    const { error: updateError } = await (supabase as any)
      .from('politicians')
      .update({
        verified_email: verification.email,
        email_verified_at: new Date().toISOString(),
      })
      .eq('id', verification.politician_id);

    if (updateError) {
      console.error('[verify-code] Update politician error:', updateError);
    }

    // 7. 기존 세션 삭제 (새 세션 발급 위해)
    await (supabase as any)
      .from('politician_sessions')
      .delete()
      .eq('politician_id', verification.politician_id);

    // 8. 새 세션 토큰 발급 (1년 = 실질적 영구)
    const sessionToken = crypto.randomBytes(32).toString('hex');

    const sessionExpiresAt = new Date();
    sessionExpiresAt.setFullYear(sessionExpiresAt.getFullYear() + 1);

    const { error: sessionError } = await (supabase as any)
      .from('politician_sessions')
      .insert({
        politician_id: verification.politician_id,
        session_token: sessionToken,
        expires_at: sessionExpiresAt.toISOString(),
      });

    if (sessionError) {
      console.error('[verify-code] Session create error:', sessionError);
      return NextResponse.json({
        success: false,
        error: { code: 'SESSION_ERROR', message: '세션 생성 실패' }
      }, { status: 500 });
    }

    // 9. 정치인 정보 조회
    const { data: politician } = await supabase
      .from('politicians')
      .select('id, name, party, position, verified_email')
      .eq('id', verification.politician_id)
      .single() as { data: { id: string; name: string; party: string; position: string; verified_email: string | null } | null; error: any };

    console.log('[verify-code] Session created for:', politician?.name);

    return NextResponse.json({
      success: true,
      message: `${politician?.name}님 본인 인증이 완료되었습니다.`,
      session: {
        politician_id: verification.politician_id,
        session_token: sessionToken,
        expires_at: sessionExpiresAt.toISOString(),
      },
      politician: politician,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
      }, { status: 400 });
    }

    console.error('[verify-code] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' }
    }, { status: 500 });
  }
}
