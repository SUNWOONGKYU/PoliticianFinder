// PoliticianFinder Type Definitions

// 정치인 상태
export type PoliticianStatus = '현직' | '후보자' | '예비후보자' | '출마자';

// 정치인
export interface Politician {
  id: number;
  name: string;
  party: string;
  region: string;
  position: string;
  profile_image_url?: string;
  biography?: string;
  avg_rating: number;
  avatar_enabled: boolean;
  status: PoliticianStatus;
  created_at: string;
  updated_at: string;
}

// AI 평가 점수
export interface AIScore {
  id: number;
  politician_id: number;
  ai_name: 'claude' | 'gpt' | 'gemini' | 'perplexity' | 'grok';
  score: number;
  details?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 레벨 정보
export interface LevelInfo {
  level: number;
  name: string;
  shortName: string;
  bgColor: string;
  textColor: string;
  xpRequired: number;
}

// 사용자 프로필
export interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  is_admin: boolean;
  user_type: 'normal' | 'politician';
  user_level: number;
  points: number;
  created_at: string;
  updated_at: string;
  // 통계 필드 (계산된 값)
  ratings_count?: number;
  posts_count?: number;
  upvotes_received?: number;
}

// 게시글 카테고리
export type PostCategory = 'general' | 'politician_post' | 'region' | 'issue' | 'policy';

// 게시글
export interface Post {
  id: number;
  user_id: string;
  politician_id?: number;
  category: PostCategory;
  title: string;
  content: string;
  view_count: number;
  upvotes: number;
  downvotes: number;
  is_best: boolean;
  is_concept: boolean;
  created_at: string;
  updated_at: string;
  // 관계 데이터
  author?: UserProfile;
  politician?: Politician;
  comment_count?: number;
}

// 댓글
export interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  parent_id?: number;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  // 관계 데이터
  author?: UserProfile;
  replies?: Comment[];
}

// 평점
export interface Rating {
  id: number;
  politician_id: number;
  user_id: string;
  score: number; // 1-5
  created_at: string;
}

// 투표
export type VoteType = 'up' | 'down';
export type VoteTargetType = 'post' | 'comment';

export interface Vote {
  id: number;
  target_type: VoteTargetType;
  target_id: number;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
}

// 북마크
export interface Bookmark {
  id: number;
  user_id: string;
  post_id: number;
  created_at: string;
}

// 알림
export type NotificationType = 'comment' | 'reply' | 'mention' | 'system';

export interface Notification {
  id: number;
  user_id: string;
  type: NotificationType;
  content: string;
  target_url?: string;
  is_read: boolean;
  created_at: string;
}

// 신고
export type ReportTargetType = 'post' | 'comment' | 'user';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report {
  id: number;
  reporter_id?: string;
  target_type: ReportTargetType;
  target_id: number;
  reason: string;
  status: ReportStatus;
  admin_note?: string;
  created_at: string;
  resolved_at?: string;
}

// 핫이슈 게시글
export interface HotPost {
  id: number;
  title: string;
  view_count: number;
  comment_count: number;
  created_at: string;
}

// 공지사항
export interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
  is_new: boolean;
  is_event: boolean;
}

// 트렌딩 토픽
export interface TrendingTopic {
  tag: string;
  count: number;
}

// API 응답 타입
export interface APIResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
