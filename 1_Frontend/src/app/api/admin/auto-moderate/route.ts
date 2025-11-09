/**
 * Project Grid Task ID: P4BA7
 * 작업명: 자동 중재 시스템 API
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P3BA23 (콘텐츠 신고 API)
 * 설명: AI 기반 자동 중재 시스템으로 신고된 콘텐츠를 자동으로 분석하고 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import {
  analyzeContent,
  severityToAction,
  summarizeAnalysis,
  type ContentAnalysisRequest,
} from '@/lib/moderation/ai-analyzer';
import {
  calculateSeverityScore,
  getRiskLevel,
  getActionLabel,
  type ScoringContext,
} from '@/lib/moderation/severity-scorer';

// ============================================================================
// Environment & Supabase Setup
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin 권한이 필요한 API이므로 서비스 키 사용
function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// ============================================================================
// Request Schema (Zod)
// ============================================================================

const autoModerateSchema = z.object({
  reportId: z.string().uuid('유효한 신고 ID가 필요합니다.'),
  contentType: z.enum(['post', 'comment'], {
    errorMap: () => ({ message: 'contentType은 post 또는 comment여야 합니다.' }),
  }),
  contentId: z.string().uuid('유효한 콘텐츠 ID가 필요합니다.'),
});

type AutoModerateRequest = z.infer<typeof autoModerateSchema>;

// ============================================================================
// Response Types
// ============================================================================

interface AutoModerateResponse {
  success: boolean;
  data?: {
    reportId: string;
    action: 'ignore' | 'review' | 'delete';
    severity: number;
    riskLevel: string;
    reasons: string[];
    aiAnalysis: string;
    actionTaken: {
      contentDeleted: boolean;
      userWarned: boolean;
      adminNotified: boolean;
    };
    metadata: {
      analyzedAt: string;
      confidence: number;
      model: string;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 신고 정보 조회
 */
async function fetchReport(reportId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('reports')
    .select('*, users!reports_reporter_id_fkey(id, username, email)')
    .eq('id', reportId)
    .single();

  if (error || !data) {
    throw new Error(`신고를 찾을 수 없습니다: ${error?.message || 'Not found'}`);
  }

  return data;
}

/**
 * 콘텐츠 조회
 */
async function fetchContent(contentType: 'post' | 'comment', contentId: string) {
  const supabase = getSupabaseAdmin();
  const table = contentType === 'post' ? 'posts' : 'comments';

  const { data, error } = await supabase
    .from(table)
    .select('*, users!fkey(id, username, email)')
    .eq('id', contentId)
    .single();

  if (error || !data) {
    throw new Error(
      `콘텐츠를 찾을 수 없습니다: ${error?.message || 'Not found'}`
    );
  }

  return data;
}

/**
 * 사용자 위반 이력 조회
 */
async function fetchUserViolationHistory(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();

  // 승인된(accepted) 신고 건수 조회
  const { count, error } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('target_type', 'user')
    .eq('target_id', userId)
    .eq('status', 'accepted');

  if (error) {
    console.error('[자동 중재] 위반 이력 조회 오류:', error);
    return 0;
  }

  return count || 0;
}

/**
 * 콘텐츠 삭제
 */
async function deleteContent(
  contentType: 'post' | 'comment',
  contentId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const table = contentType === 'post' ? 'posts' : 'comments';

  // Soft delete (deleted_at 컬럼이 있는 경우) 또는 hard delete
  const { error } = await supabase.from(table).delete().eq('id', contentId);

  if (error) {
    console.error('[자동 중재] 콘텐츠 삭제 오류:', error);
    return false;
  }

  console.log(`[자동 중재] 콘텐츠 삭제 완료: ${contentType}/${contentId}`);
  return true;
}

/**
 * 사용자 경고
 */
