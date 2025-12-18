// P7BA1: 보고서 구매 - 이메일 인증 코드 확인
// POST /api/report-purchase/verify-code

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const verifyCodeSchema = z.object({
  verification_id: z.string().uuid('올바른 인증 ID가 아닙니다'),
  code: z.string().length(6, '인증 코드는 6자리입니다'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/report-purchase/verify-code] Starting...');

    const body = await request.json();
    const validated = verifyCodeSchema.parse(body);

    console.log('[verify-code] verification_id:', validated.verification_id);
    console.log('[verify-code] code:', validated.code);

    const supabase = createAdminClient();

    // 1. 인증 정보 조회
    const { data: verification, error: verifyError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('id', validated.verification_id)
      .single() as { data: { id: string; email: string; politician_id: string; verified: boolean; verification_code: string; expires_at: string } | null; error: any };

    if (verifyError || !verification) {
      console.log('[verify-code] Verification not found:', verifyError);
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '인증 정보를 찾을 수 없습니다.' }
      }, { status: 404 });
    }

    // 2. 이미 인증됨
    if (verification.verified) {
      return NextResponse.json({
        success: false,
        error: { code: 'ALREADY_VERIFIED', message: '이미 인증이 완료되었습니다.' }
      }, { status: 400 });
    }

    // 3. 만료 시간 확인
    const expiresAt = new Date(verification.expires_at);
    if (new Date() > expiresAt) {
      return NextResponse.json({
        success: false,
        error: { code: 'EXPIRED', message: '인증 코드가 만료되었습니다. 다시 요청해주세요.' }
      }, { status: 400 });
    }

    // 4. 코드 일치 확인 (대소문자 무시)
    if (verification.verification_code.toUpperCase() !== validated.code.toUpperCase()) {
      console.log('[verify-code] Code mismatch');
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_CODE', message: '인증 코드가 일치하지 않습니다.' }
      }, { status: 400 });
    }

    // 5. 인증 완료 업데이트
    const { error: updateError } = await (supabase
      .from('email_verifications') as any)
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', validated.verification_id);

    if (updateError) {
      console.error('[verify-code] Update error:', updateError);
      return NextResponse.json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: '인증 상태 업데이트 실패' }
      }, { status: 500 });
    }

    console.log('[verify-code] Verification successful');

    return NextResponse.json({
      success: true,
      message: '이메일 인증이 완료되었습니다.',
      verification: {
        id: verification.id,
        politician_id: verification.politician_id,
        email: verification.email,
        verified_at: new Date().toISOString(),
      }
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
