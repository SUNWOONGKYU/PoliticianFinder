// Task ID: P4BA15
// POST /api/reports/generate - Generate PDF report for evaluation
// ⚠️ 정치인 전용: 일반 회원은 구매 불가, 정치인 세션 토큰 인증 필수

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getReportGenerator } from '@/lib/pdf/report-generator';
import { uploadReportPDF, reportPDFExists, getReportPDFUrl } from '@/lib/storage/upload';
import {
  PoliticianForReport,
  EvaluationForReport,
  EvaluationHistory,
} from '@/lib/pdf/types';
import { validatePoliticianSession } from '@/lib/auth/politicianSession';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Increase timeout for PDF generation (serverless functions may have limits)
export const maxDuration = 60; // 60 seconds

/**
 * Request body interface
 * ⚠️ 정치인 전용: session_token 필수
 */
interface GenerateReportRequest {
  politician_id: string;
  evaluation_id: string;
  session_token: string; // 정치인 세션 토큰 (필수)
  force_regenerate?: boolean; // Force regeneration even if PDF exists
}

/**
 * POST /api/reports/generate
 * Generate PDF report for a politician's AI evaluation
 * ⚠️ 정치인 전용: 일반 회원은 구매 불가
 *
 * Request body:
 * - politician_id: string (required)
 * - evaluation_id: string (required)
 * - session_token: string (required) - 정치인 세션 토큰
 * - force_regenerate?: boolean (optional, default: false)
 *
 * Response:
 * - success: boolean
 * - report_url: string (public URL of PDF)
 * - cached: boolean (whether existing PDF was used)
 * - character_count: number (total characters in evaluation)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Parse and validate request body
    const body: GenerateReportRequest = await request.json();
    const { politician_id, evaluation_id, session_token, force_regenerate = false } = body;

    if (!politician_id || !evaluation_id) {
      return NextResponse.json(
        { success: false, error: 'politician_id와 evaluation_id가 필요합니다' },
        { status: 400 }
      );
    }

    if (!session_token) {
      return NextResponse.json(
        {
          success: false,
          error: '정치인 인증이 필요합니다. 일반 회원은 구매할 수 없습니다.',
          code: 'POLITICIAN_ONLY'
        },
        { status: 401 }
      );
    }

    // 2. 정치인 세션 토큰 검증
    const validationResult = await validatePoliticianSession(politician_id, session_token);

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error?.message || '세션이 만료되었거나 유효하지 않습니다.',
          code: validationResult.error?.code
        },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // 3. Check if PDF already exists (unless force_regenerate is true)
    if (!force_regenerate) {
      const existingUrl = await getReportPDFUrl(politician_id, evaluation_id);
      if (existingUrl) {
        console.log('Using cached PDF:', existingUrl);
        return NextResponse.json({
          success: true,
          report_url: existingUrl,
          cached: true,
          generation_time_ms: Date.now() - startTime,
        });
      }
    }

    // 4. Fetch politician data
    const { data: politician, error: politicianError } = await (supabase as any)
      .from('politicians')
      .select('id, name, political_party_id, position_id, profile_image_url, bio')
      .eq('id', politician_id)
      .single() as { data: any; error: any };

    if (politicianError || !politician) {
      return NextResponse.json(
        { success: false, error: '정치인을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 5. Fetch evaluation data
    const { data: evaluation, error: evaluationError } = await (supabase as any)
      .from('ai_evaluations')
      .select('*')
      .eq('id', evaluation_id)
      .single() as { data: any; error: any };

    if (evaluationError || !evaluation) {
      return NextResponse.json(
        { success: false, error: '평가 데이터를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Verify politician_id matches
    if (evaluation.politician_id !== politician_id) {
      return NextResponse.json(
        { success: false, error: '평가 데이터가 정치인과 일치하지 않습니다' },
        { status: 400 }
      );
    }

    // 6. Fetch evaluation history for trend chart
    const { data: history } = await (supabase as any)
      .from('ai_evaluations')
      .select('evaluation_date, overall_score, overall_grade')
      .eq('politician_id', politician_id)
      .order('evaluation_date', { ascending: false })
      .limit(10) as { data: any[] | null };

    const evaluationHistory: EvaluationHistory[] = history || [];

    // 7. Transform data to PDF format
    const politicianForReport: PoliticianForReport = {
      id: politician.id,
      name: politician.name,
      political_party_id: politician.political_party_id,
      position_id: politician.position_id,
      profile_image_url: politician.profile_image_url,
      bio: politician.bio,
    };

    const evaluationForReport: EvaluationForReport = {
      id: evaluation.id,
      politician_id: evaluation.politician_id,
      evaluation_date: evaluation.evaluation_date,
      overall_score: evaluation.overall_score || 0,
      overall_grade: evaluation.overall_grade || 'F',
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      detailed_analysis: evaluation.detailed_analysis as any,
      ai_model_version: evaluation.ai_model_version,
    };

    // 8. Validate evaluation data quality
    const generator = getReportGenerator();
    const isValid = generator.validateEvaluationData(evaluationForReport);

    if (!isValid) {
      console.warn('Evaluation data quality is insufficient');
      // Continue anyway but log warning
    }

    const characterCount = generator.calculateTotalCharacters(evaluationForReport);
    console.log(`Total evaluation character count: ${characterCount}`);

    if (characterCount < 30000) {
      console.warn(
        `Character count (${characterCount}) is below recommended 30,000 characters`
      );
    }

    // 9. Generate PDF
    console.log(`Generating PDF for evaluation ${evaluation_id}...`);
    const pdfBuffer = await generator.generatePDF(
      politicianForReport,
      evaluationForReport,
      evaluationHistory
    );

    console.log(`PDF generated successfully. Size: ${pdfBuffer.length} bytes`);

    // 10. Upload to Supabase Storage
    const reportUrl = await uploadReportPDF(politician_id, evaluation_id, pdfBuffer);

    console.log(`PDF uploaded successfully: ${reportUrl}`);

    const duration = Date.now() - startTime;

    // 11. Return success response
    return NextResponse.json(
      {
        success: true,
        report_url: reportUrl,
        cached: false,
        generation_time_ms: duration,
        character_count: characterCount,
        file_size_bytes: pdfBuffer.length,
        politician: {
          id: politician.id,
          name: politician.name,
        },
        evaluation: {
          id: evaluation.id,
          evaluation_date: evaluation.evaluation_date,
          overall_score: evaluation.overall_score,
          overall_grade: evaluation.overall_grade,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('PDF generation failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'PDF 생성 중 오류가 발생했습니다',
        details: errorMessage,
        generation_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/generate?politician_id=xxx&evaluation_id=xxx&session_token=xxx
 * Check if report exists and return URL
 * ⚠️ 정치인 전용: 일반 회원은 조회 불가
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const politician_id = searchParams.get('politician_id');
    const evaluation_id = searchParams.get('evaluation_id');
    const session_token = searchParams.get('session_token');

    if (!politician_id || !evaluation_id) {
      return NextResponse.json(
        { success: false, error: 'politician_id와 evaluation_id가 필요합니다' },
        { status: 400 }
      );
    }

    if (!session_token) {
      return NextResponse.json(
        {
          success: false,
          error: '정치인 인증이 필요합니다. 일반 회원은 조회할 수 없습니다.',
          code: 'POLITICIAN_ONLY'
        },
        { status: 401 }
      );
    }

    // 2. 정치인 세션 토큰 검증
    const validationResult = await validatePoliticianSession(politician_id, session_token);

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error?.message || '세션이 만료되었거나 유효하지 않습니다.',
          code: validationResult.error?.code
        },
        { status: 401 }
      );
    }

    // 3. Check if report exists
    const exists = await reportPDFExists(politician_id, evaluation_id);

    if (!exists) {
      return NextResponse.json(
        {
          success: false,
          exists: false,
          message: 'Report does not exist',
        },
        { status: 404 }
      );
    }

    // 4. Get report URL
    const reportUrl = await getReportPDFUrl(politician_id, evaluation_id);

    return NextResponse.json({
      success: true,
      exists: true,
      report_url: reportUrl,
    });
  } catch (error) {
    console.error('Error checking report:', error);

    return NextResponse.json(
      {
        success: false,
        error: '리포트 확인 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}
