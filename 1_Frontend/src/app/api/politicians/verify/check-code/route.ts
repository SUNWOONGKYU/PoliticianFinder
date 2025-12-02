// API: POST /api/politicians/verify/check-code
// 정치인 이메일 인증 코드 확인

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { verification_id, code } = body;

    // 1. 입력 검증
    if (!verification_id || !code) {
      return NextResponse.json(
        { error: 'verification_id와 code 필드는 필수입니다.' },
        { status: 400 }
      );
    }

    // 2. 인증 정보 조회
    const { data: verification, error: fetchError } = await (supabase as any)
      .from('email_verifications')
      .select('*')
      .eq('id', verification_id)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json(
        { error: '인증 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // TypeScript: verification이 존재하므로 타입 단언
    type VerificationType = {
      id: string;
      politician_id: string;
      email: string;
      verification_code: string;
      verified: boolean;
      expires_at: string;
      verified_at?: string | null;
    };

    const verificationData = verification as VerificationType;

    // 3. 이미 인증됨
    if (verificationData.verified) {
      return NextResponse.json(
        {
          error: '이미 인증된 코드입니다.',
          verified: true
        },
        { status: 400 }
      );
    }

    // 4. 만료 확인
    const now = new Date();
    const expiresAt = new Date(verificationData.expires_at);
    if (now > expiresAt) {
      return NextResponse.json(
        {
          error: '인증 코드가 만료되었습니다.',
          message: '새로운 인증 코드를 요청해주세요.',
          expired: true
        },
        { status: 400 }
      );
    }

    // 5. 코드 일치 확인
    if (verificationData.verification_code.toUpperCase() !== code.toUpperCase()) {
      return NextResponse.json(
        {
          error: '인증 코드가 일치하지 않습니다.',
          message: '코드를 다시 확인해주세요.'
        },
        { status: 400 }
      );
    }

    // 6. 인증 완료 처리
    const { error: updateError } = await (supabase as any)
      .from('email_verifications')
      .update({
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('id', verification_id);

    if (updateError) {
      console.error('Failed to update verification:', updateError);
      return NextResponse.json(
        { error: '인증 처리 실패', details: updateError.message },
        { status: 500 }
      );
    }

    // 7. 세션 토큰 생성 (영구 사용)
    const sessionToken = randomBytes(32).toString('hex'); // 64자리 hex
    const sessionExpiresAt = new Date('2099-12-31T23:59:59Z'); // 영구 사용 (2099년까지)

    // 8. 세션 토큰 저장
    const { error: sessionError } = await (supabase as any)
      .from('politician_sessions')
      .insert([{
        politician_id: verificationData.politician_id,
        session_token: sessionToken,
        expires_at: sessionExpiresAt.toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null
      }]);

    if (sessionError) {
      console.error('Failed to create session:', sessionError);
      return NextResponse.json(
        { error: '세션 생성 실패', details: sessionError.message },
        { status: 500 }
      );
    }

    // 9. verified_email 저장 (최초 인증인 경우)
    const { data: politicianData } = await (supabase as any)
      .from('politicians')
      .select('verified_email')
      .eq('id', verificationData.politician_id)
      .single();

    if (!politicianData?.verified_email) {
      // 최초 인증 → verified_email 저장
      await (supabase as any)
        .from('politicians')
        .update({
          verified_email: verificationData.email,
          email_verified_at: new Date().toISOString()
        })
        .eq('id', verificationData.politician_id);
    }

    // 10. 성공 응답 (세션 토큰 포함)
    return NextResponse.json({
      success: true,
      message: '본인 인증이 완료되었습니다.',
      verified: true,
      politician_id: verificationData.politician_id,
      email: verificationData.email,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      is_first_time: !politicianData?.verified_email  // 최초 등록 완료 여부
    });

  } catch (error) {
    console.error('Check code error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
