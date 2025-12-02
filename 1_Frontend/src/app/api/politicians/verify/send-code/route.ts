// API: POST /api/politicians/verify/send-code
// 정치인 이메일 인증 코드 발송

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// 6자리 영숫자 코드 생성
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { politician_id, email } = body;

    // 1. 입력 검증
    if (!politician_id || !email) {
      return NextResponse.json(
        { error: 'politician_id와 email 필드는 필수입니다.' },
        { status: 400 }
      );
    }

    // 2. 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 3. 정치인 정보 조회
    const { data: politician, error: politicianError } = await (supabase as any)
      .from('politicians')
      .select('id, name, party, position, verified_email, email_verified_at')
      .eq('id', politician_id)
      .single();

    if (politicianError || !politician) {
      return NextResponse.json(
        {
          error: '정치인 정보를 찾을 수 없습니다.',
          message: 'politician_id를 확인해주세요.'
        },
        { status: 404 }
      );
    }

    // 4. 이미 등록된 이메일이 있는 경우 → 일치 확인
    if (politician.verified_email) {
      if (politician.verified_email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          {
            error: '등록된 이메일과 일치하지 않습니다.',
            message: `${politician.name} 정치인은 이미 다른 이메일로 등록되어 있습니다.`,
            registered_email: politician.verified_email.replace(/(.{3}).+(@.+)/, '$1***$2') // 마스킹
          },
          { status: 403 }
        );
      }
    }
    // verified_email 없으면 → 자유롭게 이메일 입력 가능 (최초 등록)

    // 5. 인증 코드 생성
    const verificationCode = generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10분 후 만료

    // 6. DB에 인증 코드 저장
    const { data: verification, error: insertError } = await (supabase as any)
      .from('email_verifications')
      .insert({
        politician_id: politician.id,
        email: email,  // 사용자가 입력한 이메일 사용
        verification_code: verificationCode,
        purpose: politician.verified_email ? 'posting' : 'email_registration',  // 최초 등록 vs 글쓰기
        verified: false,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert verification:', insertError);
      return NextResponse.json(
        { error: '인증 코드 생성 실패', details: insertError.message },
        { status: 500 }
      );
    }

    // 7. 이메일 발송
    try {
      await resend.emails.send({
        from: 'noreply@politicianfinder.ai.kr',
        to: email,  // 사용자가 입력한 이메일로 발송
        subject: `[PoliticianFinder] ${politician.name}님 본인 인증 코드`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">정치인 본인 인증</h2>
            <p>${politician.name}님 안녕하세요.</p>
            <p>PoliticianFinder에서 본인 인증을 요청하셨습니다.</p>
            <p>아래 인증 코드를 입력해주세요:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #1e40af; letter-spacing: 8px; margin: 0;">${verificationCode}</h1>
            </div>
            <p style="color: #ef4444; font-weight: bold;">이 코드는 10분간 유효합니다.</p>
            <p style="color: #6b7280; font-size: 14px;">
              본인이 요청하지 않았다면 이 이메일을 무시하세요.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              © 2025 PoliticianFinder. All rights reserved.
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // 이메일 발송 실패해도 인증 코드는 저장되었으므로 계속 진행
      return NextResponse.json(
        {
          success: true,
          message: '인증 코드가 생성되었으나 이메일 발송에 실패했습니다.',
          verification_id: verification.id,
          email_sent: false
        },
        { status: 200 }
      );
    }

    // 8. 성공 응답
    return NextResponse.json({
      success: true,
      message: '인증 코드가 이메일로 발송되었습니다.',
      verification_id: verification.id,
      email: email.replace(/(.{3}).+(@.+)/, '$1***$2'), // 이메일 마스킹
      expires_at: expiresAt.toISOString(),
      is_first_time: !politician.verified_email  // 최초 등록인지 여부
    });

  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
