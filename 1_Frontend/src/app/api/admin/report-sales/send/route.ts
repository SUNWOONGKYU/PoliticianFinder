// API: POST /api/admin/report-sales/send
// 관리자 전용: PDF 보고서 생성 및 이메일 발송 (pdf-lib 사용)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const getResend = () => new Resend(process.env.RESEND_API_KEY);

// AI 이름 매핑
const AI_NAMES: Record<string, string> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  grok: 'Grok',
};

// 카테고리 이름 매핑 (영문)
const CATEGORY_NAMES_EN: Record<string, string> = {
  leadership: 'Leadership',
  policy: 'Policy',
  communication: 'Communication',
  integrity: 'Integrity',
  achievement: 'Achievement',
  vision: 'Vision',
  expertise: 'Expertise',
  crisis_management: 'Crisis Mgmt',
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

    // 3. 이미 발송됨 체크 해제 (테스트를 위해 재발송 허용)
    // if (purchase.sent) {
    //   return NextResponse.json(
    //     { success: false, error: '이미 발송된 보고서입니다.', sent_at: purchase.sent_at },
    //     { status: 400 }
    //   );
    // }

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

    // 6. PDF 생성
    console.log('[send] Generating PDF with pdf-lib...');
    const pdfBytes = await generatePDF(politician, evaluations || [], selectedAis, purchase);
    console.log('[send] PDF generated, size:', pdfBytes.length);

    // 7. 이메일 발송
    const resend = getResend();
    const aiNames = selectedAis.map((ai: string) => AI_NAMES[ai] || ai).join(', ');
    const fileName = `Report_${politician.name}_${new Date().toISOString().split('T')[0]}.pdf`;

    try {
      const emailResult = await resend.emails.send({
        from: 'PoliticianFinder <noreply@politicianfinder.ai.kr>',
        to: purchase.buyer_email,
        subject: `[PoliticianFinder] ${politician.name} - AI Evaluation Report`,
        attachments: [
          {
            filename: fileName,
            content: Buffer.from(pdfBytes).toString('base64'),
          },
        ],
        html: generateEmailHTML(politician, aiNames),
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

// PDF 생성 함수 (pdf-lib 사용)
async function generatePDF(
  politician: any,
  evaluations: any[],
  selectedAis: string[],
  purchase: any
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 첫 페이지
  let page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  let yPos = height - 50;

  // 색상 정의
  const darkGreen = rgb(0.024, 0.306, 0.231); // #064E3B
  const lightGreen = rgb(0.063, 0.725, 0.506); // #10b981
  const gray = rgb(0.42, 0.45, 0.49);
  const black = rgb(0, 0, 0);

  // 헤더 배경
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: darkGreen,
  });

  // 제목
  page.drawText('AI EVALUATION REPORT', {
    x: 50,
    y: height - 50,
    size: 24,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  // 정치인 이름
  page.drawText(`Politician: ${politician.name}`, {
    x: 50,
    y: height - 80,
    size: 16,
    font: helveticaFont,
    color: rgb(1, 1, 1),
  });

  // 정당 및 직위
  const partyPosition = `${politician.party || 'Independent'} | ${politician.position || 'Politician'}`;
  page.drawText(partyPosition, {
    x: 50,
    y: height - 100,
    size: 12,
    font: helveticaFont,
    color: rgb(0.9, 0.9, 0.9),
  });

  // 생성일
  page.drawText(`Generated: ${new Date().toLocaleDateString('en-US')} | Order: ${purchase.id.substring(0, 8).toUpperCase()}`, {
    x: width - 250,
    y: height - 100,
    size: 10,
    font: helveticaFont,
    color: rgb(0.8, 0.8, 0.8),
  });

  yPos = height - 160;

  // 기본 정보 섹션
  page.drawText('BASIC INFORMATION', {
    x: 50,
    y: yPos,
    size: 14,
    font: helveticaBold,
    color: darkGreen,
  });
  yPos -= 5;

  // 밑줄
  page.drawLine({
    start: { x: 50, y: yPos },
    end: { x: width - 50, y: yPos },
    thickness: 2,
    color: darkGreen,
  });
  yPos -= 25;

  // 기본 정보 테이블
  const infoItems = [
    ['Name:', politician.name],
    ['Party:', politician.party || 'Independent'],
    ['Position:', politician.position || '-'],
    ['Constituency:', politician.constituency || politician.region || '-'],
  ];

  for (const [label, value] of infoItems) {
    page.drawText(label, { x: 50, y: yPos, size: 11, font: helveticaBold, color: gray });
    page.drawText(String(value), { x: 150, y: yPos, size: 11, font: helveticaFont, color: black });
    yPos -= 20;
  }

  yPos -= 20;

  // 종합 점수 섹션
  page.drawText('OVERALL SCORE', {
    x: 50,
    y: yPos,
    size: 14,
    font: helveticaBold,
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

  if (evaluations.length > 0) {
    // 큰 점수 박스
    page.drawRectangle({
      x: 200,
      y: yPos - 50,
      width: 195,
      height: 70,
      color: rgb(0.925, 0.988, 0.961), // 연한 초록
      borderColor: lightGreen,
      borderWidth: 2,
    });

    page.drawText(overallAvg.toFixed(1), {
      x: 260,
      y: yPos - 35,
      size: 40,
      font: helveticaBold,
      color: darkGreen,
    });

    page.drawText('/ 100', {
      x: 330,
      y: yPos - 35,
      size: 14,
      font: helveticaFont,
      color: gray,
    });

    page.drawText('AI Combined Score', {
      x: 245,
      y: yPos - 55,
      size: 10,
      font: helveticaFont,
      color: gray,
    });

    yPos -= 80;

    // AI별 점수
    const aiBoxWidth = (width - 100 - (selectedAis.length - 1) * 10) / selectedAis.length;
    let xPos = 50;

    for (const ai of selectedAis) {
      page.drawRectangle({
        x: xPos,
        y: yPos - 40,
        width: aiBoxWidth,
        height: 50,
        color: rgb(0.95, 0.95, 0.95),
      });

      page.drawText(AI_NAMES[ai] || ai, {
        x: xPos + 10,
        y: yPos - 15,
        size: 10,
        font: helveticaFont,
        color: gray,
      });

      page.drawText((avgScores[ai] || 0).toFixed(1), {
        x: xPos + 10,
        y: yPos - 35,
        size: 20,
        font: helveticaBold,
        color: darkGreen,
      });

      xPos += aiBoxWidth + 10;
    }

    yPos -= 70;

    // 카테고리별 평가
    if (Object.keys(categoryScores).length > 0) {
      page.drawText('CATEGORY SCORES', {
        x: 50,
        y: yPos,
        size: 14,
        font: helveticaBold,
        color: darkGreen,
      });
      yPos -= 5;

      page.drawLine({
        start: { x: 50, y: yPos },
        end: { x: width - 50, y: yPos },
        thickness: 2,
        color: darkGreen,
      });
      yPos -= 25;

      // 테이블 헤더
      page.drawText('Category', { x: 50, y: yPos, size: 10, font: helveticaBold, color: gray });

      let headerX = 200;
      for (const ai of selectedAis) {
        page.drawText(AI_NAMES[ai] || ai, { x: headerX, y: yPos, size: 10, font: helveticaBold, color: gray });
        headerX += 80;
      }
      page.drawText('Average', { x: headerX, y: yPos, size: 10, font: helveticaBold, color: gray });

      yPos -= 15;
      page.drawLine({
        start: { x: 50, y: yPos },
        end: { x: width - 50, y: yPos },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
      yPos -= 15;

      // 카테고리별 점수
      for (const [cat, catNameEn] of Object.entries(CATEGORY_NAMES_EN)) {
        const scores = selectedAis.map(ai => categoryScores[ai]?.[cat] || 0);
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        page.drawText(catNameEn, { x: 50, y: yPos, size: 10, font: helveticaFont, color: black });

        let scoreX = 200;
        for (const score of scores) {
          page.drawText(score.toFixed(1), { x: scoreX, y: yPos, size: 10, font: helveticaFont, color: black });
          scoreX += 80;
        }
        page.drawText(avg.toFixed(1), { x: scoreX, y: yPos, size: 10, font: helveticaBold, color: darkGreen });

        yPos -= 18;

        // 페이지 넘김 체크
        if (yPos < 100) {
          page = pdfDoc.addPage([595, 842]);
          yPos = height - 50;
        }
      }
    }

    yPos -= 20;

    // AI 코멘트 섹션
    if (evaluations.length > 0) {
      // 새 페이지 필요 시
      if (yPos < 200) {
        page = pdfDoc.addPage([595, 842]);
        yPos = height - 50;
      }

      page.drawText('AI EVALUATION COMMENTS', {
        x: 50,
        y: yPos,
        size: 14,
        font: helveticaBold,
        color: darkGreen,
      });
      yPos -= 5;

      page.drawLine({
        start: { x: 50, y: yPos },
        end: { x: width - 50, y: yPos },
        thickness: 2,
        color: darkGreen,
      });
      yPos -= 25;

      for (const ev of evaluations) {
        page.drawText(`${AI_NAMES[ev.ai_model] || ev.ai_model} Evaluation:`, {
          x: 50,
          y: yPos,
          size: 11,
          font: helveticaBold,
          color: darkGreen,
        });
        yPos -= 18;

        const comment = ev.summary || ev.evaluation_text || 'No evaluation comment available.';
        const words = comment.split(' ');
        let line = '';
        const maxWidth = width - 100;

        for (const word of words) {
          const testLine = line + (line ? ' ' : '') + word;
          const testWidth = helveticaFont.widthOfTextAtSize(testLine, 10);

          if (testWidth > maxWidth) {
            page.drawText(line, { x: 50, y: yPos, size: 10, font: helveticaFont, color: black });
            yPos -= 14;
            line = word;

            if (yPos < 80) {
              page = pdfDoc.addPage([595, 842]);
              yPos = height - 50;
            }
          } else {
            line = testLine;
          }
        }

        if (line) {
          page.drawText(line, { x: 50, y: yPos, size: 10, font: helveticaFont, color: black });
          yPos -= 25;
        }

        if (yPos < 100) {
          page = pdfDoc.addPage([595, 842]);
          yPos = height - 50;
        }
      }
    }
  } else {
    page.drawText('No AI evaluation data available.', {
      x: 50,
      y: yPos,
      size: 12,
      font: helveticaFont,
      color: gray,
    });
  }

  // 푸터 (마지막 페이지)
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];

  lastPage.drawText('This report was generated by PoliticianFinder AI evaluation system.', {
    x: 50,
    y: 50,
    size: 9,
    font: helveticaFont,
    color: gray,
  });

  lastPage.drawText('https://www.politicianfinder.ai.kr', {
    x: 50,
    y: 35,
    size: 9,
    font: helveticaFont,
    color: lightGreen,
  });

  return await pdfDoc.save();
}

// 이메일 HTML 생성
function generateEmailHTML(politician: any, aiNames: string): string {
  return `
    <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #064E3B; margin-bottom: 20px;">AI Evaluation Report</h2>
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Hello,<br><br>
        Please find attached the AI evaluation report for <strong>${politician.name}</strong>.
      </p>
      <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #064E3B; margin: 0 0 15px 0;">Report Information</h3>
        <table style="width: 100%; color: #333; font-size: 14px;">
          <tr><td style="padding: 5px 0;">Politician</td><td style="padding: 5px 0; text-align: right; font-weight: bold;">${politician.name}</td></tr>
          <tr><td style="padding: 5px 0;">Party</td><td style="padding: 5px 0; text-align: right;">${politician.party || 'Independent'}</td></tr>
          <tr><td style="padding: 5px 0;">AI Models</td><td style="padding: 5px 0; text-align: right;">${aiNames}</td></tr>
          <tr><td style="padding: 5px 0;">Generated</td><td style="padding: 5px 0; text-align: right;">${new Date().toLocaleDateString('en-US')}</td></tr>
        </table>
      </div>
      <p style="color: #333; font-size: 14px;">Please check the attached PDF file.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 12px; margin: 0;">PoliticianFinder<br>https://www.politicianfinder.ai.kr</p>
      </div>
    </div>
  `;
}
