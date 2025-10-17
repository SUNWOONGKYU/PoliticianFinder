/**
 * Phase 3 Database Types
 * 생성일: 2025-01-17
 * 설명: Phase 3에서 생성된 테이블들의 TypeScript 타입 정의
 */

/**
 * P3D1: Notifications 테이블 타입
 */

// 알림 타입
export type NotificationType =
  | 'comment'        // 댓글 알림
  | 'reply'          // 답글 알림
  | 'mention'        // 멘션 알림
  | 'like'           // 좋아요 알림
  | 'follow'         // 팔로우 알림
  | 'rating'         // 평가 알림
  | 'post_update'    // 게시글 업데이트
  | 'system'         // 시스템 알림
  | 'achievement'    // 업적 달성
  | 'level_up'       // 레벨업
  | 'badge'          // 배지 획득
  | 'warning'        // 경고
  | 'announcement';  // 공지사항

// 엔티티 타입
export type EntityType =
  | 'post'
  | 'comment'
  | 'politician'
  | 'user'
  | 'rating'
  | 'badge'
  | 'achievement';

// 알림 우선순위
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// 알림 인터페이스
export interface Notification {
  id: number;
  recipient_id: string;           // UUID
  sender_id?: string | null;      // UUID
  type: NotificationType;
  title: string;
  message: string;
  entity_type?: EntityType | null;
  entity_id?: number | null;
  metadata?: Record<string, any>;
  action_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  priority: NotificationPriority;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

// 알림 생성 DTO
export interface CreateNotificationDto {
  recipient_id: string;
  type: NotificationType;
  title: string;
  message: string;
  sender_id?: string;
  entity_type?: EntityType;
  entity_id?: number;
  action_url?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  expires_at?: string;
}

// 알림 업데이트 DTO (읽음 처리)
export interface UpdateNotificationDto {
  is_read?: boolean;
}

// 알림 통계
export interface NotificationStats {
  recipient_id: string;
  unread_count: number;
  total_count: number;
  comment_count: number;
  like_count: number;
  mention_count: number;
  urgent_unread: number;
  last_notification_at: string;
}

/**
 * P3D2: Comments 테이블 타입 (개선된 버전)
 */

// 댓글 상태
export type CommentStatus = 'active' | 'edited' | 'deleted' | 'hidden' | 'reported';

// 댓글 인터페이스
export interface Comment {
  id: number;
  post_id: number;
  user_id: string;                // UUID
  content: string;
  parent_id?: number | null;
  depth: number;
  path: string;
  mentioned_users?: string[];     // UUID[]
  upvotes: number;
  downvotes: number;
  score: number;                   // upvotes - downvotes
  status: CommentStatus;
  is_edited: boolean;
  edited_at?: string | null;
  edit_count: number;
  edit_history?: EditHistory[];
  is_deleted: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;      // UUID
  deletion_reason?: string | null;
  report_count: number;
  is_hidden: boolean;
  hidden_at?: string | null;
  hidden_reason?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;

  // Relations
  author?: User;
  children?: Comment[];
  parent?: Comment;
}

// 수정 이력
export interface EditHistory {
  content: string;
  edited_at: string;
  editor_id: string;
}

// 댓글 생성 DTO
export interface CreateCommentDto {
  post_id: number;
  content: string;
  parent_id?: number;
  mentioned_users?: string[];
}

// 댓글 수정 DTO
export interface UpdateCommentDto {
  content?: string;
}

// 댓글 삭제 DTO
export interface DeleteCommentDto {
  deletion_reason?: string;
}

// 댓글 트리 구조
export interface CommentTree extends Comment {
  children_count: number;
  children: CommentTree[];
}

// 댓글 통계
export interface CommentStats {
  post_id: number;
  total_comments: number;
  unique_commenters: number;
  top_level_comments: number;
  replies: number;
  avg_score: number;
  last_comment_at: string;
}

/**
 * P3D3: Likes 테이블 타입
 */

// 좋아요 대상 타입
export type LikeTargetType = 'post' | 'comment' | 'politician' | 'rating';

// 좋아요 타입
export type LikeType = 'like' | 'love' | 'support' | 'agree' | 'helpful';

// 좋아요 인터페이스
export interface Like {
  id: number;
  user_id: string;                 // UUID
  target_type: LikeTargetType;
  target_id: number;
  like_type: LikeType;
  metadata?: Record<string, any>;
  created_at: string;

  // Relations
  user?: User;
}

// 좋아요 생성 DTO
export interface CreateLikeDto {
  target_type: LikeTargetType;
  target_id: number;
  like_type?: LikeType;
}

// 좋아요 토글 결과
export interface LikeToggleResult {
  success: boolean;
  is_liked: boolean;
  like_id?: number;
  message: string;
}

// 좋아요 상태
export interface LikeStatus {
  target_id: number;
  is_liked: boolean;
  like_type?: LikeType;
}

// 좋아요 카운트
export interface LikeCount {
  id: number;
  target_type: LikeTargetType;
  target_id: number;
  total_likes: number;
  like_count: number;
  love_count: number;
  support_count: number;
  agree_count: number;
  helpful_count: number;
  updated_at: string;
}

// 좋아요 통계
export interface LikeStats {
  total_likes: number;
  like_count: number;
  love_count: number;
  support_count: number;
  agree_count: number;
  helpful_count: number;
  top_likers: TopLiker[];
}

// 상위 좋아요 사용자
export interface TopLiker {
  user_id: string;
  like_type: LikeType;
  created_at: string;
  user?: User;
}

// 인기 게시글
export interface PopularPost {
  id: number;
  title: string;
  user_id: string;
  created_at: string;
  like_count: number;
  view_count: number;
  category: string;
  author?: User;
}

// 사용자 좋아요 활동
export interface UserLikeActivity {
  user_id: string;
  total_likes_given: number;
  post_likes: number;
  comment_likes: number;
  politician_likes: number;
  rating_likes: number;
  last_like_at: string;
}

/**
 * 공통 타입 (기존 시스템과의 호환성)
 */

// 사용자 인터페이스 (기본)
export interface User {
  id: string;                      // UUID
  username: string;
  full_name?: string;
  avatar_url?: string;
  is_admin: boolean;
  user_type: 'normal' | 'politician';
  user_level: number;
  points: number;
  created_at: string;
  updated_at: string;
}

/**
 * API 응답 타입
 */

// 페이지네이션 정보
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// 페이지네이션 응답
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// API 응답
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 벌크 작업 결과
export interface BulkOperationResult {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  errors?: string[];
}

/**
 * 헬퍼 타입
 */

// 정렬 옵션
export type SortOrder = 'asc' | 'desc';

// 필터 옵션
export interface FilterOptions {
  [key: string]: any;
}

// 쿼리 파라미터
export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: SortOrder;
  search?: string;
  filters?: FilterOptions;
}