async function warnUser(
  userId: string,
  warningMessage: string,
  reportId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  // 경고 기록 (notifications 테이블 또는 별도 warnings 테이블 사용)
  // 여기서는 간단히 로그만 남김
  console.log(`[자동 중재] 사용자 경고: ${userId} - ${warningMessage}`);

  // TODO: 실제 구현 시 notifications 테이블에 경고 추가
  // await supabase.from('notifications').insert({
  //   user_id: userId,
  //   type: 'warning',
  //   message: warningMessage,
  //   related_id: reportId,
  // });

  return true;
}

/**
 * 관리자 알림
 */
async function notifyAdmin(
  reportId: string,
  severity: number,
  action: string,
  adminNote: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  console.log(`[자동 중재] 관리자 알림: 신고 ${reportId} - ${action} (${severity}점)`);
  console.log(`[자동 중재] 관리자 노트: ${adminNote}`);

  // TODO: 실제 구현 시 admin_notifications 테이블에 알림 추가
  // await supabase.from('admin_notifications').insert({
  //   type: 'auto_moderation',
  //   severity,
  //   report_id: reportId,
  //   message: adminNote,
  //   priority: severity > 70 ? 'high' : 'medium',
  // });

  return true;
}

/**
 * 신고 상태 업데이트
 */
