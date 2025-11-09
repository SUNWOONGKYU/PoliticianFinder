/**
 * Project Grid Task ID: P4BA12
 * 작업명: 시스템 설정 API - 미들웨어 헬퍼
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5 (api-designer)
 * 의존성: P2D1 (Database 스키마)
 * 설명: Next.js 미들웨어에서 사용할 수 있는 유틸리티 함수들
 */

import { NextRequest, NextResponse } from 'next/server';
import { SettingsManager } from './settings-manager';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * 유지보수 모드 미들웨어
 * 유지보수 모드가 활성화된 경우 503 응답 반환
 *
 * @param request Next.js 요청 객체
 * @param options 옵션 (관리자 경로 등)
 * @returns 유지보수 모드가 아니거나 관리자인 경우 null, 그렇지 않으면 503 응답
 *
 * @example
 * // middleware.ts
 * import { checkMaintenanceMode } from '@/lib/system/middleware-helper';
 *
 * export async function middleware(request: NextRequest) {
 *   const maintenanceResponse = await checkMaintenanceMode(request, {
 *     adminPaths: ['/admin', '/api/admin']
 *   });
 *   if (maintenanceResponse) return maintenanceResponse;
 *
 *   // 정상 처리
 * }
 */
export async function checkMaintenanceMode(
  request: NextRequest,
  options?: {
    adminPaths?: string[];
    excludePaths?: string[];
  }
): Promise<NextResponse | null> {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  // 제외할 경로 확인
  if (options?.excludePaths) {
    const isExcluded = options.excludePaths.some(path =>
      request.nextUrl.pathname.startsWith(path)
    );
    if (isExcluded) return null;
  }

  // 관리자 경로 확인
  const isAdminPath = options?.adminPaths?.some(path =>
    request.nextUrl.pathname.startsWith(path)
  ) ?? false;

  // 관리자 경로는 유지보수 모드에서도 접근 가능
  if (isAdminPath) {
    return null;
  }

  // 유지보수 모드 확인
  const maintenance = await settingsManager.getMaintenanceSettings();

  if (maintenance.enabled) {
    // 유지보수 페이지로 리디렉트하거나 JSON 응답 반환
    if (request.nextUrl.pathname.startsWith('/api/')) {
      // API 요청: JSON 응답
      return NextResponse.json(
        {
          success: false,
          error: maintenance.message,
          maintenance: true,
          start_time: maintenance.start_time,
          end_time: maintenance.end_time,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    } else {
      // 웹 페이지: 유지보수 페이지로 리디렉트
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  return null;
}

/**
 * 기능 활성화 확인 미들웨어
 * 특정 기능이 비활성화된 경우 403 응답 반환
 *
 * @param request Next.js 요청 객체
 * @param feature 확인할 기능 이름
 * @returns 기능이 활성화된 경우 null, 그렇지 않으면 403 응답
 *
 * @example
 * // app/api/community/route.ts
 * import { checkFeatureEnabled } from '@/lib/system/middleware-helper';
 *
 * export async function GET(request: NextRequest) {
 *   const featureCheck = await checkFeatureEnabled(request, 'community');
 *   if (featureCheck) return featureCheck;
 *
 *   // 정상 처리
 * }
 */
export async function checkFeatureEnabled(
  request: NextRequest,
  feature: string
): Promise<NextResponse | null> {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  const isEnabled = await settingsManager.isFeatureEnabled(feature);

  if (!isEnabled) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: `${feature} 기능이 현재 비활성화되어 있습니다`,
          feature,
          enabled: false,
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    } else {
      return NextResponse.redirect(new URL('/feature-disabled', request.url));
    }
  }

  return null;
}

/**
 * 업로드 크기 검증 헬퍼
 *
 * @param fileSizeMB 파일 크기 (MB)
 * @returns 검증 결과
 *
 * @example
 * const validation = await validateUploadSize(fileSizeMB);
 * if (!validation.valid) {
 *   throw new Error(validation.error);
 * }
 */
export async function validateUploadSize(fileSizeMB: number): Promise<{
  valid: boolean;
  error?: string;
  maxSize: number;
}> {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  const limits = await settingsManager.getLimitSettings();
  const maxSize = limits.max_upload_size_mb;

  if (fileSizeMB > maxSize) {
    return {
      valid: false,
      error: `파일 크기는 ${maxSize}MB를 초과할 수 없습니다 (현재: ${fileSizeMB}MB)`,
      maxSize,
    };
  }

  return {
    valid: true,
    maxSize,
  };
}

/**
 * 게시글 길이 검증 헬퍼
 *
 * @param content 게시글 내용
 * @returns 검증 결과
 */
export async function validatePostLength(content: string): Promise<{
  valid: boolean;
  error?: string;
  maxLength: number;
  currentLength: number;
}> {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  const limits = await settingsManager.getLimitSettings();
  const maxLength = limits.max_post_length;
  const currentLength = content.length;

  if (currentLength > maxLength) {
    return {
      valid: false,
      error: `게시글은 ${maxLength}자를 초과할 수 없습니다 (현재: ${currentLength}자)`,
      maxLength,
      currentLength,
    };
  }

  return {
    valid: true,
    maxLength,
    currentLength,
  };
}

/**
 * 댓글 길이 검증 헬퍼
 *
 * @param content 댓글 내용
 * @returns 검증 결과
 */
export async function validateCommentLength(content: string): Promise<{
  valid: boolean;
  error?: string;
  maxLength: number;
  currentLength: number;
}> {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  const limits = await settingsManager.getLimitSettings();
  const maxLength = limits.max_comment_length;
  const currentLength = content.length;

  if (currentLength > maxLength) {
    return {
      valid: false,
      error: `댓글은 ${maxLength}자를 초과할 수 없습니다 (현재: ${currentLength}자)`,
      maxLength,
      currentLength,
    };
  }

  return {
    valid: true,
    maxLength,
    currentLength,
  };
}

/**
 * 일일 게시글 제한 확인 헬퍼
 *
 * @param userPostsToday 오늘 작성한 게시글 수
 * @returns 검증 결과
 */
export async function checkDailyPostLimit(userPostsToday: number): Promise<{
  allowed: boolean;
  error?: string;
  remaining: number;
  max: number;
}> {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  const limits = await settingsManager.getLimitSettings();
  const maxPosts = limits.max_daily_posts;

  if (userPostsToday >= maxPosts) {
    return {
      allowed: false,
      error: `일일 게시글 제한에 도달했습니다 (최대: ${maxPosts}개)`,
      remaining: 0,
      max: maxPosts,
    };
  }

  return {
    allowed: true,
    remaining: maxPosts - userPostsToday,
    max: maxPosts,
  };
}

/**
 * 일일 댓글 제한 확인 헬퍼
 *
 * @param userCommentsToday 오늘 작성한 댓글 수
 * @returns 검증 결과
 */
export async function checkDailyCommentLimit(userCommentsToday: number): Promise<{
  allowed: boolean;
  error?: string;
  remaining: number;
  max: number;
}> {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  const limits = await settingsManager.getLimitSettings();
  const maxComments = limits.max_daily_comments;

  if (userCommentsToday >= maxComments) {
    return {
      allowed: false,
      error: `일일 댓글 제한에 도달했습니다 (최대: ${maxComments}개)`,
      remaining: 0,
      max: maxComments,
    };
  }

  return {
    allowed: true,
    remaining: maxComments - userCommentsToday,
    max: maxComments,
  };
}

/**
 * 사용자 등급 계산 헬퍼
 *
 * @param userPoints 사용자 포인트
 * @returns 사용자 등급 및 정보
 */
export async function calculateUserRank(userPoints: number): Promise<{
  rank: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  currentPoints: number;
  nextRank: string | null;
  pointsToNextRank: number | null;
}> {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  const rankSettings = await settingsManager.getRankSettings();

  let rank: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' = 'bronze';
  let nextRank: string | null = 'silver';
  let pointsToNextRank: number | null = rankSettings.silver - userPoints;

  if (userPoints >= rankSettings.diamond) {
    rank = 'diamond';
    nextRank = null;
    pointsToNextRank = null;
  } else if (userPoints >= rankSettings.platinum) {
    rank = 'platinum';
    nextRank = 'diamond';
    pointsToNextRank = rankSettings.diamond - userPoints;
  } else if (userPoints >= rankSettings.gold) {
    rank = 'gold';
    nextRank = 'platinum';
    pointsToNextRank = rankSettings.platinum - userPoints;
  } else if (userPoints >= rankSettings.silver) {
    rank = 'silver';
    nextRank = 'gold';
    pointsToNextRank = rankSettings.gold - userPoints;
  }

  return {
    rank,
    currentPoints: userPoints,
    nextRank,
    pointsToNextRank,
  };
}

/**
 * 포인트 지급 헬퍼
 *
 * @param action 포인트 액션 (post, comment, like, follow 등)
 * @returns 지급할 포인트
 */
export async function getPointsForAction(
  action: 'post' | 'comment' | 'like' | 'follow' | 'share' | 'report' | 'verification'
): Promise<number> {
  const settingsManager = new SettingsManager(supabaseUrl, supabaseServiceKey);

  const pointSettings = await settingsManager.getPointSettings();
  return pointSettings[action] || 0;
}

/**
 * 모든 제한 검증을 한 번에 수행하는 헬퍼
 *
 * @param params 검증 파라미터
 * @returns 검증 결과
 */
export async function validateLimits(params: {
  fileSizeMB?: number;
  postContent?: string;
  commentContent?: number;
  userPostsToday?: number;
  userCommentsToday?: number;
}): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  if (params.fileSizeMB !== undefined) {
    const uploadResult = await validateUploadSize(params.fileSizeMB);
    if (!uploadResult.valid && uploadResult.error) {
      errors.push(uploadResult.error);
    }
  }

  if (params.postContent !== undefined) {
    const postResult = await validatePostLength(params.postContent);
    if (!postResult.valid && postResult.error) {
      errors.push(postResult.error);
    }
  }

  if (params.commentContent !== undefined) {
    const commentResult = await validateCommentLength(String(params.commentContent));
    if (!commentResult.valid && commentResult.error) {
      errors.push(commentResult.error);
    }
  }

  if (params.userPostsToday !== undefined) {
    const dailyPostResult = await checkDailyPostLimit(params.userPostsToday);
    if (!dailyPostResult.allowed && dailyPostResult.error) {
      errors.push(dailyPostResult.error);
    }
  }

  if (params.userCommentsToday !== undefined) {
    const dailyCommentResult = await checkDailyCommentLimit(params.userCommentsToday);
    if (!dailyCommentResult.allowed && dailyCommentResult.error) {
      errors.push(dailyCommentResult.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
