// P7BA2: PDF 보고서 이메일 발송 API
// POST /api/report-purchase/send-report

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import puppeteer from 'puppeteer';

// Lazy initialization to avoid build-time errors
const getResend = () => new Resend(process.env.RESEND_API_KEY);

const sendReportSchema = z.object({
  purchase_id: z.string().uuid('올바른 구매 ID가 아닙니다'),
});

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
    console.log('[POST /api/report-purchase/send-report] Starting...');

    // 관리자 권한 확인
    const supabaseUser = await createClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' }
      }, { status: 401 });
    }

    // 관리자 권한 체크
    const { data: userData } = await supabaseUser
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다.' }
      }, { status: 403 });
    }

    const body = await request.json();
    const validated = sendReportSchema.parse(body);

    const supabase = createAdminClient();

    // 1. 구매 정보 조회
    const { data: purchase, error: purchaseError } = await (supabase
      .from('report_purchases') as any)
      .select('*')
      .eq('id', validated.purchase_id)
      .single() as { data: any | null; error: any };

    if (purchaseError || !purchase) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '구매 정보를 찾을 수 없습니다.' }
      }, { status: 404 });
    }

    // 2. 입금 확인 체크
    if (!purchase.payment_confirmed) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_PAID', message: '입금이 확인되지 않았습니다.' }
      }, { status: 400 });
    }

    // 3. 이미 발송됨
    if (purchase.sent) {
      return NextResponse.json({
        success: false,
        error: { code: 'ALREADY_SENT', message: '이미 발송된 보고서입니다.', sent_at: purchase.sent_at }
      }, { status: 400 });
    }

    // 4. 정치인 정보 조회
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('*')
      .eq('id', purchase.politician_id)
      .single() as { data: any | null; error: any };

    if (politicianError || !politician) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '정치인 정보를 찾을 수 없습니다.' }
      }, { status: 404 });
    }

    // 5. AI 평가 데이터 조회
    const selectedAis = purchase.selected_ais || ['claude'];
    const { data: evaluations } = await (supabase
      .from('ai_evaluations') as any)
      .select('*')
      .eq('politician_id', purchase.politician_id)
      .in('ai_model', selectedAis) as { data: any[] | null; error: any };

    // 6. 같은 지역 경쟁자 조회
    const region = politician.region || politician.constituency;
    let competitors: any[] = [];

    if (region) {
      const { data: regionPoliticians } = await supabase
        .from('politicians')
        .select('id, name, party, position')
        .or(`region.eq.${region},constituency.ilike.%${region}%`)
        .neq('id', purchase.politician_id)
        .limit(5) as { data: any[] | null; error: any };

      if (regionPoliticians && regionPoliticians.length > 0) {
        const competitorIds = regionPoliticians.map(p => p.id);
        const { data: competitorEvals } = await (supabase
          .from('ai_evaluations') as any)
          .select('politician_id, overall_score, ai_model')
          .in('politician_id', competitorIds)
          .in('ai_model', selectedAis) as { data: any[] | null; error: any };

        competitors = regionPoliticians.map(p => {
          const evals = competitorEvals?.filter(e => e.politician_id === p.id) || [];
          const avgScore = evals.length > 0
            ? evals.reduce((sum, e) => sum + (e.overall_score || 0), 0) / evals.length
            : null;
          return { ...p, avg_score: avgScore };
        });
      }
    }

    // 7. HTML 보고서 생성
    const htmlContent = generateReportHTML(politician, evaluations || [], competitors, selectedAis, purchase);

    // 8. Puppeteer로 PDF 생성
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
    });

    await browser.close();

    // 9. 이메일 발송
    const resend = getResend();
    const aiNames = selectedAis.map((ai: string) => AI_NAMES[ai] || ai).join(', ');
    const fileName = `${politician.name}_AI평가보고서_${new Date().toISOString().split('T')[0]}.pdf`;

    try {
      await resend.emails.send({
        from: 'PoliticianFinder <noreply@politicianfinder.ai.kr>',
        to: purchase.buyer_email,
        subject: `[PoliticianFinder] ${politician.name}님의 AI 평가 보고서`,
        attachments: [
          {
            filename: fileName,
            content: Buffer.from(pdfBuffer).toString('base64'),
          },
        ],
        html: `
          <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #064E3B; margin-bottom: 20px;">AI 평가 보고서 발송 완료</h2>

            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              안녕하세요,<br><br>
              요청하신 <strong>${politician.name}</strong>님의 AI 평가 보고서를 보내드립니다.
            </p>

            <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #064E3B; margin: 0 0 15px 0;">보고서 정보</h3>
              <table style="width: 100%; color: #333; font-size: 14px;">
                <tr>
                  <td style="padding: 5px 0;">정치인</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: bold;">${politician.name}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">소속 정당</td>
                  <td style="padding: 5px 0; text-align: right;">${politician.party || '무소속'}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">선택 AI</td>
                  <td style="padding: 5px 0; text-align: right;">${aiNames}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">생성일</td>
                  <td style="padding: 5px 0; text-align: right;">${new Date().toLocaleDateString('ko-KR')}</td>
                </tr>
              </table>
            </div>

            <p style="color: #333; font-size: 14px;">
              첨부된 PDF 파일을 확인해주세요.
            </p>

            <p style="color: #999; font-size: 13px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              본 보고서에 대한 문의사항은 contact@politicianfinder.ai.kr로 연락주세요.
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

      console.log('[send-report] Email sent successfully to:', purchase.buyer_email);
    } catch (emailError) {
      console.error('[send-report] Email send error:', emailError);
      return NextResponse.json({
        success: false,
        error: { code: 'EMAIL_ERROR', message: '이메일 발송에 실패했습니다.', details: String(emailError) }
      }, { status: 500 });
    }

    // 10. 발송 완료 업데이트
    const { error: updateError } = await (supabase
      .from('report_purchases') as any)
      .update({
        sent: true,
        sent_at: new Date().toISOString(),
        sent_by: user.id,
        sent_email: purchase.buyer_email,
      })
      .eq('id', validated.purchase_id);

    if (updateError) {
      console.error('[send-report] Update error:', updateError);
    }

    return NextResponse.json({
      success: true,
      message: '보고서가 성공적으로 발송되었습니다.',
      sent_to: purchase.buyer_email,
      sent_at: new Date().toISOString(),
      file_name: fileName,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
      }, { status: 400 });
    }

    console.error('[send-report] Error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' }
    }, { status: 500 });
  }
}

// HTML 보고서 생성 함수 (generate-pdf와 동일)
function generateReportHTML(
  politician: any,
  evaluations: any[],
  competitors: any[],
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
  <title>${politician.name} - AI 평가 보고서</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans KR', sans-serif; color: #333; line-height: 1.6; background: #fff; }
    .header { background: linear-gradient(135deg, #064E3B 0%, #065F46 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header .subtitle { font-size: 16px; opacity: 0.9; }
    .header .meta { margin-top: 15px; font-size: 13px; opacity: 0.8; }
    .content { padding: 30px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: 700; color: #064E3B; border-bottom: 2px solid #064E3B; padding-bottom: 8px; margin-bottom: 20px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; background: #f9fafb; padding: 20px; border-radius: 8px; }
    .info-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .info-value { font-size: 15px; font-weight: 500; }
    .score-card { background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 20px; }
    .score-card .score-value { font-size: 56px; font-weight: 700; color: #064E3B; }
    .score-card .score-label { font-size: 14px; color: #065F46; margin-top: 5px; }
    .ai-scores { display: flex; gap: 15px; flex-wrap: wrap; }
    .ai-score-box { flex: 1; min-width: 150px; background: #f3f4f6; border-radius: 8px; padding: 15px; text-align: center; }
    .ai-score-box .ai-name { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
    .ai-score-box .ai-value { font-size: 28px; font-weight: 700; color: #064E3B; }
    .category-table { width: 100%; border-collapse: collapse; }
    .category-table th, .category-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .category-table th { background: #f9fafb; font-weight: 600; font-size: 13px; }
    .category-table td { font-size: 14px; }
    .category-table .score-cell { text-align: center; font-weight: 600; }
    .competitor-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .competitor-table th, .competitor-table td { padding: 10px; text-align: left; border: 1px solid #e5e7eb; font-size: 13px; }
    .competitor-table th { background: #064E3B; color: white; font-weight: 500; }
    .competitor-table tr:nth-child(even) { background: #f9fafb; }
    .competitor-table .highlight { background: #ecfdf5 !important; font-weight: 600; }
    .strength-weakness { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .sw-box { padding: 15px; border-radius: 8px; }
    .strength-box { background: #ecfdf5; border-left: 4px solid #10b981; }
    .weakness-box { background: #fef3c7; border-left: 4px solid #f59e0b; }
    .sw-title { font-weight: 600; margin-bottom: 10px; font-size: 14px; }
    .sw-item { font-size: 13px; padding: 5px 0; display: flex; justify-content: space-between; }
    .comment-box { background: #f9fafb; border-radius: 8px; padding: 20px; margin-top: 10px; }
    .comment-ai { font-weight: 600; color: #064E3B; margin-bottom: 8px; }
    .comment-text { font-size: 14px; line-height: 1.8; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${politician.name} 상세 평가 보고서</h1>
    <div class="subtitle">${politician.party || '무소속'} | ${politician.position || '정치인'}</div>
    <div class="meta">생성일: ${new Date().toLocaleDateString('ko-KR')} | 주문번호: ${purchase.id.substring(0, 8).toUpperCase()}</div>
  </div>
  <div class="content">
    <div class="section">
      <h2 class="section-title">기본 정보</h2>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">이름</div><div class="info-value">${politician.name}</div></div>
        <div class="info-item"><div class="info-label">소속 정당</div><div class="info-value">${politician.party || '무소속'}</div></div>
        <div class="info-item"><div class="info-label">현재 직위</div><div class="info-value">${politician.position || '-'}</div></div>
        <div class="info-item"><div class="info-label">지역구</div><div class="info-value">${politician.constituency || politician.region || '-'}</div></div>
      </div>
    </div>
    <div class="section">
      <h2 class="section-title">종합 평가 점수</h2>
      <div class="score-card">
        <div class="score-value">${overallAvg.toFixed(1)}</div>
        <div class="score-label">AI 종합 평가 점수 (100점 만점)</div>
      </div>
      <div class="ai-scores">
        ${selectedAis.map(ai => `<div class="ai-score-box"><div class="ai-name">${AI_NAMES[ai] || ai}</div><div class="ai-value">${(avgScores[ai] || 0).toFixed(1)}</div></div>`).join('')}
      </div>
    </div>
    <div class="section">
      <h2 class="section-title">카테고리별 평가</h2>
      <table class="category-table">
        <thead><tr><th>평가 항목</th>${selectedAis.map(ai => `<th class="score-cell">${AI_NAMES[ai] || ai}</th>`).join('')}<th class="score-cell">평균</th></tr></thead>
        <tbody>
          ${Object.keys(CATEGORY_NAMES).map(cat => {
            const scores = selectedAis.map(ai => categoryScores[ai]?.[cat] || 0);
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            return `<tr><td>${CATEGORY_NAMES[cat]}</td>${scores.map(s => `<td class="score-cell">${s.toFixed(1)}</td>`).join('')}<td class="score-cell" style="font-weight: 700;">${avg.toFixed(1)}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div class="section">
      <h2 class="section-title">강점 / 약점 분석</h2>
      <div class="strength-weakness">
        <div class="sw-box strength-box">
          <div class="sw-title">강점 TOP 3</div>
          ${strengths.map((s, i) => `<div class="sw-item"><span>${i + 1}. ${CATEGORY_NAMES[s.category] || s.category}</span><span>${s.score.toFixed(1)}점</span></div>`).join('')}
        </div>
        <div class="sw-box weakness-box">
          <div class="sw-title">개선 필요 TOP 3</div>
          ${weaknesses.map((w, i) => `<div class="sw-item"><span>${i + 1}. ${CATEGORY_NAMES[w.category] || w.category}</span><span>${w.score.toFixed(1)}점</span></div>`).join('')}
        </div>
      </div>
    </div>
    ${competitors.length > 0 ? `
    <div class="section">
      <h2 class="section-title">같은 지역 경쟁자 비교</h2>
      <p style="font-size: 13px; color: #6b7280; margin-bottom: 15px;">${politician.constituency || politician.region || '해당 지역'} 소속 정치인과의 비교</p>
      <table class="competitor-table">
        <thead><tr><th>순위</th><th>이름</th><th>소속 정당</th><th>AI 평균 점수</th></tr></thead>
        <tbody>
          <tr class="highlight"><td>-</td><td>${politician.name}</td><td>${politician.party || '무소속'}</td><td>${overallAvg.toFixed(1)}점</td></tr>
          ${competitors.filter(c => c.avg_score !== null).sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0)).map((c, i) => `<tr><td>${i + 1}</td><td>${c.name}</td><td>${c.party || '무소속'}</td><td>${c.avg_score?.toFixed(1) || '-'}점</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
    <div class="section page-break">
      <h2 class="section-title">AI 평가 상세 코멘트</h2>
      ${evaluations.map(ev => `<div class="comment-box"><div class="comment-ai">${AI_NAMES[ev.ai_model] || ev.ai_model} 평가</div><div class="comment-text">${ev.summary || ev.evaluation_text || '평가 코멘트가 없습니다.'}</div></div>`).join('')}
    </div>
  </div>
  <div class="footer">
    <p>본 보고서는 PoliticianFinder에서 AI 기반으로 생성된 평가 자료입니다.</p>
    <p>© 2025 PoliticianFinder. All rights reserved.</p>
    <p>https://www.politicianfinder.ai.kr</p>
  </div>
</body>
</html>
`;
}
