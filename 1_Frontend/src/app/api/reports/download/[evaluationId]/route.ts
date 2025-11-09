// Task ID: P4BA16
// GET /api/reports/download/[evaluationId] - Download PDF report with payment verification

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  verifyPayment,
  checkDownloadLimit,
  recordDownload,
} from '@/lib/auth/payment-verification';
import {
  createSignedDownloadUrl,
  getDownloadFilename,
  verifyReportExists,
} from '@/lib/storage/signed-url';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/download/[evaluationId]
 * Download PDF report with payment verification and download limit enforcement
 *
 * Security features:
 * - User authentication required
 * - Payment verification (completed payment for the specific report)
 * - Download limit enforcement (max 10 downloads per purchase)
 * - Download history tracking
 * - Signed URL with 1-hour expiration
 *
 * Response:
 * - 200: Redirect to signed download URL
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (payment not verified)
 * - 404: Report not found
 * - 429: Too many downloads (limit exceeded)
 * - 500: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { evaluationId: string } }
) {
  try {
    const supabase = createClient();
    const { evaluationId } = params;

    // 1. User authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: '로그인이 필요합니다',
        },
        { status: 401 }
      );
    }

    // 2. Fetch evaluation data
    const { data: evaluation, error: evaluationError } = await supabase
      .from('ai_evaluations')
      .select('id, politician_id, evaluator, evaluation_date, report_url')
      .eq('id', evaluationId)
      .single();

    if (evaluationError || !evaluation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Report not found',
          message: '리포트를 찾을 수 없습니다',
        },
        { status: 404 }
      );
    }

    if (!evaluation.report_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Report not generated',
          message: '리포트가 아직 생성되지 않았습니다',
        },
        { status: 404 }
      );
    }

    // 3. Verify report file exists in storage
    const fileExists = await verifyReportExists(
      evaluation.politician_id,
      evaluation.id
    );

    if (!fileExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Report file not found',
          message: '리포트 파일이 스토리지에 존재하지 않습니다',
        },
        { status: 404 }
      );
    }

    // 4. Payment verification
    const paymentResult = await verifyPayment(user.id, evaluationId);

    if (!paymentResult.verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment required',
          message:
            paymentResult.message ||
            '리포트를 구매한 사용자만 다운로드 가능합니다',
        },
        { status: 403 }
      );
    }

    // 5. Check download limit (max 10 downloads per purchase)
    const downloadLimitCheck = await checkDownloadLimit(user.id, evaluationId, 10);

    if (downloadLimitCheck.limitExceeded) {
      return NextResponse.json(
        {
          success: false,
          error: 'Download limit exceeded',
          message: `다운로드 횟수 초과 (최대 10회). 이미 ${downloadLimitCheck.count}회 다운로드하셨습니다.`,
          details: {
            total_downloads: downloadLimitCheck.count,
            max_downloads: 10,
            remaining: 0,
          },
        },
        { status: 429 }
      );
    }

    // 6. Create signed download URL (1 hour expiration)
    const signedUrl = await createSignedDownloadUrl(evaluation.report_url, 3600);

    // 7. Fetch politician info for filename
    const { data: politician } = await supabase
      .from('politicians')
      .select('name')
      .eq('id', evaluation.politician_id)
      .single();

    // 8. Record download history
    const ipAddress = request.headers.get('x-forwarded-for') || request.ip || null;
    const userAgent = request.headers.get('user-agent') || null;

    await recordDownload(
      user.id,
      evaluationId,
      paymentResult.paymentId!,
      ipAddress,
      userAgent
    );

    // 9. Generate download filename
    const filename = politician
      ? getDownloadFilename(
          politician.name,
          evaluation.evaluator || 'AI',
          evaluation.evaluation_date
        )
      : `evaluation_report_${evaluationId}.pdf`;

    // 10. Return redirect to signed URL or JSON response with URL
    // Option A: Redirect directly to download
    // return NextResponse.redirect(signedUrl);

    // Option B: Return JSON with signed URL (allows frontend to handle download)
    return NextResponse.json(
      {
        success: true,
        download_url: signedUrl,
        filename,
        expires_in: 3600,
        downloads: {
          count: downloadLimitCheck.count + 1, // Including this download
          remaining: downloadLimitCheck.remaining - 1,
          max: 10,
        },
        report: {
          evaluation_id: evaluation.id,
          politician_id: evaluation.politician_id,
          evaluator: evaluation.evaluator,
          evaluation_date: evaluation.evaluation_date,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Download API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: '다운로드 처리 중 오류가 발생했습니다',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
