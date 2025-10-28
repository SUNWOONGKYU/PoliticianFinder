/**
 * Community Feature Types for Phase 3
 *
 * This file contains type definitions for community features including
 * notifications, comments, replies, and likes.
 */

/**
 * 알림 타입 Enum
 */
export enum NotificationType {
  COMMENT = 'comment',           // 내 글에 댓글
  REPLY = 'reply',               // 내 댓글에 답글
  LIKE = 'like',                 // 좋아요
  RATING = 'rating',             // 내가 평가한 정치인에 대한 새 평가
  MENTION = 'mention',           // 멘션
  SYSTEM = 'system'              // 시스템 알림
}

/**
 * 알림 상태 Enum
 */
export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived'
}

/**
 * 알림 인터페이스
 */
export interface Notification {
  id: number
  user_id: string                     // 알림 받는 사용자
  type: NotificationType
  status: NotificationStatus
  title: string
  message: string
  link?: string                        // 관련 링크 (예: /politicians/123#comment-456)
  metadata?: Record<string, any>      // 추가 데이터 (JSON)
  sender_id?: string                   // 알림 발송자 (시스템 알림의 경우 null)
  created_at: string
  read_at?: string
}

/**
 * 알림 생성 요청
 */
export interface CreateNotificationRequest {
  user_id: string
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
  sender_id?: string
}

/**
 * 알림 업데이트 요청
 */
export interface UpdateNotificationRequest {
  status?: NotificationStatus
  read_at?: string
}

/**
 * 알림 필터
 */
export interface NotificationFilters {
  type?: NotificationType
  status?: NotificationStatus
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

/**
 * 댓글 상태 Enum
 */
export enum CommentStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
  HIDDEN = 'hidden',
  REPORTED = 'reported'
}

/**
 * 댓글 인터페이스
 */
export interface Comment {
  id: number
  politician_id: number               // 댓글이 달린 정치인
  user_id: string                     // 작성자
  parent_id?: number                  // 부모 댓글 ID (대댓글인 경우)
  content: string
  status: CommentStatus
  like_count: number
  reply_count: number
  depth: number                        // 댓글 깊이 (0: 원댓글, 1: 대댓글)
  created_at: string
  updated_at: string
  deleted_at?: string
}

/**
 * 댓글 생성 요청
 */
export interface CreateCommentRequest {
  politician_id: number
  content: string
  parent_id?: number                  // 대댓글인 경우
}

/**
 * 댓글 업데이트 요청
 */
export interface UpdateCommentRequest {
  content?: string
  status?: CommentStatus
}

/**
 * 댓글과 작성자 프로필
 */
export interface CommentWithProfile extends Comment {
  profiles?: {
    username: string
    avatar_url?: string
  }
  replies?: CommentWithProfile[]      // 대댓글 목록
  is_liked?: boolean                  // 현재 사용자가 좋아요 했는지
}

/**
 * 댓글 필터
 */
export interface CommentFilters {
  politician_id?: number
  user_id?: string
  parent_id?: number | null           // null이면 원댓글만
  status?: CommentStatus
  sortBy?: 'created_at' | 'like_count' | 'reply_count'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

/**
 * 좋아요 타입 Enum
 */
export enum LikeType {
  RATING = 'rating',
  COMMENT = 'comment'
}

/**
 * 좋아요 인터페이스
 */
export interface Like {
  id: number
  user_id: string
  target_id: number                    // 대상 ID (평가 또는 댓글)
  target_type: LikeType
  created_at: string
}

/**
 * 좋아요 생성 요청
 */
export interface CreateLikeRequest {
  target_id: number
  target_type: LikeType
}

/**
 * 좋아요 삭제 요청
 */
export interface DeleteLikeRequest {
  target_id: number
  target_type: LikeType
}

/**
 * 좋아요 상태 확인 응답
 */
export interface LikeStatusResponse {
  is_liked: boolean
  like_count: number
}

/**
 * 좋아요 통계
 */
export interface LikeStatistics {
  target_id: number
  target_type: LikeType
  total_likes: number
  recent_likes: number                // 최근 24시간
  top_likers?: Array<{
    user_id: string
    username: string
    avatar_url?: string
  }>
}

/**
 * 알림 카운트 응답
 */
export interface NotificationCountResponse {
  total: number
  unread: number
  by_type: {
    [key in NotificationType]?: number
  }
}

/**
 * 대댓글 생성 요청
 */
export interface CreateReplyRequest {
  content: string
  politician_id: number               // 컨텍스트 유지를 위해 필요
}

/**
 * 일괄 읽음 처리 요청
 */
export interface MarkNotificationsReadRequest {
  notification_ids?: number[]          // 특정 알림들만 읽음 처리
  all?: boolean                        // 모든 알림 읽음 처리
}

/**
 * API 응답 타입 (재사용)
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 페이지네이션 응답 타입 (재사용)
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Type aliases for convenience
export type NotificationsResponse = PaginatedResponse<Notification>
export type NotificationResponse = ApiResponse<Notification>
export type CommentsResponse = PaginatedResponse<CommentWithProfile>
export type CommentResponse = ApiResponse<Comment>
export type LikeResponse = ApiResponse<Like>
export type NotificationCountApiResponse = ApiResponse<NotificationCountResponse>
export type LikeStatusApiResponse = ApiResponse<LikeStatusResponse>