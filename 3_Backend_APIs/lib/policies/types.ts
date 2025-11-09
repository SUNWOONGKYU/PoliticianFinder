/**
 * Project Grid Task ID: P4BA10
 * 작업명: 정책 관리 API - 타입 정의
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5 (api-designer)
 * 의존성: P2D1 (Database 스키마)
 * 설명: 정책 관리 API 타입 정의
 */

// ============================================================================
// 정책 타입
// ============================================================================

/**
 * 정책 종류
 */
export type PolicyType = 'terms' | 'privacy' | 'marketing' | 'community';

/**
 * 정책 엔티티
 */
export interface Policy {
  id: string;
  type: PolicyType;
  version: number;
  title: string;
  content: string;
  is_current: boolean;
  effective_date: string;
  updated_by?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// API 요청/응답 타입
// ============================================================================

/**
 * 정책 생성 요청
 */
export interface CreatePolicyRequest {
  type: PolicyType;
  title: string;
  content: string;
  effective_date: string;
  updated_by?: string;
}

/**
 * 정책 업데이트 요청
 */
export interface UpdatePolicyRequest {
  title?: string;
  content?: string;
  effective_date?: string;
}

/**
 * 현재 버전 설정 요청
 */
export interface SetCurrentRequest {
  set_current: boolean;
}

/**
 * 정책 목록 조회 응답
 */
export interface GetPoliciesResponse {
  success: boolean;
  data: Policy[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

/**
 * 단일 정책 조회 응답
 */
export interface GetPolicyResponse {
  success: boolean;
  data: Policy & {
    type_name?: string;
  };
  timestamp: string;
}

/**
 * 정책 생성 응답
 */
export interface CreatePolicyResponse {
  success: boolean;
  data?: Policy;
  message?: string;
  error?: string;
  details?: any;
  timestamp: string;
}

/**
 * 정책 업데이트 응답
 */
export interface UpdatePolicyResponse {
  success: boolean;
  data?: Policy;
  message?: string;
  error?: string;
  details?: any;
  timestamp: string;
}

/**
 * 정책 삭제 응답
 */
export interface DeletePolicyResponse {
  success: boolean;
  message?: string;
  error?: string;
  timestamp: string;
}

/**
 * 에러 응답
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  timestamp: string;
}

// ============================================================================
// API 엔드포인트 타입
// ============================================================================

/**
 * 정책 관리 API 엔드포인트
 */
export const POLICY_API_ENDPOINTS = {
  // 관리자용
  ADMIN_POLICIES: '/api/admin/policies',
  ADMIN_POLICY_BY_ID: '/api/admin/policies/:id',

  // 사용자용
  PUBLIC_POLICY_BY_TYPE: '/api/policies/:type',
} as const;

/**
 * 정책 목록 조회 쿼리 파라미터
 */
export interface GetPoliciesQuery {
  current?: boolean;
  type?: PolicyType;
  page?: number;
  limit?: number;
}

/**
 * 정책 조회 쿼리 파라미터 (사용자용)
 */
export interface GetPolicyQuery {
  version?: number;
}

// ============================================================================
// 유틸리티 타입
// ============================================================================

/**
 * 정책 타입 이름 매핑
 */
export const POLICY_TYPE_NAMES: Record<PolicyType, string> = {
  terms: '이용약관',
  privacy: '개인정보처리방침',
  marketing: '마케팅 수신 동의',
  community: '커뮤니티 가이드라인',
} as const;

/**
 * 정책 버전 비교 결과
 */
export interface PolicyVersionComparison {
  current: Policy;
  previous?: Policy;
  changes: {
    title: boolean;
    content: boolean;
    effective_date: boolean;
  };
}

/**
 * 정책 히스토리 엔트리
 */
export interface PolicyHistoryEntry {
  version: number;
  title: string;
  effective_date: string;
  created_at: string;
  is_current: boolean;
  updated_by?: string;
}
