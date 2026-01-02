// API: POST /api/admin/report-sales/send
// 관리자 전용: PDF 보고서 생성 및 이메일 발송

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const getResend = () => new Resend(process.env.RESEND_API_KEY);

// AI 이름 매핑
const AI_NAMES: Record<string, string> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  grok: 'Grok',
};

// 카테고리 이름 매핑 (한글)
const CATEGORY_NAMES_KR: Record<string, string> = {
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

    // 3. 정치인 정보 조회
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

    // 4. AI 평가 데이터 조회
    const selectedAis = purchase.selected_ais || ['claude'];
    const { data: evaluations } = await supabase
      .from('ai_evaluations')
      .select('*')
      .eq('politician_id', purchase.politician_id)
      .in('ai_model', selectedAis);

    // 5. PDF 생성 (영문 전용)
    console.log('[send] Generating PDF...');
    const pdfBytes = await generatePDF(politician, evaluations || [], selectedAis, purchase);
    console.log('[send] PDF generated, size:', pdfBytes.length);

    // 6. 이메일 발송 (한글 포함)
    const resend = getResend();
    const aiNames = selectedAis.map((ai: string) => AI_NAMES[ai] || ai).join(', ');
    const fileName = `AI_Report_${purchase.id.substring(0, 8).toUpperCase()}.pdf`;

    try {
      const emailResult = await resend.emails.send({
        from: 'PoliticianFinder <noreply@politicianfinder.ai.kr>',
        to: purchase.buyer_email,
        subject: `[PoliticianFinder] ${politician.name}님의 AI 평가 보고서`,
        attachments: [
          {
            filename: fileName,
            content: Buffer.from(pdfBytes).toString('base64'),
          },
        ],
        html: generateEmailHTML(politician, evaluations || [], selectedAis, purchase),
      });

      console.log('[send] Email sent successfully:', emailResult);
    } catch (emailError) {
      console.error('[send] Email send error:', emailError);
      return NextResponse.json({
        success: false,
        error: '이메일 발송에 실패했습니다.',
        details: String(emailError)
      }, { status: 500 });
    }

    // 7. 발송 완료 업데이트
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
      file_name: fileName,
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

// PDF 생성 함수 (한글 지원 - Pretendard 폰트 사용)
async function generatePDF(
  politician: any,
  evaluations: any[],
  selectedAis: string[],
  purchase: any
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // fontkit 등록
  pdfDoc.registerFontkit(fontkit);

  // 폰트 로드 (public 폴더에서 fetch)
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  let regularFont, boldFont;

  try {
    // Vercel 환경에서는 fetch로 가져오기
    const [regularRes, boldRes] = await Promise.all([
      fetch(`${baseUrl}/fonts/Pretendard-Regular.ttf`),
      fetch(`${baseUrl}/fonts/Pretendard-Bold.ttf`)
    ]);

    if (!regularRes.ok || !boldRes.ok) {
      throw new Error('Font fetch failed');
    }

    const regularFontBytes = await regularRes.arrayBuffer();
    const boldFontBytes = await boldRes.arrayBuffer();

    regularFont = await pdfDoc.embedFont(regularFontBytes);
    boldFont = await pdfDoc.embedFont(boldFontBytes);
  } catch (fontError) {
    console.log('[PDF] Font fetch failed, trying file system:', fontError);
    // 로컬 환경에서는 파일 시스템에서 읽기
    try {
      const publicDir = join(process.cwd(), 'public', 'fonts');
      const regularFontBytes = readFileSync(join(publicDir, 'Pretendard-Regular.ttf'));
      const boldFontBytes = readFileSync(join(publicDir, 'Pretendard-Bold.ttf'));

      regularFont = await pdfDoc.embedFont(regularFontBytes);
      boldFont = await pdfDoc.embedFont(boldFontBytes);
    } catch (fsError) {
      console.error('[PDF] File system font load also failed:', fsError);
      throw new Error('폰트를 로드할 수 없습니다.');
    }
  }

  // 첫 페이지
  let page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  let yPos = height - 50;

  // 색상 정의
  const darkGreen = rgb(0.024, 0.306, 0.231);
  const lightGreen = rgb(0.063, 0.725, 0.506);
  const gray = rgb(0.42, 0.45, 0.49);
  const black = rgb(0, 0, 0);

  // 헤더 배경
  page.drawRectangle({
    x: 0,
    y: height - 140,
    width: width,
    height: 140,
    color: darkGreen,
  });

  // 제목
  page.drawText('AI 평가 보고서', {
    x: 50,
    y: height - 50,
    size: 28,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // 정치인 이름
  page.drawText(politician.name, {
    x: 50,
    y: height - 85,
    size: 20,
    font: boldFont,
    color: rgb(0.9, 0.9, 0.9),
  });

  // 소속/직책
  const subInfo = `${politician.party || '무소속'} | ${politician.position || '정치인'}`;
  page.drawText(subInfo, {
    x: 50,
    y: height - 110,
    size: 12,
    font: regularFont,
    color: rgb(0.8, 0.8, 0.8),
  });

  // 생성일
  const dateStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  page.drawText(`발행일: ${dateStr}`, {
    x: width - 180,
    y: height - 130,
    size: 10,
    font: regularFont,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPos = height - 180;

  // 점수 계산
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

  // 종합 점수 섹션
  page.drawText('종합 평가 점수', {
    x: 50,
    y: yPos,
    size: 16,
    font: boldFont,
    color: darkGreen,
  });
  yPos -= 5;

  page.drawLine({
    start: { x: 50, y: yPos },
    end: { x: width - 50, y: yPos },
    thickness: 2,
    color: darkGreen,
  });
  yPos -= 30;

  if (evaluations.length > 0) {
    // 큰 점수 박스
    page.drawRectangle({
      x: 200,
      y: yPos - 70,
      width: 195,
      height: 90,
      color: rgb(0.925, 0.988, 0.961),
      borderColor: lightGreen,
      borderWidth: 2,
    });

    page.drawText(overallAvg.toFixed(1), {
      x: 245,
      y: yPos - 45,
      size: 48,
      font: boldFont,
      color: darkGreen,
    });

    page.drawText('/ 100점', {
      x: 325,
      y: yPos - 45,
      size: 14,
      font: regularFont,
      color: gray,
    });

    page.drawText('AI 종합 평가', {
      x: 255,
      y: yPos - 65,
      size: 11,
      font: regularFont,
      color: gray,
    });

    yPos -= 110;

    // AI별 점수
    page.drawText('AI 모델별 점수', {
      x: 50,
      y: yPos,
      size: 14,
      font: boldFont,
      color: darkGreen,
    });
    yPos -= 25;

    const aiBoxWidth = (width - 100 - (selectedAis.length - 1) * 15) / selectedAis.length;
    let xPos = 50;

    for (const ai of selectedAis) {
      page.drawRectangle({
        x: xPos,
        y: yPos - 55,
        width: aiBoxWidth,
        height: 65,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 1,
      });

      page.drawText(AI_NAMES[ai] || ai, {
        x: xPos + 15,
        y: yPos - 18,
        size: 12,
        font: boldFont,
        color: gray,
      });

      page.drawText((avgScores[ai] || 0).toFixed(1), {
        x: xPos + 15,
        y: yPos - 45,
        size: 26,
        font: boldFont,
        color: darkGreen,
      });

      xPos += aiBoxWidth + 15;
    }

    yPos -= 85;

    // 카테고리별 평가
    if (Object.keys(categoryScores).length > 0) {
      page.drawText('카테고리별 평가', {
        x: 50,
        y: yPos,
        size: 14,
        font: boldFont,
        color: darkGreen,
      });
      yPos -= 5;

      page.drawLine({
        start: { x: 50, y: yPos },
        end: { x: width - 50, y: yPos },
        thickness: 1,
        color: darkGreen,
      });
      yPos -= 25;

      // 테이블 헤더
      page.drawRectangle({
        x: 50,
        y: yPos - 22,
        width: width - 100,
        height: 28,
        color: rgb(0.95, 0.95, 0.95),
      });

      page.drawText('평가 항목', { x: 60, y: yPos - 14, size: 11, font: boldFont, color: gray });

      let headerX = 180;
      for (const ai of selectedAis) {
        page.drawText(AI_NAMES[ai] || ai, { x: headerX, y: yPos - 14, size: 11, font: boldFont, color: gray });
        headerX += 90;
      }
      page.drawText('평균', { x: headerX, y: yPos - 14, size: 11, font: boldFont, color: darkGreen });

      yPos -= 30;

      // 카테고리별 점수
      for (const [cat, catNameKr] of Object.entries(CATEGORY_NAMES_KR)) {
        const scores = selectedAis.map(ai => categoryScores[ai]?.[cat] || 0);
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        page.drawText(catNameKr, { x: 60, y: yPos, size: 11, font: regularFont, color: black });

        let scoreX = 180;
        for (const score of scores) {
          page.drawText(score.toFixed(1), { x: scoreX, y: yPos, size: 11, font: regularFont, color: black });
          scoreX += 90;
        }
        page.drawText(avg.toFixed(1), { x: scoreX, y: yPos, size: 11, font: boldFont, color: darkGreen });

        yPos -= 22;

        if (yPos < 100) {
          page = pdfDoc.addPage([595, 842]);
          yPos = height - 50;
        }
      }
    }
  } else {
    page.drawText('AI 평가 데이터가 없습니다.', {
      x: 50,
      y: yPos,
      size: 14,
      font: regularFont,
      color: gray,
    });
  }

  // 푸터
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];

  lastPage.drawLine({
    start: { x: 50, y: 70 },
    end: { x: width - 50, y: 70 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  lastPage.drawText('본 보고서는 PoliticianFinder AI 평가 시스템에서 생성되었습니다.', {
    x: 50,
    y: 50,
    size: 9,
    font: regularFont,
    color: gray,
  });

  lastPage.drawText('https://www.politicianfinder.ai.kr', {
    x: 50,
    y: 35,
    size: 9,
    font: regularFont,
    color: lightGreen,
  });

  return await pdfDoc.save();
}

// 이메일 HTML 생성 (한글 포함, 상세 정보)
function generateEmailHTML(
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

  const aiNames = selectedAis.map(ai => AI_NAMES[ai] || ai).join(', ');

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- 헤더 -->
          <tr>
            <td style="background: linear-gradient(135deg, #064E3B 0%, #065F46 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 10px 0;">AI 평가 보고서</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0; font-weight: bold;">${politician.name}</p>
              <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 5px 0 0 0;">${politician.party || '무소속'} | ${politician.position || '정치인'}</p>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding: 30px;">
              <!-- 안내 메시지 -->
              <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                안녕하세요,<br><br>
                요청하신 <strong>${politician.name}</strong>님의 AI 평가 보고서를 보내드립니다.<br>
                첨부된 PDF 파일에서 상세 점수를 확인하실 수 있습니다.
              </p>

              <!-- 종합 점수 -->
              <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px;">
                <div style="font-size: 48px; font-weight: bold; color: #064E3B;">${overallAvg.toFixed(1)}</div>
                <div style="font-size: 14px; color: #065F46;">AI 종합 평가 점수 (100점 만점)</div>
              </div>

              <!-- AI별 점수 -->
              <h3 style="color: #064E3B; font-size: 16px; margin: 0 0 15px 0; border-bottom: 2px solid #064E3B; padding-bottom: 8px;">AI 모델별 점수</h3>
              <table width="100%" cellpadding="8" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  ${selectedAis.map(ai => `
                    <td style="text-align: center; background: #f3f4f6; border-radius: 8px;">
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">${AI_NAMES[ai] || ai}</div>
                      <div style="font-size: 24px; font-weight: bold; color: #064E3B;">${(avgScores[ai] || 0).toFixed(1)}</div>
                    </td>
                  `).join('')}
                </tr>
              </table>

              ${Object.keys(categoryScores).length > 0 ? `
              <!-- 카테고리별 점수 -->
              <h3 style="color: #064E3B; font-size: 16px; margin: 0 0 15px 0; border-bottom: 2px solid #064E3B; padding-bottom: 8px;">카테고리별 평가</h3>
              <table width="100%" style="border-collapse: collapse; margin-bottom: 25px;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 13px;">평가 항목</th>
                    ${selectedAis.map(ai => `<th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${AI_NAMES[ai] || ai}</th>`).join('')}
                    <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #064E3B;">평균</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(CATEGORY_NAMES_KR).map(([cat, catName]) => {
                    const scores = selectedAis.map(ai => categoryScores[ai]?.[cat] || 0);
                    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                    return `
                      <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${catName}</td>
                        ${scores.map(s => `<td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${s.toFixed(1)}</td>`).join('')}
                        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: bold; color: #064E3B;">${avg.toFixed(1)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
              ` : ''}

              ${evaluations.length > 0 && evaluations.some(ev => ev.summary || ev.evaluation_text) ? `
              <!-- AI 코멘트 -->
              <h3 style="color: #064E3B; font-size: 16px; margin: 0 0 15px 0; border-bottom: 2px solid #064E3B; padding-bottom: 8px;">AI 평가 코멘트</h3>
              ${evaluations.map(ev => {
                const comment = ev.summary || ev.evaluation_text;
                if (!comment) return '';
                return `
                  <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 12px;">
                    <div style="font-weight: bold; color: #064E3B; margin-bottom: 8px; font-size: 14px;">${AI_NAMES[ev.ai_model] || ev.ai_model}</div>
                    <div style="font-size: 13px; line-height: 1.7; color: #374151;">${comment}</div>
                  </div>
                `;
              }).join('')}
              ` : ''}

              <!-- 안내 -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px;">
                <p style="margin: 0; font-size: 13px; color: #92400e;">
                  <strong>참고:</strong> 첨부된 PDF 파일에서 더 자세한 점수표를 확인하실 수 있습니다.
                </p>
              </div>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">본 보고서는 PoliticianFinder에서 AI 기반으로 생성되었습니다.</p>
              <p style="font-size: 12px; margin: 0;">
                <a href="https://www.politicianfinder.ai.kr" style="color: #10b981; text-decoration: none;">www.politicianfinder.ai.kr</a>
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
