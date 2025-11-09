/**
 * Project Grid Task ID: P4BA7
 * 작업명: 자동 중재 시스템 - 심각도 점수 계산
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5
 * 설명: 콘텐츠 위반 심각도 점수 계산 및 액션 결정
 */

import type { ContentAnalysisResult, ViolationCategory } from './ai-analyzer';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SeverityScoreResult {
  finalScore: number; // 0-100
  action: 'ignore' | 'review' | 'delete';
  breakdown: {
    aiScore: number;
    contextAdjustment: number;
    historyAdjustment: number;
  };
  actionDetails: ActionDetails;
}

export interface ActionDetails {
  shouldDelete: boolean;
  shouldWarnUser: boolean;
  shouldNotifyAdmin: boolean;
  warningMessage?: string;
  adminNote?: string;
}

export interface ScoringContext {
  contentType: 'post' | 'comment';
  authorId?: string;
  previousViolations?: number;
  reportCount?: number;
  contentAge?: number; // 분 단위
}

// ============================================================================
// Constants
// ============================================================================

// 심각도 임계값
export const SEVERITY_THRESHOLDS = {
  IGNORE_MAX: 30, // 0-30: 무시 (정상 콘텐츠)
  REVIEW_MAX: 70, // 31-70: 검토 필요
  DELETE_MIN: 71, // 71-100: 자동 삭제
} as const;

