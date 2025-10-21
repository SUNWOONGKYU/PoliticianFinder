// 평가 관련 타입 정의
import { RatingCategory } from './database'

// 평가 아이템 인터페이스
export interface RatingItem {
  id: number
  user_id: string
  politician_id: number
  score: number
  comment: string | null
  category: RatingCategory | string
  created_at: string
  updated_at: string
  user?: {
    username: string
    avatar_url: string | null
  }
}

// 평가 통계 인터페이스
export interface RatingStats {
  averageScore: number
  totalRatings: number
  distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  categoryBreakdown?: {
    [key: string]: {
      count: number
      average: number
    }
  }
}

// 평가 목록 응답
export interface RatingListResponse {
  ratings: RatingItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 평가 생성 요청
export interface CreateRatingRequest {
  politician_id: number
  score: number
  comment?: string
  category?: RatingCategory | string
}

// 평가 업데이트 요청
export interface UpdateRatingRequest {
  score: number
  comment?: string
  category?: RatingCategory | string
}

// 평가 정렬 옵션
export type RatingSortOption = 'recent' | 'rating_high' | 'rating_low'

// 평가 필터 옵션
export interface RatingFilterOptions {
  category?: RatingCategory | string
  minScore?: number
  maxScore?: number
  hasComment?: boolean
  sortBy?: RatingSortOption
  page?: number
  limit?: number
}