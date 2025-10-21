/**
 * Post 관련 타입 정의
 */

export interface Post {
  id: number;
  politician_id: number | null;
  user_id: string;
  title: string;
  content: string;
  post_type: 'review' | 'analysis' | 'news' | 'opinion';
  status: 'draft' | 'published' | 'hidden' | 'deleted';
  category: 'general' | 'politics' | 'question' | 'review';

  // 카운트 정보
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  report_count: number;

  // 추가 필드
  is_pinned: boolean;
  is_hot: boolean;
  slug?: string | null;
  excerpt?: string | null;
  featured_image_url?: string | null;
  tags?: string[] | null;

  // 메타데이터
  ip_address?: string | null;
  user_agent?: string | null;
  last_edited_by?: string | null;
  published_at?: string | null;
  edited_at?: string | null;
  created_at: string;
  updated_at: string;

  // 관계 데이터 (조인된 경우)
  politician?: {
    id: number;
    name: string;
    party: string;
  } | null;
  author?: {
    id: string;
    username: string;
    avatar_url?: string | null;
  } | null;
}

export interface CreatePostDto {
  title: string;
  content: string;
  category: 'general' | 'politics' | 'question' | 'review';
  politician_id?: number | null;
  post_type?: 'review' | 'analysis' | 'news' | 'opinion';
  status?: 'draft' | 'published';
  excerpt?: string | null;
  featured_image_url?: string | null;
  tags?: string[] | null;
}

export interface UpdatePostDto extends Partial<CreatePostDto> {
  edited_at?: string;
}

export interface PostsResponse {
  data: Post[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PostFilters {
  category?: 'general' | 'politics' | 'question' | 'review';
  politician_id?: number;
  user_id?: string;
  status?: 'published' | 'draft';
  is_hot?: boolean;
  is_pinned?: boolean;
  search?: string;
}

export interface PostSortOptions {
  sort?: 'latest' | 'popular' | 'views' | 'likes';
  order?: 'asc' | 'desc';
}

export interface PostLikeResponse {
  liked: boolean;
  message: string;
  like_count?: number;
}