/**
 * Database Types for PoliticianFinder
 * Generated from P2D1 migration
 *
 * This file contains TypeScript type definitions that match the database schema
 */

/**
 * 정치 정당 Enum
 */
export enum PoliticalParty {
  DEMOCRATIC = "더불어민주당",
  PEOPLE_POWER = "국민의힘",
  JUSTICE = "정의당",
  REFORM = "개혁신당",
  INDEPENDENT = "무소속",
  OTHER = "기타"
}

/**
 * 정치인 정보 인터페이스
 * Phase 2에서 평가 통계 필드가 추가됨
 */
export interface Politician {
  // Primary Key
  id: number

  // Basic Info
  name: string
  name_en?: string
  birth_year?: number
  party: PoliticalParty

  // Position
  position?: string  // 예: 국회의원, 시장, 도지사
  district?: string  // 예: 서울 강남구 갑 (region 대신 district 사용)

  // Profile
  profile_image_url?: string
  bio?: string
  education?: string
  career?: string

  // External Links
  website_url?: string
  wikipedia_url?: string
  assembly_url?: string

  // Stats - Phase 2에서 추가된 필드
  avg_rating: number           // 평균 평점 (0.0 - 5.0, DECIMAL(2,1))
  total_ratings: number        // 평가 개수
  total_bookmarks: number      // 북마크 개수

  // Category
  category_id?: number

  // Timestamps
  created_at: string
  updated_at: string
}

/**
 * 정치인 생성 요청 타입
 */
export interface CreatePoliticianRequest {
  name: string
  name_en?: string
  birth_year?: number
  party: PoliticalParty
  position?: string
  district?: string
  profile_image_url?: string
  bio?: string
  education?: string
  career?: string
  website_url?: string
  wikipedia_url?: string
  assembly_url?: string
  category_id?: number
}

/**
 * 정치인 업데이트 요청 타입
 */
export type UpdatePoliticianRequest = Partial<CreatePoliticianRequest>

/**
 * 정치인 목록 필터 타입
 */
export interface PoliticianFilters {
  party?: PoliticalParty
  district?: string
  minRating?: number
  maxRating?: number
  search?: string
  sortBy?: 'name' | 'avg_rating' | 'total_ratings' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

/**
 * 페이지네이션 응답 타입
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

/**
 * API 응답 타입
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 정치인 통계 업데이트 타입 (내부용)
 */
export interface PoliticianStatsUpdate {
  politicianId: number
  avg_rating: number
  total_ratings: number
}

/**
 * 평가 카테고리 Enum
 */
export enum RatingCategory {
  OVERALL = 'overall',
  POLICY = 'policy',
  INTEGRITY = 'integrity',
  COMMUNICATION = 'communication'
}

/**
 * 시민 평가 인터페이스
 */
export interface Rating {
  id: number
  user_id: string              // UUID (Supabase Auth)
  politician_id: number
  score: number                // 1-5
  comment: string | null
  category: RatingCategory | string  // 기본값: 'overall'
  created_at: string
  updated_at: string
}

/**
 * 평가 생성 요청 타입
 */
export interface CreateRatingRequest {
  politician_id: number
  score: number                // 1-5
  comment?: string            // 최대 1000자
  category?: RatingCategory | string
}

/**
 * 평가 업데이트 요청 타입
 */
export interface UpdateRatingRequest {
  score: number
  comment?: string
  category?: RatingCategory | string
}

/**
 * 평가와 사용자 프로필 정보
 */
export interface RatingWithProfile extends Rating {
  profiles?: {
    username: string
    avatar_url: string | null
  }
}

/**
 * 평가와 정치인 정보
 */
export interface RatingWithPolitician extends Rating {
  politician?: Politician
}

/**
 * 평가 목록 필터 타입
 */
export interface RatingFilters {
  politician_id?: number
  user_id?: string
  category?: RatingCategory | string
  minScore?: number
  maxScore?: number
  hasComment?: boolean
  sortBy?: 'created_at' | 'updated_at' | 'score'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

/**
 * 평가 통계 타입
 */
export interface RatingStatistics {
  politician_id: number
  total_count: number
  average_score: number
  score_distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  category_breakdown?: {
    [key in RatingCategory]?: {
      count: number
      average: number
    }
  }
}

/**
 * 사용자별 평가 요약
 */
export interface UserRatingSummary {
  user_id: string
  total_ratings: number
  average_score_given: number
  politicians_rated: number[]
  last_rating_date: string
}

// Export type aliases for convenience
export type PoliticiansResponse = PaginatedResponse<Politician>
export type PoliticianResponse = ApiResponse<Politician>
export type RatingsResponse = PaginatedResponse<Rating>
export type RatingResponse = ApiResponse<Rating>
export type RatingWithProfilesResponse = PaginatedResponse<RatingWithProfile>
export type RatingStatisticsResponse = ApiResponse<RatingStatistics>