// 가중치 설정
const WEIGHTS = {
  // 콘텐츠 타입별 가중치
  CONTENT_TYPE: {
    post: 1.0, // 게시글은 기본
    comment: 0.9, // 댓글은 약간 덜 엄격
  },

  // 이전 위반 횟수에 따른 가중치
  VIOLATION_HISTORY: {
    0: 1.0, // 첫 위반
    1: 1.1, // 2회
    2: 1.2, // 3회
    3: 1.3, // 4회
    4: 1.5, // 5회 이상
  },

  // 신고 횟수에 따른 가중치
  REPORT_COUNT: {
    1: 1.0,
    2: 1.05,
    3: 1.1,
    4: 1.15,
    5: 1.2, // 5회 이상
  },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 콘텐츠 타입 가중치 계산
 */
function getContentTypeWeight(contentType: 'post' | 'comment'): number {
  return WEIGHTS.CONTENT_TYPE[contentType];
}

/**
 * 위반 이력 가중치 계산
 */
function getViolationHistoryWeight(violations: number): number {
  if (violations === 0) return WEIGHTS.VIOLATION_HISTORY[0];
  if (violations === 1) return WEIGHTS.VIOLATION_HISTORY[1];
  if (violations === 2) return WEIGHTS.VIOLATION_HISTORY[2];
  if (violations === 3) return WEIGHTS.VIOLATION_HISTORY[3];
  return WEIGHTS.VIOLATION_HISTORY[4]; // 4회 이상
}

/**
 * 신고 횟수 가중치 계산
 */
function getReportCountWeight(reportCount: number): number {
  if (reportCount <= 1) return WEIGHTS.REPORT_COUNT[1];
  if (reportCount === 2) return WEIGHTS.REPORT_COUNT[2];
  if (reportCount === 3) return WEIGHTS.REPORT_COUNT[3];
  if (reportCount === 4) return WEIGHTS.REPORT_COUNT[4];
  return WEIGHTS.REPORT_COUNT[5]; // 5회 이상
}

/**
 * 컨텍스트 기반 점수 조정
 */
function calculateContextAdjustment(
  baseScore: number,
  context: ScoringContext
): number {
  let adjustment = 0;

  // 콘텐츠 타입 조정
  const typeWeight = getContentTypeWeight(context.contentType);
  adjustment += baseScore * (typeWeight - 1.0);

  // 이전 위반 이력 조정
  if (context.previousViolations && context.previousViolations > 0) {
    const historyWeight = getViolationHistoryWeight(context.previousViolations);
    adjustment += baseScore * (historyWeight - 1.0);
  }

  // 신고 횟수 조정
  if (context.reportCount && context.reportCount > 1) {
    const reportWeight = getReportCountWeight(context.reportCount);
    adjustment += baseScore * (reportWeight - 1.0);
  }

  return adjustment;
}

/**
 * 최종 액션 결정
 */
function determineAction(score: number): 'ignore' | 'review' | 'delete' {
  if (score <= SEVERITY_THRESHOLDS.IGNORE_MAX) {
    return 'ignore';
  } else if (score <= SEVERITY_THRESHOLDS.REVIEW_MAX) {
    return 'review';
  } else {
    return 'delete';
  }
}

/**
 * 액션 상세 정보 생성
 */
function generateActionDetails(
  action: 'ignore' | 'review' | 'delete',
  score: number,
  context: ScoringContext,
  aiResult: ContentAnalysisResult
): ActionDetails {
  const details: ActionDetails = {
    shouldDelete: action === 'delete',
    shouldWarnUser: action === 'delete' || (action === 'review' && score > 50),
    shouldNotifyAdmin: action === 'review' || action === 'delete',
  };

  // 경고 메시지 생성
  if (details.shouldWarnUser) {
    const violations = context.previousViolations || 0;
    if (action === 'delete') {
      details.warningMessage = `귀하의 ${context.contentType === 'post' ? '게시글' : '댓글'}이 커뮤니티 가이드라인 위반으로 삭제되었습니다. `;

      if (violations >= 3) {
        details.warningMessage +=
          '반복적인 위반으로 인해 계정이 정지될 수 있습니다.';
      } else if (violations >= 1) {
        details.warningMessage += `현재까지 ${violations + 1}회 위반하셨습니다.`;
      } else {
        details.warningMessage += '추가 위반 시 계정 제재가 있을 수 있습니다.';
      }
    } else {
      details.warningMessage = `귀하의 ${context.contentType === 'post' ? '게시글' : '댓글'}이 커뮤니티 가이드라인 위반 가능성이 있어 검토 중입니다.`;
    }
  }

  // 관리자 노트 생성
  if (details.shouldNotifyAdmin) {
    const highestCategory = aiResult.categories.reduce(
      (max, cat) => (cat.score > (max?.score || 0) ? cat : max),
      null as ViolationCategory | null
    );

    details.adminNote = `심각도: ${score}점 | 액션: ${action}`;
    if (highestCategory) {
      details.adminNote += ` | 주요 위반: ${highestCategory.type} (${highestCategory.score}점)`;
    }
    if (context.previousViolations) {
      details.adminNote += ` | 이전 위반: ${context.previousViolations}회`;
    }
    details.adminNote += ` | AI 근거: ${aiResult.reasoning.substring(0, 100)}...`;
  }

  return details;
}

// ============================================================================
// Main Scoring Function
// ============================================================================

/**
 * 최종 심각도 점수 계산
 *
 * @param aiResult AI 분석 결과
 * @param context 콘텐츠 컨텍스트
 * @returns 심각도 점수 및 액션 정보
 *
 * @example
 * const score = calculateSeverityScore(aiResult, {
 *   contentType: 'comment',
 *   previousViolations: 2,
 *   reportCount: 3
 * });
 * console.log(score.action); // 'delete'
 */
export function calculateSeverityScore(
  aiResult: ContentAnalysisResult,
  context: ScoringContext
): SeverityScoreResult {
  // 1. AI 기본 점수
  const aiScore = aiResult.severity;

  // 2. 컨텍스트 조정 점수 계산
  const contextAdjustment = calculateContextAdjustment(aiScore, context);

  // 3. 최종 점수 계산 (0-100 범위로 제한)
  const finalScore = Math.min(100, Math.max(0, aiScore + contextAdjustment));

  // 4. 액션 결정
  const action = determineAction(finalScore);

  // 5. 액션 상세 정보 생성
  const actionDetails = generateActionDetails(action, finalScore, context, aiResult);

  console.log('[심각도 점수 계산]', {
    aiScore,
    contextAdjustment,
    finalScore,
    action,
    context,
  });

  return {
    finalScore,
    action,
    breakdown: {
      aiScore,
      contextAdjustment,
      historyAdjustment: context.previousViolations
        ? getViolationHistoryWeight(context.previousViolations) - 1.0
        : 0,
    },
    actionDetails,
  };
}

// ============================================================================
// Batch Scoring
// ============================================================================

/**
 * 여러 콘텐츠 일괄 점수 계산
 *
 * @param results AI 분석 결과 배열
 * @param contexts 컨텍스트 배열
 * @returns 점수 결과 배열
 */
export function calculateBatchScores(
  results: ContentAnalysisResult[],
  contexts: ScoringContext[]
): SeverityScoreResult[] {
  if (results.length !== contexts.length) {
    throw new Error('결과와 컨텍스트 배열의 길이가 일치하지 않습니다.');
  }

  return results.map((result, index) =>
    calculateSeverityScore(result, contexts[index])
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 액션별 통계 계산
 *
 * @param scores 점수 결과 배열
 * @returns 액션별 통계
 */
export function getActionStatistics(scores: SeverityScoreResult[]): {
  total: number;
  ignore: number;
  review: number;
  delete: number;
  averageScore: number;
} {
  const total = scores.length;
  const ignore = scores.filter((s) => s.action === 'ignore').length;
  const review = scores.filter((s) => s.action === 'review').length;
  const deleteCount = scores.filter((s) => s.action === 'delete').length;
  const averageScore =
    scores.reduce((sum, s) => sum + s.finalScore, 0) / total || 0;

  return {
    total,
    ignore,
    review,
    delete: deleteCount,
    averageScore: Math.round(averageScore * 10) / 10,
  };
}

/**
 * 위험도 레벨 계산
 *
 * @param score 심각도 점수
 * @returns 위험도 레벨
 */
export function getRiskLevel(
  score: number
): 'safe' | 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 20) return 'safe';
  if (score <= 40) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 80) return 'high';
  return 'critical';
}

/**
 * 점수를 백분율 문자열로 변환
 *
 * @param score 점수 (0-100)
 * @returns 백분율 문자열
 */
export function formatScoreAsPercentage(score: number): string {
  return `${Math.round(score)}%`;
}

/**
 * 액션 한글 변환
 *
 * @param action 액션
 * @returns 한글 액션명
 */
export function getActionLabel(action: 'ignore' | 'review' | 'delete'): string {
  const labels = {
    ignore: '무시',
    review: '검토 필요',
    delete: '자동 삭제',
  };
  return labels[action];
}

// ============================================================================
// Exports
// ============================================================================

export default {
  calculateSeverityScore,
  calculateBatchScores,
  getActionStatistics,
  getRiskLevel,
  formatScoreAsPercentage,
  getActionLabel,
  SEVERITY_THRESHOLDS,
};
