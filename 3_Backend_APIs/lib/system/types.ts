/**
 * Project Grid Task ID: P4BA12
 * 작업명: 시스템 설정 API - 타입 정의
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5 (api-designer)
 * 의존성: P2D1 (Database 스키마)
 * 설명: 시스템 설정 관련 TypeScript 타입 정의
 */

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * 표준 API 응답 형식
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * 페이지네이션 메타데이터
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * 페이지네이션이 포함된 API 응답
 */
export interface PaginatedApiResponse<T = any> extends ApiResponse<T> {
  pagination: PaginationMeta;
}

// ============================================================================
// Database Types
// ============================================================================

/**
 * system_settings 테이블 스키마
 */
export interface SystemSettingRow {
  key: string;
  value: any; // JSONB
  description?: string;
  updated_at: string;
}

// ============================================================================
// Setting Category Types
// ============================================================================

/**
 * 포인트 설정 타입
 */
export interface PointSettings {
  /** 게시글 작성 포인트 */
  post: number;
  /** 댓글 작성 포인트 */
  comment: number;
  /** 좋아요 포인트 */
  like: number;
  /** 팔로우 포인트 */
  follow: number;
  /** 공유 포인트 */
  share?: number;
  /** 신고 포인트 */
  report?: number;
  /** 본인 인증 포인트 */
  verification?: number;
}

/**
 * 등급 설정 타입
 */
export interface RankSettings {
  /** 브론즈 등급 필요 포인트 */
  bronze: number;
  /** 실버 등급 필요 포인트 */
  silver: number;
  /** 골드 등급 필요 포인트 */
  gold: number;
  /** 플래티넘 등급 필요 포인트 */
  platinum: number;
  /** 다이아몬드 등급 필요 포인트 */
  diamond: number;
}

/**
 * 기능 토글 설정 타입
 */
export interface FeatureSettings {
  /** 커뮤니티 기능 활성화 */
  community: boolean;
  /** AI 평가 기능 활성화 */
  ai_evaluation: boolean;
  /** 알림 기능 활성화 */
  notifications: boolean;
  /** 광고 기능 활성화 */
  advertisements: boolean;
  /** 정치인 본인인증 기능 활성화 */
  politician_verification: boolean;
}

/**
 * 유지보수 모드 설정 타입
 */
export interface MaintenanceSettings {
  /** 유지보수 모드 활성화 */
  enabled: boolean;
  /** 점검 메시지 */
  message: string;
  /** 점검 시작 시간 (ISO 8601) */
  start_time?: string;
  /** 점검 종료 시간 (ISO 8601) */
  end_time?: string;
}

/**
 * 제한 설정 타입
 */
export interface LimitSettings {
  /** 최대 업로드 크기 (MB) */
  max_upload_size_mb: number;
  /** 최대 게시글 길이 (문자) */
  max_post_length: number;
  /** 최대 댓글 길이 (문자) */
  max_comment_length: number;
  /** 일일 최대 게시글 수 */
  max_daily_posts: number;
  /** 일일 최대 댓글 수 */
  max_daily_comments: number;
}

/**
 * 모든 공개 설정
 */
