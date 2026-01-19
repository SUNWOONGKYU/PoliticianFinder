/**
 * @file Session Management Security
 * @description 세션 고정 공격 방지 및 세션 타임아웃 관리
 * @created 2026-01-19
 */

import { createClient } from '@/lib/supabase/server';
import { logger, logSecurityEvent } from '@/lib/utils/logger';

/**
 * 세션 설정
 */
export const SESSION_CONFIG = {
  // 세션 타임아웃 (초)
  MAX_IDLE_TIME: 60 * 60, // 1시간
  MAX_SESSION_TIME: 60 * 60 * 24 * 7, // 7일
  // 세션 갱신 간격 (초)
  REFRESH_INTERVAL: 60 * 15, // 15분
};

/**
 * 세션 타임아웃 확인
 * 마지막 활동 시간을 기준으로 세션이 만료되었는지 확인
 *
 * @param lastActivity - 마지막 활동 시간 (Unix timestamp)
 * @returns 세션이 유효하면 true
 */
export function isSessionValid(lastActivity: number): boolean {
  const now = Date.now() / 1000;
  const elapsed = now - lastActivity;
  return elapsed < SESSION_CONFIG.MAX_IDLE_TIME;
}

/**
 * 세션 갱신 필요 여부 확인
 * 세션이 오래되었으면 갱신 필요
 *
 * @param lastRefresh - 마지막 갱신 시간 (Unix timestamp)
 * @returns 갱신이 필요하면 true
 */
export function shouldRefreshSession(lastRefresh: number): boolean {
  const now = Date.now() / 1000;
  const elapsed = now - lastRefresh;
  return elapsed > SESSION_CONFIG.REFRESH_INTERVAL;
}

/**
 * 세션 고정 공격 방지
 * 로그인 후 세션 ID를 재생성하여 세션 고정 공격 방지
 *
 * @description
 * Supabase는 자동으로 새로운 JWT 토큰을 발급하므로
 * 별도의 세션 ID 재생성이 필요 없습니다.
 * 이 함수는 로그인 후 보안 이벤트를 기록합니다.
 *
 * @param userId - 사용자 ID
 * @param ip - 사용자 IP 주소
 */
export async function preventSessionFixation(userId: string, ip?: string) {
  // Supabase는 signIn 시 자동으로 새로운 JWT 발급
  // 추가적인 보안 로깅만 수행

  logSecurityEvent('session_created', {
    userId,
    ip: ip || 'unknown',
    timestamp: new Date().toISOString(),
  }, 'low');

  logger.info('새 세션 생성됨 (세션 고정 방지)', {
    action: 'session_created',
    userId,
  });
}

/**
 * 세션 갱신
 * 세션이 만료되기 전에 갱신하여 사용자 로그아웃 방지
 *
 * @returns 갱신 성공 여부
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      logger.warn('세션 갱신 실패', {
        action: 'session_refresh',
        error: error.message,
      });
      return false;
    }

    if (data.session) {
      logger.info('세션 갱신 성공', {
        action: 'session_refresh',
        userId: data.session.user.id,
      });
      return true;
    }

    return false;
  } catch (error) {
    logger.error('세션 갱신 오류', {
      action: 'session_refresh',
    }, error);
    return false;
  }
}

/**
 * 세션 무효화
 * 로그아웃 시 또는 의심스러운 활동 감지 시 세션 무효화
 *
 * @param userId - 사용자 ID (로깅용)
 * @param reason - 무효화 사유
 */
export async function invalidateSession(userId?: string, reason = 'logout') {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    logSecurityEvent('session_invalidated', {
      userId: userId || 'unknown',
      reason,
      timestamp: new Date().toISOString(),
    }, reason === 'suspicious_activity' ? 'high' : 'low');

    logger.info('세션 무효화됨', {
      action: 'session_invalidated',
      userId,
      reason,
    });
  } catch (error) {
    logger.error('세션 무효화 실패', {
      action: 'session_invalidated',
      userId,
    }, error);
  }
}

/**
 * 의심스러운 활동 감지 시 세션 무효화
 *
 * @param userId - 사용자 ID
 * @param activityType - 활동 유형
 * @param details - 상세 정보
 */
export async function invalidateOnSuspiciousActivity(
  userId: string,
  activityType: string,
  details?: Record<string, any>
) {
  logSecurityEvent('suspicious_activity_detected', {
    userId,
    activityType,
    ...details,
    timestamp: new Date().toISOString(),
  }, 'critical');

  await invalidateSession(userId, 'suspicious_activity');
}

/**
 * 세션 정보 검증
 * 세션이 유효하고 사용자가 인증되었는지 확인
 *
 * @returns 유효한 세션이면 사용자 정보 반환, 아니면 null
 */
export async function validateSession() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    logger.error('세션 검증 오류', {
      action: 'session_validation',
    }, error);
    return null;
  }
}

/**
 * 세션 활동 시간 업데이트
 * 마지막 활동 시간을 기록하여 타임아웃 관리
 *
 * @note 실제 구현 시 Redis 또는 데이터베이스에 저장 권장
 */
const sessionActivityMap = new Map<string, number>();

export function updateSessionActivity(userId: string) {
  sessionActivityMap.set(userId, Date.now() / 1000);
}

export function getLastActivity(userId: string): number | null {
  return sessionActivityMap.get(userId) || null;
}

/**
 * 세션 만료 확인 및 자동 무효화
 *
 * @param userId - 사용자 ID
 * @returns 세션이 유효하면 true
 */
export async function checkSessionExpiry(userId: string): Promise<boolean> {
  const lastActivity = getLastActivity(userId);

  if (!lastActivity) {
    // 활동 기록이 없으면 현재 시간으로 초기화
    updateSessionActivity(userId);
    return true;
  }

  if (!isSessionValid(lastActivity)) {
    // 세션이 만료되었으면 무효화
    await invalidateSession(userId, 'timeout');
    return false;
  }

  // 세션이 유효하면 활동 시간 업데이트
  updateSessionActivity(userId);
  return true;
}
