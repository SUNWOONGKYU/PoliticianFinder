// P7BA1: 보고서 구매 - 이메일 인증 코드 발송
// POST /api/report-purchase/send-code

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
const getResend = () => new Resend(process.env.RESEND_API_KEY);

const sendCodeSchema = z.object({
  politician_id: z.string().min(1, '정치인 ID가 필요합니다'),
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  selected_ais: z.array(z.string()).min(1, '최소 1개 AI를 선택해주세요'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/report-purchase/send-code] Starting...');

    const body = await request.json();
    const validated = sendCodeSchema.parse(body);

    console.log('[send-code] politician_id:', validated.politician_id);
    console.log('[send-code] email:', validated.email);
    console.log('[send-code] selected_ais:', validated.selected_ais);

    const supabase = createAdminClient();

    // 1. 정치인 정보 조회
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id, name, party, position')
      .eq('id', validated.politician_id)
      .single() as { data: { id: string; name: string; party: string | null; position: string | null } | null; error: any };

    if (politicianError || !politician) {
      console.log('[send-code] Politician not found:', politicianError);
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '정치인을 찾을 수 없습니다.' }
      }, { status: 404 });
    }

    console.log('[send-code] Found politician:', politician.name);

    // 2. 6자리 영숫자 인증 코드 생성
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동되기 쉬운 문자 제외
    let verificationCode = '';
    for (let i = 0; i < 6; i++) {
      verificationCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // 3. 만료 시간 설정 (10분)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // 4. 기존 미사용 코드 삭제 (같은 이메일, 같은 정치인)
    await supabase
      .from('email_verifications')
      .delete()
      .eq('politician_id', validated.politician_id)
      .eq('email', validated.email)
      .eq('verified', false);

    // 5. DB에 저장
    const { data: verification, error: insertError } = await (supabase
      .from('email_verifications') as any)
      .insert({
        politician_id: validated.politician_id,
        email: validated.email,
        verification_code: verificationCode,
        purpose: 'report_purchase',
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

    // 6. 가격 계산
    const PRICE_PER_AI = 330000;
    const aiCount = validated.selected_ais.length;
    const totalPrice = PRICE_PER_AI * aiCount;

    // 7. AI 이름 매핑
    const aiNames: Record<string, string> = {
      claude: 'Claude',
      chatgpt: 'ChatGPT',
      grok: 'Grok',
    };
    const selectedAiNames = validated.selected_ais.map(ai => aiNames[ai] || ai).join(', ');

    // 8. 이메일 발송 (Resend)
    const resend = getResend();
    try {
      await resend.emails.send({
        from: 'PoliticianFinder <noreply@politicianfinder.ai.kr>',
        to: validated.email,
        subject: `[PoliticianFinder] 보고서 구매 인증 코드`,
        html: `
          <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #064E3B; margin-bottom: 20px;">보고서 구매 인증</h2>

            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              <strong>${politician.name}</strong>님의 AI 평가 보고서 구매를 위한 인증 코드입니다.
            </p>

            <div style="background: #f3f4f6; padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0;">
              <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">인증 코드</p>
              <h1 style="color: #064E3B; font-size: 42px; letter-spacing: 10px; margin: 0; font-family: monospace;">
                ${verificationCode}
              </h1>
            </div>

            <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #064E3B; margin: 0 0 15px 0;">📋 구매 정보</h3>
              <table style="width: 100%; color: #333;">
                <tr>
                  <td style="padding: 5px 0;">정치인</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: bold;">${politician.name} (${politician.party || '무소속'})</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">선택한 AI</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: bold;">${selectedAiNames}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">AI 수</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: bold;">${aiCount}개</td>
                </tr>
                <tr style="border-top: 1px solid #10b981;">
                  <td style="padding: 10px 0 5px 0; font-weight: bold;">총 금액</td>
                  <td style="padding: 10px 0 5px 0; text-align: right; font-weight: bold; color: #064E3B; font-size: 18px;">
                    ${totalPrice.toLocaleString()}원
                  </td>
                </tr>
              </table>
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
      // 이메일 발송 실패해도 인증 코드는 생성됨 (개발 환경 대비)
    }

    // 9. 응답 (이메일 일부 마스킹)
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
      },
      purchase_info: {
        selected_ais: validated.selected_ais,
        ai_count: aiCount,
        total_price: totalPrice,
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
