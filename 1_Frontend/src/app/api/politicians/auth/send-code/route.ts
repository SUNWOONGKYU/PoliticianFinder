// Task: P4BA20 - 정치인 통합 이메일 인증 시스템
// POST /api/politicians/auth/send-code - 인증 코드 발송

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendCodeSchema = z.object({
  politician_id: z.string().min(1, '정치인을 선택해주세요'),
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/politicians/auth/send-code] Starting...');

    const body = await request.json();
    const validated = sendCodeSchema.parse(body);

    console.log('[send-code] politician_id:', validated.politician_id);
    console.log('[send-code] email:', validated.email);

    const supabase = createAdminClient();

    // 1. 정치인 존재 확인 (등록된 정치인만)
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id, name, party, position')
      .eq('id', validated.politician_id)
      .single() as { data: { id: string; name: string; party: string; position: string } | null; error: any };

    if (politicianError || !politician) {
      console.log('[send-code] Politician not found:', politicianError);
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '등록된 정치인이 아닙니다.' }
      }, { status: 404 });
    }

    console.log('[send-code] Found politician:', politician.name);

    // 2. 6자리 숫자 인증 코드 생성
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));

    // 3. 만료 시간 설정 (10분)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // 4. DB에 저장
    const { data: verification, error: insertError } = await (supabase as any)
      .from('politician_email_verifications')
      .insert({
        politician_id: validated.politician_id,
        email: validated.email,
        verification_code: verificationCode,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single() as { data: { id: string } | null; error: any };

    if (insertError || !verification) {
      console.error('[send-code] Insert error:', insertError);
      return NextResponse.json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: '인증 코드 생성 실패', details: insertError?.message }
      }, { status: 500 });
    }

    console.log('[send-code] Verification created:', verification.id);

    // 5. 이메일 발송 (Resend)
    try {
      await resend.emails.send({
        from: 'PoliticianFinder <noreply@politicianfinder.ai.kr>',
        to: validated.email,
        subject: `[PoliticianFinder] ${politician.name}님 본인 인증 코드`,
        html: `
          <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #064E3B; margin-bottom: 20px;">안녕하세요, ${politician.name}님</h2>

            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              PoliticianFinder 본인 인증을 위한 코드입니다.
            </p>

            <div style="background: #f3f4f6; padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0;">
              <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">인증 코드</p>
              <h1 style="color: #064E3B; font-size: 42px; letter-spacing: 10px; margin: 0; font-family: monospace;">
                ${verificationCode}
              </h1>
            </div>

            <p style="color: #666; font-size: 14px;">
              <strong>유효 시간:</strong> 10분
            </p>

            <p style="color: #999; font-size: 13px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; margin: 0;">
                PoliticianFinder<br>
                https://www.politicianfinder.ai.kr
              </p>
            </div>
          </div>
        `,
      });

      console.log('[send-code] Email sent successfully');
    } catch (emailError) {
      console.error('[send-code] Email send error:', emailError);
    }

    // 6. 응답 (이메일 일부 마스킹)
    const emailParts = validated.email.split('@');
    const maskedEmail = emailParts[0].substring(0, 2) + '***@' + emailParts[1];

    return NextResponse.json({
      success: true,
      message: '인증 코드가 발송되었습니다.',
      verification_id: verification.id,
      email: maskedEmail,
      expires_at: expiresAt.toISOString(),
      politician: {
        id: politician.id,
        name: politician.name,
        party: politician.party,
        position: politician.position,
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
      }, { status: 400 });
    }

    console.error('[send-code] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' }
    }, { status: 500 });
  }
}
