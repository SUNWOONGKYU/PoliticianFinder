// API: POST /api/admin/report-sales/send-email
// 관리자 전용: 보고서 이메일 발송

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. 관리자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 체크
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 2. 요청 데이터
    const body = await request.json();
    const { purchase_id, email, politician_name } = body;

    if (!purchase_id || !email || !politician_name) {
      return NextResponse.json(
        { error: 'purchase_id, email, politician_name 필수' },
        { status: 400 }
      );
    }

    // 3. 구매 정보 조회
    const { data: purchase, error: purchaseError } = await supabase
      .from('report_purchases')
      .select('*')
      .eq('id', purchase_id)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: '구매 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 4. 입금 확인 체크
    if (!purchase.payment_confirmed) {
      return NextResponse.json(
        { error: '입금이 확인되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 5. 이미 발송됨
    if (purchase.sent) {
      return NextResponse.json(
        {
          error: '이미 발송된 보고서입니다.',
          sent_at: purchase.sent_at,
          sent_email: purchase.sent_email
        },
        { status: 400 }
      );
    }

    // 6. 이메일 발송
    const reportHTML = generateReportHTML(politician_name, purchase.report_type, purchase.report_period);

    try {
      await resend.emails.send({
        from: 'noreply@politicianfinder.ai.kr',
        to: email,
        subject: `[PoliticianFinder] ${politician_name}님의 상세 평가 보고서`,
        html: reportHTML
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      return NextResponse.json(
        { error: '이메일 발송 실패', details: String(emailError) },
        { status: 500 }
      );
    }

    // 7. 발송 완료 업데이트
    const { error: updateError } = await supabase
      .from('report_purchases')
      .update({
        sent: true,
        sent_at: new Date().toISOString(),
        sent_by: user.id,
        sent_email: email
      })
      .eq('id', purchase_id);

    if (updateError) {
      console.error('Failed to update purchase:', updateError);
      return NextResponse.json(
        { error: '발송 상태 업데이트 실패', details: updateError.message },
        { status: 500 }
      );
    }

    // 8. 성공 응답
    return NextResponse.json({
      success: true,
      message: '보고서가 성공적으로 발송되었습니다.',
      sent_to: email,
      sent_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 보고서 이메일 HTML 생성
function generateReportHTML(
  politicianName: string,
  reportType: string,
  reportPeriod: string | null
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .report-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .report-info h3 { color: #1e40af; margin-top: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>상세 평가 보고서</h1>
          <p>${politicianName}님</p>
        </div>

        <div class="content">
          <p>${politicianName}님 안녕하세요.</p>
          <p>PoliticianFinder에서 요청하신 <strong>${reportType}</strong> 보고서를 보내드립니다.</p>

          <div class="report-info">
            <h3>📊 보고서 정보</h3>
            <ul>
              <li><strong>보고서 유형:</strong> ${reportType}</li>
              ${reportPeriod ? `<li><strong>기간:</strong> ${reportPeriod}</li>` : ''}
              <li><strong>생성일:</strong> ${new Date().toLocaleDateString('ko-KR')}</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://politicianfinder.com/reports/${politicianName}" class="button">
              보고서 다운로드
            </a>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <strong>📌 참고사항</strong>
            <ul style="margin: 10px 0;">
              <li>보고서는 30일간 다운로드 가능합니다.</li>
              <li>문의사항은 support@politicianfinder.com으로 연락주세요.</li>
            </ul>
          </div>

          <p>감사합니다.</p>
          <p><strong>PoliticianFinder 팀</strong></p>
        </div>

        <div class="footer">
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p>© 2025 PoliticianFinder. All rights reserved.</p>
          <p>서울특별시 | contact@politicianfinder.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
