// P7BA1: 보고서 구매 - 구매 신청 API
// POST /api/report-purchase

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
const getResend = () => new Resend(process.env.RESEND_API_KEY);

// 구매 회차별 가격 (부가세 별도)
const getPriceByPurchaseCount = (count: number): number => {
  if (count <= 1) return 1000000; // 1차: 100만원
  if (count === 2) return 900000;  // 2차: 90만원
  if (count === 3) return 800000;  // 3차: 80만원
  if (count === 4) return 700000;  // 4차: 70만원
  if (count === 5) return 600000;  // 5차: 60만원
  return 500000; // 6차 이후: 50만원 (최소가)
};

const VAT_RATE = 0.1;

const purchaseSchema = z.object({
  verification_id: z.string().uuid('올바른 인증 ID가 아닙니다'),
  politician_id: z.string().min(1, '정치인 ID가 필요합니다'),
  buyer_name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  buyer_email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  depositor_name: z.string().min(2, '입금자명을 입력해주세요'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/report-purchase] Starting...');

    const body = await request.json();
    const validated = purchaseSchema.parse(body);

    console.log('[purchase] verification_id:', validated.verification_id);
    console.log('[purchase] politician_id:', validated.politician_id);

    const supabase = createAdminClient();

    // 1. 이메일 인증 확인
    const { data: verification, error: verifyError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('id', validated.verification_id)
      .eq('verified', true)
      .single() as { data: { id: string; email: string; politician_id: string; verified: boolean } | null; error: any };

    if (verifyError || !verification) {
      console.log('[purchase] Verification not found or not verified:', verifyError);
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_VERIFIED', message: '이메일 인증이 완료되지 않았습니다.' }
      }, { status: 400 });
    }

    // 2. 인증된 이메일과 구매자 이메일 일치 확인
    if (verification.email !== validated.buyer_email) {
      return NextResponse.json({
        success: false,
        error: { code: 'EMAIL_MISMATCH', message: '인증된 이메일과 구매자 이메일이 일치하지 않습니다.' }
      }, { status: 400 });
    }

    // 3. 정치인 정보 조회
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id, name, party, position')
      .eq('id', validated.politician_id)
      .single() as { data: { id: string; name: string; party: string | null; position: string | null } | null; error: any };

    if (politicianError || !politician) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '정치인을 찾을 수 없습니다.' }
      }, { status: 404 });
    }

    // 4. 해당 정치인의 이전 구매 횟수 조회
    const { data: previousPurchases } = await supabase
      .from('report_purchases')
      .select('id')
      .eq('politician_id', validated.politician_id)
      .eq('payment_confirmed', true) as { data: { id: string }[] | null; error: any };

    const purchaseCount = (previousPurchases?.length || 0) + 1;

    // 5. 가격 계산
    const basePrice = getPriceByPurchaseCount(purchaseCount);
    const vatAmount = Math.round(basePrice * VAT_RATE);
    const totalAmount = basePrice + vatAmount;

    // 6. 할인율 계산
    const originalPrice = 1000000; // 기본가 100만원
    const discountAmount = originalPrice - basePrice;
    const discountRate = discountAmount / originalPrice;

    // 7. 구매 정보 저장
    const { data: purchase, error: insertError } = await (supabase
      .from('report_purchases') as any)
      .insert({
        politician_id: validated.politician_id,
        buyer_name: validated.buyer_name,
        buyer_email: validated.buyer_email,
        amount: totalAmount,
        original_amount: originalPrice + Math.round(originalPrice * VAT_RATE), // 원가 (VAT 포함)
        currency: 'KRW',
        report_type: 'integrated', // 통합 보고서
        selected_ais: ['claude', 'chatgpt', 'gemini', 'grok'], // 4개 AI 모두
        purchase_count: purchaseCount,
        discount_rate: discountRate,
        notes: `입금자명: ${validated.depositor_name} | ${purchaseCount}차 구매`,
      })
      .select()
      .single() as { data: { id: string; created_at: string } | null; error: any };

    if (insertError || !purchase) {
      console.error('[purchase] Insert error:', insertError);
      return NextResponse.json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: '구매 정보 저장 실패', details: insertError?.message }
      }, { status: 500 });
    }

    console.log('[purchase] Purchase created:', purchase.id);

    // 8. 구매 확인 이메일 발송
    const resend = getResend();
    try {
      await resend.emails.send({
        from: 'PoliticianFinder <noreply@politicianfinder.ai.kr>',
        to: validated.buyer_email,
        subject: `[PoliticianFinder] 보고서 구매 신청 완료 - ${politician.name}`,
        html: `
          <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #064E3B; margin-bottom: 20px;">보고서 구매 신청이 완료되었습니다</h2>

            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              <strong>${politician.name}</strong>님의 AI 통합 평가 보고서 구매 신청이 접수되었습니다.
            </p>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #92400e; margin: 0 0 15px 0;">💰 입금 안내</h3>
              <table style="width: 100%; color: #333;">
                <tr>
                  <td style="padding: 8px 0;">은행</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">하나은행</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">계좌번호</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; font-family: monospace;">287-910921-40507</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">예금주</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">파인더월드</td>
                </tr>
                <tr style="border-top: 2px solid #f59e0b;">
                  <td style="padding: 12px 0; font-weight: bold; font-size: 18px;">입금 금액</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #92400e; font-size: 24px;">
                    ${totalAmount.toLocaleString()}원
                  </td>
                </tr>
              </table>
            </div>

            <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #064E3B; margin: 0 0 15px 0;">📋 주문 정보</h3>
              <table style="width: 100%; color: #333;">
                <tr>
                  <td style="padding: 5px 0;">주문번호</td>
                  <td style="padding: 5px 0; text-align: right; font-family: monospace;">${purchase.id.substring(0, 8).toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">정치인</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: bold;">${politician.name} (${politician.party || '무소속'})</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">상품</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: bold;">AI 통합 평가 보고서</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">구매자명</td>
                  <td style="padding: 5px 0; text-align: right;">${validated.buyer_name}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">입금자명</td>
                  <td style="padding: 5px 0; text-align: right;">${validated.depositor_name}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">구매 회차</td>
                  <td style="padding: 5px 0; text-align: right;">${purchaseCount}차</td>
                </tr>
                ${discountRate > 0 ? `
                <tr>
                  <td style="padding: 5px 0;">할인</td>
                  <td style="padding: 5px 0; text-align: right; color: #dc2626;">-${discountAmount.toLocaleString()}원 (${(discountRate * 100).toFixed(0)}%)</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                <strong>📌 안내사항</strong><br>
                • 입금 확인 후 영업일 기준 1-2일 내 보고서가 이메일로 발송됩니다.<br>
                • 입금 시 반드시 입금자명을 확인해주세요.<br>
                • 문의: contact@politicianfinder.ai.kr
              </p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; margin: 0;">
                PoliticianFinder<br>
                https://www.politicianfinder.ai.kr
              </p>
            </div>
          </div>
        `,
      });

      console.log('[purchase] Confirmation email sent');
    } catch (emailError) {
      console.error('[purchase] Email send error:', emailError);
      // 이메일 발송 실패해도 구매는 성공 처리
    }

    // 9. 관리자에게 알림 이메일 발송
    try {
      await resend.emails.send({
        from: 'PoliticianFinder <noreply@politicianfinder.ai.kr>',
        to: 'wksun99@gmail.com', // 관리자 이메일
        subject: `[관리자 알림] 새 보고서 구매 신청 - ${politician.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>새 보고서 구매 신청</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;">주문번호</td><td style="padding: 8px; border: 1px solid #ddd;">${purchase.id}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">정치인</td><td style="padding: 8px; border: 1px solid #ddd;">${politician.name}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">구매자</td><td style="padding: 8px; border: 1px solid #ddd;">${validated.buyer_name}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">이메일</td><td style="padding: 8px; border: 1px solid #ddd;">${validated.buyer_email}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">입금자명</td><td style="padding: 8px; border: 1px solid #ddd;">${validated.depositor_name}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">상품</td><td style="padding: 8px; border: 1px solid #ddd;">AI 통합 평가 보고서</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">금액</td><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${totalAmount.toLocaleString()}원</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">구매 회차</td><td style="padding: 8px; border: 1px solid #ddd;">${purchaseCount}차</td></tr>
            </table>
            <p style="margin-top: 20px;">
              <a href="https://www.politicianfinder.ai.kr/admin/report-sales" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                관리자 페이지에서 확인
              </a>
            </p>
          </div>
        `,
      });
      console.log('[purchase] Admin notification email sent');
    } catch (emailError) {
      console.error('[purchase] Admin email error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: '구매 신청이 완료되었습니다.',
      purchase: {
        id: purchase.id,
        order_number: purchase.id.substring(0, 8).toUpperCase(),
        politician: {
          id: politician.id,
          name: politician.name,
          party: politician.party,
        },
        report_type: 'integrated',
        amount: totalAmount,
        base_price: basePrice,
        vat_amount: vatAmount,
        discount_rate: discountRate,
        purchase_count: purchaseCount,
        bank_info: {
          bank: '하나은행',
          account: '287-910921-40507',
          holder: '파인더월드',
        },
        created_at: purchase.created_at,
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
      }, { status: 400 });
    }

    console.error('[purchase] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' }
    }, { status: 500 });
  }
}