export interface PublicSettings {
  maintenance: MaintenanceSettings;
  features: FeatureSettings;
  limits: LimitSettings;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * 설정 업데이트 요청
 */
export interface UpdateSettingRequest {
  key: string;
  value: any;
}

/**
 * 일괄 설정 업데이트 요청
 */
export interface BulkUpdateSettingsRequest {
  settings: UpdateSettingRequest[];
}

/**
 * 설정 조회 쿼리 파라미터
 */
export interface GetSettingsQuery {
  category?: SettingCategory;
  key?: string;
}

/**
 * 공개 설정 조회 쿼리 파라미터
 */
export interface GetPublicSettingsQuery {
  check?: 'maintenance' | 'features' | 'limits';
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * 전체 설정 조회 응답
 */
export interface GetAllSettingsResponse extends ApiResponse<SystemSettingRow[]> {
  total: number;
}

/**
 * 카테고리별 설정 조회 응답
 */
export interface GetCategorySettingsResponse extends ApiResponse {
  category: string;
  data: PointSettings | RankSettings | FeatureSettings | MaintenanceSettings | LimitSettings;
}

/**
 * 단일 설정 조회 응답
 */
export interface GetSettingResponse extends ApiResponse {
  data: {
    key: string;
    value: any;
  };
}

/**
 * 설정 업데이트 응답
 */
export interface UpdateSettingResponse extends ApiResponse<SystemSettingRow> {
  message: string;
}

/**
 * 일괄 설정 업데이트 응답
 */
export interface BulkUpdateSettingsResponse extends ApiResponse {
  data: {
    updated: number;
  };
  message: string;
}

/**
 * 공개 설정 조회 응답
 */
export interface GetPublicSettingsResponse extends ApiResponse<PublicSettings> {}

/**
 * 캐시 삭제 응답
 */
export interface ClearCacheResponse extends ApiResponse {
  message: string;
}

// ============================================================================
// Enum Types
// ============================================================================

/**
 * 설정 카테고리
 */
export type SettingCategory = 'points' | 'ranks' | 'features' | 'maintenance' | 'limits';

/**
 * 포인트 액션 타입
 */
export type PointAction = 'post' | 'comment' | 'like' | 'follow' | 'share' | 'report' | 'verification';

/**
 * 등급 타입
 */
export type RankType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

/**
 * 기능 타입
 */
export type FeatureType = 'community' | 'ai_evaluation' | 'notifications' | 'advertisements' | 'politician_verification';

// ============================================================================
// Utility Types
// ============================================================================

/**
 * 설정 키 생성 헬퍼
 */
export type SettingKey<C extends SettingCategory, K extends string> = `${C}.${K}`;

/**
 * 포인트 설정 키
 */
export type PointSettingKey = SettingKey<'points', PointAction>;

/**
 * 등급 설정 키
 */
export type RankSettingKey = SettingKey<'ranks', RankType>;

/**
 * 기능 설정 키
 */
export type FeatureSettingKey = SettingKey<'features', FeatureType>;

/**
 * 유지보수 설정 키
 */
export type MaintenanceSettingKey =
  | 'maintenance.enabled'
  | 'maintenance.message'
  | 'maintenance.start_time'
  | 'maintenance.end_time';

/**
 * 제한 설정 키
 */
export type LimitSettingKey =
  | 'limits.max_upload_size_mb'
  | 'limits.max_post_length'
  | 'limits.max_comment_length'
  | 'limits.max_daily_posts'
  | 'limits.max_daily_comments';

/**
 * 모든 유효한 설정 키
 */
export type ValidSettingKey =
  | PointSettingKey
  | RankSettingKey
  | FeatureSettingKey
  | MaintenanceSettingKey
  | LimitSettingKey;

// ============================================================================
// Helper Functions Type Guards
// ============================================================================

/**
 * PointSettings 타입 가드
 */
export function isPointSettings(settings: any): settings is PointSettings {
  return (
    typeof settings === 'object' &&
    'post' in settings &&
    'comment' in settings &&
    'like' in settings &&
    'follow' in settings
  );
}

/**
 * RankSettings 타입 가드
 */
export function isRankSettings(settings: any): settings is RankSettings {
  return (
    typeof settings === 'object' &&
    'bronze' in settings &&
    'silver' in settings &&
    'gold' in settings &&
    'platinum' in settings &&
    'diamond' in settings
  );
}

/**
 * FeatureSettings 타입 가드
 */
export function isFeatureSettings(settings: any): settings is FeatureSettings {
  return (
    typeof settings === 'object' &&
    'community' in settings &&
    'ai_evaluation' in settings &&
    'notifications' in settings
  );
}

/**
 * MaintenanceSettings 타입 가드
 */
export function isMaintenanceSettings(settings: any): settings is MaintenanceSettings {
  return (
    typeof settings === 'object' &&
    'enabled' in settings &&
    'message' in settings
  );
}

/**
 * LimitSettings 타입 가드
 */
export function isLimitSettings(settings: any): settings is LimitSettings {
  return (
    typeof settings === 'object' &&
    'max_upload_size_mb' in settings &&
    'max_post_length' in settings &&
    'max_comment_length' in settings
  );
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 기본 포인트 설정
 */
export const DEFAULT_POINT_SETTINGS: PointSettings = {
  post: 10,
  comment: 5,
  like: 1,
  follow: 20,
  share: 3,
  report: 5,
  verification: 100,
};

/**
 * 기본 등급 설정
 */
export const DEFAULT_RANK_SETTINGS: RankSettings = {
  bronze: 0,
  silver: 100,
  gold: 500,
  platinum: 2000,
  diamond: 10000,
};

/**
 * 기본 기능 설정
 */
export const DEFAULT_FEATURE_SETTINGS: FeatureSettings = {
  community: true,
  ai_evaluation: true,
  notifications: true,
  advertisements: false,
  politician_verification: true,
};

/**
 * 기본 유지보수 설정
 */
export const DEFAULT_MAINTENANCE_SETTINGS: MaintenanceSettings = {
  enabled: false,
  message: '서비스 점검 중입니다',
};

/**
 * 기본 제한 설정
 */
export const DEFAULT_LIMIT_SETTINGS: LimitSettings = {
  max_upload_size_mb: 10,
  max_post_length: 5000,
  max_comment_length: 1000,
  max_daily_posts: 50,
  max_daily_comments: 100,
};