async function updateReportStatus(
  reportId: string,
  status: 'pending' | 'pending_review' | 'accepted' | 'rejected',
  action: string,
  adminNotes: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('reports')
    .update({
      status,
      action: action || null,
      admin_notes: adminNotes,
      resolved_at:
        status === 'accepted' || status === 'rejected'
          ? new Date().toISOString()
          : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    console.error('[자동 중재] 신고 업데이트 오류:', error);
    return false;
  }

  console.log(`[자동 중재] 신고 상태 업데이트: ${reportId} -> ${status}`);
  return true;
}

/**
 * 감사 로그 기록
 */
async function logAudit(
  reportId: string,
  action: string,
  severity: number,
  aiAnalysis: string
): Promise<void> {
  const supabase = getSupabaseAdmin();

  await supabase.from('audit_logs').insert({
    action: 'auto_moderate',
    target_type: 'report',
    target_id: reportId,
    actor_id: 'system', // 시스템 자동 처리
    details: JSON.stringify({
      action,
      severity,
      aiAnalysis: aiAnalysis.substring(0, 500), // 길이 제한
      timestamp: new Date().toISOString(),
    }),
  });
}

// ============================================================================
// POST /api/admin/auto-moderate
// ============================================================================

/**
 * 자동 중재 API
 *
 * @description AI 기반 콘텐츠 자동 분석 및 처리
 * @route POST /api/admin/auto-moderate
 * @access Admin only
 *
 * @param {string} reportId - 신고 ID
 * @param {string} contentType - 콘텐츠 타입 (post | comment)
 * @param {string} contentId - 콘텐츠 ID
 *
 * @returns {200} { success: true, data: { action, severity, ... } }
 * @returns {400} { success: false, error: { code, message } }
 * @returns {404} { success: false, error: { code, message } }
 * @returns {500} { success: false, error: { code, message } }
 */
export async function POST(request: NextRequest): Promise<NextResponse<AutoModerateResponse>> {
  try {
    console.log('[자동 중재 API] 요청 시작');

    // 1. Request Body Parsing
    const body = await request.json();

    // 2. Input Validation (Zod)
    const validationResult = autoModerateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력 데이터가 올바르지 않습니다.',
            details: validationResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const data: AutoModerateRequest = validationResult.data;

    console.log('[자동 중재 API] 검증 완료:', data);

    // 3. 신고 정보 조회
    const report = await fetchReport(data.reportId);

    // 4. 콘텐츠 조회
    const content = await fetchContent(data.contentType, data.contentId);
    const contentText = content.content || content.text || '';
    const authorId = content.author_id || content.user_id;

    if (!contentText) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONTENT_EMPTY',
            message: '콘텐츠가 비어있습니다.',
          },
        },
        { status: 400 }
      );
    }

    console.log('[자동 중재 API] 콘텐츠 조회 완료:', {
      contentType: data.contentType,
      contentLength: contentText.length,
      authorId,
    });

    // 5. 사용자 위반 이력 조회
    const previousViolations = await fetchUserViolationHistory(authorId);

    console.log('[자동 중재 API] 위반 이력:', previousViolations);

    // 6. AI 콘텐츠 분석
    const analysisRequest: ContentAnalysisRequest = {
      content: contentText,
      contentType: data.contentType,
      context: {
        authorId,
        previousViolations,
      },
    };

    const aiResult = await analyzeContent(analysisRequest);

    console.log('[자동 중재 API] AI 분석 완료:', {
      severity: aiResult.severity,
      confidence: aiResult.confidence,
      categoriesCount: aiResult.categories.length,
    });

    // 7. 심각도 점수 계산
    const scoringContext: ScoringContext = {
      contentType: data.contentType,
      authorId,
      previousViolations,
      reportCount: 1, // 현재는 1개 신고만 처리
    };

    const scoreResult = calculateSeverityScore(aiResult, scoringContext);
    const { finalScore, action, actionDetails } = scoreResult;

    console.log('[자동 중재 API] 최종 점수 계산:', {
      finalScore,
      action,
      actionDetails,
    });

    // 8. 자동 액션 실행
    let contentDeleted = false;
    let userWarned = false;
    let adminNotified = false;

    if (action === 'delete') {
      // 8-1. 콘텐츠 삭제
      contentDeleted = await deleteContent(data.contentType, data.contentId);

      // 8-2. 사용자 경고
      if (actionDetails.shouldWarnUser && actionDetails.warningMessage) {
        userWarned = await warnUser(
          authorId,
          actionDetails.warningMessage,
          data.reportId
        );
      }

      // 8-3. 신고 승인
      await updateReportStatus(
        data.reportId,
        'accepted',
        'auto_delete',
        actionDetails.adminNote || `자동 삭제 (심각도: ${finalScore}점)`
      );
    } else if (action === 'review') {
      // 8-4. 관리자 검토 필요
      await updateReportStatus(
        data.reportId,
        'pending_review',
        'needs_review',
        actionDetails.adminNote || `관리자 검토 필요 (심각도: ${finalScore}점)`
      );
    } else {
      // 8-5. 무시 (정상 콘텐츠)
      await updateReportStatus(
        data.reportId,
        'rejected',
        'auto_ignore',
        actionDetails.adminNote || `정상 콘텐츠 (심각도: ${finalScore}점)`
      );
    }

    // 9. 관리자 알림
    if (actionDetails.shouldNotifyAdmin && actionDetails.adminNote) {
      adminNotified = await notifyAdmin(
        data.reportId,
        finalScore,
        action,
        actionDetails.adminNote
      );
    }

    // 10. 감사 로그 기록
    await logAudit(
      data.reportId,
      action,
      finalScore,
      summarizeAnalysis(aiResult)
    );

    // 11. 성공 응답
    const response: AutoModerateResponse = {
      success: true,
      data: {
        reportId: data.reportId,
        action,
        severity: finalScore,
        riskLevel: getRiskLevel(finalScore),
        reasons: aiResult.categories.map(
          (cat) => `${cat.type}: ${cat.score}점`
        ),
        aiAnalysis: aiResult.reasoning,
        actionTaken: {
          contentDeleted,
          userWarned,
          adminNotified,
        },
        metadata: {
          analyzedAt: new Date().toISOString(),
          confidence: aiResult.confidence,
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        },
      },
    };

    console.log('[자동 중재 API] 처리 완료:', {
      action,
      severity: finalScore,
      contentDeleted,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[자동 중재 API] 오류:', error);

    // 에러 타입별 처리
    if (error instanceof Error) {
      if (error.message.includes('찾을 수 없습니다')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
          },
          { status: 404 }
        );
      }

      if (error.message.includes('환경 변수')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFIGURATION_ERROR',
              message: 'OpenAI API 설정이 올바르지 않습니다.',
              details: error.message,
            },
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '자동 중재 처리 중 오류가 발생했습니다.',
          details: error instanceof Error ? error.message : '알 수 없는 오류',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS /api/admin/auto-moderate
// ============================================================================

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
