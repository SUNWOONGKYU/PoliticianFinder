// API: POST /api/admin/report-sales/send
// 관리자 전용: HTML 보고서 이메일 발송

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const getResend = () => new Resend(process.env.RESEND_API_KEY);

// AI 이름 매핑
const AI_NAMES: Record<string, string> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  grok: 'Grok',
};

// 카테고리 이름 매핑
const CATEGORY_NAMES: Record<string, string> = {
  leadership: '리더십',
  policy: '정책',
  communication: '소통',
  integrity: '청렴도',
  achievement: '업적',
  vision: '비전',
  expertise: '전문성',
  crisis_management: '위기관리',
};

export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/admin/report-sales/send] Starting...');

    // 관리자 쿠키 확인
    const isAdmin = request.cookies.get('isAdmin')?.value === 'true';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { purchase_id } = body;

    if (!purchase_id) {
      return NextResponse.json(
        { success: false, error: 'purchase_id가 필요합니다.' },
        { status: 400 }
      );
    }

    // Service Role로 Supabase 클라이언트 생성 (RLS 우회)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. 구매 정보 조회
    const { data: purchase, error: purchaseError } = await supabase
      .from('report_purchases')
      .select('*')
      .eq('id', purchase_id)
      .single();

    if (purchaseError || !purchase) {
      console.error('Purchase not found:', purchaseError);
      return NextResponse.json(
        { success: false, error: '구매 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 2. 입금 확인 체크
    if (!purchase.payment_confirmed) {
      return NextResponse.json(
        { success: false, error: '입금이 확인되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 3. 이미 발송됨
    if (purchase.sent) {
      return NextResponse.json(
        { success: false, error: '이미 발송된 보고서입니다.', sent_at: purchase.sent_at },
        { status: 400 }
      );
    }

    // 4. 정치인 정보 조회
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('*')
      .eq('id', purchase.politician_id)
      .single();

    if (politicianError || !politician) {
      console.error('Politician not found:', politicianError);
      return NextResponse.json(
        { success: false, error: '정치인 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 5. AI 평가 데이터 조회
    const selectedAis = purchase.selected_ais || ['claude'];
    const { data: evaluations } = await supabase
      .from('ai_evaluations')
      .select('*')
      .eq('politician_id', purchase.politician_id)
      .in('ai_model', selectedAis);

    // 6. HTML 보고서 생성
    console.log('[send] Generating HTML report...');
    const htmlReport = generateReportHTML(politician, evaluations || [], selectedAis, purchase);

    // 7. 이메일 발송
    const resend = getResend();
    const aiNames = selectedAis.map((ai: string) => AI_NAMES[ai] || ai).join(', ');

    try {
      await resend.emails.send({
        from: 'PoliticianFinder <noreply@politicianfinder.ai.kr>',
        to: purchase.buyer_email,
        subject: `[PoliticianFinder] ${politician.name}님의 AI 평가 보고서`,
        html: htmlReport,
      });

      console.log('[send] Email sent successfully to:', purchase.buyer_email?.substring(0, 3) + '***@***');
    } catch (emailError) {
      console.error('[send] Email send error:', emailError);
      return NextResponse.json({
        success: false,
        error: '이메일 발송에 실패했습니다.',
        details: String(emailError)
      }, { status: 500 });
    }

    // 8. 발송 완료 업데이트
    const { error: updateError } = await supabase
      .from('report_purchases')
      .update({
        sent: true,
        sent_at: new Date().toISOString(),
        sent_email: purchase.buyer_email,
      })
      .eq('id', purchase_id);

    if (updateError) {
      console.error('[send] Update error:', updateError);
    }

    return NextResponse.json({
      success: true,
      message: '보고서가 성공적으로 발송되었습니다.',
      sent_to: purchase.buyer_email,
      sent_at: new Date().toISOString(),
      file_name: `${politician.name}_AI평가보고서.html`,
    });

  } catch (error) {
    console.error('[send] Error:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      details: String(error)
    }, { status: 500 });
  }
}

// HTML 보고서 생성 함수
function generateReportHTML(
  politician: any,
  evaluations: any[],
  selectedAis: string[],
  purchase: any
): string {
  const avgScores: Record<string, number> = {};
  const categoryScores: Record<string, Record<string, number>> = {};

  evaluations.forEach(ev => {
    avgScores[ev.ai_model] = ev.overall_score || 0;
    if (ev.category_scores) {
      categoryScores[ev.ai_model] = typeof ev.category_scores === 'string'
        ? JSON.parse(ev.category_scores)
        : ev.category_scores;
    }
  });

  const overallAvg = evaluations.length > 0
    ? evaluations.reduce((sum, ev) => sum + (ev.overall_score || 0), 0) / evaluations.length
    : 0;

  const allCategoryScores: Record<string, number[]> = {};
  Object.values(categoryScores).forEach(scores => {
    Object.entries(scores).forEach(([cat, score]) => {
      if (!allCategoryScores[cat]) allCategoryScores[cat] = [];
      allCategoryScores[cat].push(score);
    });
  });

  const avgCategoryScores = Object.entries(allCategoryScores).map(([cat, scores]) => ({
    category: cat,
    score: scores.reduce((a, b) => a + b, 0) / scores.length,
  })).sort((a, b) => b.score - a.score);

  const strengths = avgCategoryScores.slice(0, 3);
  const weaknesses = avgCategoryScores.slice(-3).reverse();

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${politician.name} - AI 평가 보고서</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- 헤더 -->
          <tr>
            <td style="background: linear-gradient(135deg, #064E3B 0%, #065F46 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 10px 0;">${politician.name} 상세 평가 보고서</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0 0 10px 0;">${politician.party || '무소속'} | ${politician.position || '정치인'}</p>
              <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 0;">생성일: ${new Date().toLocaleDateString('ko-KR')} | 주문번호: ${purchase.id.substring(0, 8).toUpperCase()}</p>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding: 30px;">
              <!-- 기본 정보 -->
              <h2 style="font-size: 18px; font-weight: 700; color: #064E3B; border-bottom: 2px solid #064E3B; padding-bottom: 8px; margin: 0 0 20px 0;">기본 정보</h2>
              <table width="100%" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td width="50%" style="padding: 8px 0;">
                    <span style="font-size: 12px; color: #6b7280;">이름</span><br>
                    <span style="font-size: 15px; font-weight: 500;">${politician.name}</span>
                  </td>
                  <td width="50%" style="padding: 8px 0;">
                    <span style="font-size: 12px; color: #6b7280;">소속 정당</span><br>
                    <span style="font-size: 15px; font-weight: 500;">${politician.party || '무소속'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 12px; color: #6b7280;">현재 직위</span><br>
                    <span style="font-size: 15px; font-weight: 500;">${politician.position || '-'}</span>
                  </td>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 12px; color: #6b7280;">지역구</span><br>
                    <span style="font-size: 15px; font-weight: 500;">${politician.constituency || politician.region || '-'}</span>
                  </td>
                </tr>
              </table>

              <!-- 종합 평가 점수 -->
              <h2 style="font-size: 18px; font-weight: 700; color: #064E3B; border-bottom: 2px solid #064E3B; padding-bottom: 8px; margin: 0 0 20px 0;">종합 평가 점수</h2>
              ${evaluations.length > 0 ? `
              <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 20px;">
                <div style="font-size: 56px; font-weight: 700; color: #064E3B;">${overallAvg.toFixed(1)}</div>
                <div style="font-size: 14px; color: #065F46; margin-top: 5px;">AI 종합 평가 점수 (100점 만점)</div>
              </div>

              <!-- AI별 점수 -->
              <table width="100%" cellpadding="10" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  ${selectedAis.map(ai => `
                    <td style="text-align: center; background: #f3f4f6; border-radius: 8px; padding: 15px;">
                      <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">${AI_NAMES[ai] || ai}</div>
                      <div style="font-size: 28px; font-weight: 700; color: #064E3B;">${(avgScores[ai] || 0).toFixed(1)}</div>
                    </td>
                  `).join('')}
                </tr>
              </table>

              ${Object.keys(categoryScores).length > 0 ? `
              <!-- 카테고리별 평가 -->
              <h2 style="font-size: 18px; font-weight: 700; color: #064E3B; border-bottom: 2px solid #064E3B; padding-bottom: 8px; margin: 0 0 20px 0;">카테고리별 평가</h2>
              <table width="100%" style="border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 13px;">평가 항목</th>
                    ${selectedAis.map(ai => `<th style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${AI_NAMES[ai] || ai}</th>`).join('')}
                    <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 700;">평균</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.keys(CATEGORY_NAMES).map(cat => {
                    const scores = selectedAis.map(ai => categoryScores[ai]?.[cat] || 0);
                    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                    return `
                      <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${CATEGORY_NAMES[cat]}</td>
                        ${scores.map(s => `<td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${s.toFixed(1)}</td>`).join('')}
                        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 14px; font-weight: 700;">${avg.toFixed(1)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>

              <!-- 강점/약점 분석 -->
              <h2 style="font-size: 18px; font-weight: 700; color: #064E3B; border-bottom: 2px solid #064E3B; padding-bottom: 8px; margin: 0 0 20px 0;">강점 / 약점 분석</h2>
              <table width="100%" cellpadding="0" cellspacing="10" style="margin-bottom: 30px;">
                <tr>
                  <td width="50%" style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 8px; vertical-align: top;">
                    <div style="font-weight: 600; margin-bottom: 10px; font-size: 14px;">강점 TOP 3</div>
                    ${strengths.length > 0
                      ? strengths.map((s, i) => `<div style="font-size: 13px; padding: 5px 0;">${i + 1}. ${CATEGORY_NAMES[s.category] || s.category}: ${s.score.toFixed(1)}점</div>`).join('')
                      : '<div style="font-size: 13px; padding: 5px 0;">데이터 없음</div>'}
                  </td>
                  <td width="50%" style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; vertical-align: top;">
                    <div style="font-weight: 600; margin-bottom: 10px; font-size: 14px;">개선 필요 TOP 3</div>
                    ${weaknesses.length > 0
                      ? weaknesses.map((w, i) => `<div style="font-size: 13px; padding: 5px 0;">${i + 1}. ${CATEGORY_NAMES[w.category] || w.category}: ${w.score.toFixed(1)}점</div>`).join('')
                      : '<div style="font-size: 13px; padding: 5px 0;">데이터 없음</div>'}
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- AI 평가 코멘트 -->
              <h2 style="font-size: 18px; font-weight: 700; color: #064E3B; border-bottom: 2px solid #064E3B; padding-bottom: 8px; margin: 0 0 20px 0;">AI 평가 상세 코멘트</h2>
              ${evaluations.map(ev => `
                <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                  <div style="font-weight: 600; color: #064E3B; margin-bottom: 8px;">${AI_NAMES[ev.ai_model] || ev.ai_model} 평가</div>
                  <div style="font-size: 14px; line-height: 1.8; color: #374151;">${ev.summary || ev.evaluation_text || '평가 코멘트가 없습니다.'}</div>
                </div>
              `).join('')}
              ` : `
              <div style="text-align: center; padding: 40px; color: #6b7280;">AI 평가 데이터가 없습니다.</div>
              `}
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">본 보고서는 PoliticianFinder에서 AI 기반으로 생성된 평가 자료입니다.</p>
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">&copy; 2025 PoliticianFinder. All rights reserved.</p>
              <p style="font-size: 12px; color: #10b981; margin: 0;">
                <a href="https://www.politicianfinder.ai.kr" style="color: #10b981; text-decoration: none;">https://www.politicianfinder.ai.kr</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
