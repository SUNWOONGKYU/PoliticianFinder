// 정치인 목록 아이템 인터페이스
export interface PoliticianListItem {
  id: number
  name: string
  party: string
  region: string
  position: string
  profile_image_url: string | null
  avg_rating: number
  total_ratings: number
  ai_score_claude?: number
}

// 정치인 상세 정보 인터페이스
export interface PoliticianDetail {
  id: number
  name: string
  party: string
  region: string
  position: string
  profile_image_url: string
  biography: string
  official_website: string
  avg_rating: number
  total_ratings: number
  ai_scores: AIScores
  rating_distribution: RatingDistribution
  total_posts: number
  created_at: string
  updated_at: string
}

// AI 점수 인터페이스
export interface AIScores {
  claude?: number
  gpt?: number
  gemini?: number
  perplexity?: number
  grok?: number
}

// 평점 분포 인터페이스
export interface RatingDistribution {
  5: number
  4: number
  3: number
  2: number
  1: number
}

// AI 점수 상세 인터페이스
export interface AIScoreDetail {
  ai_name: string
  score: number
  details: any
  updated_at: string
}

// 검색 필터 인터페이스
export interface PoliticianSearchFilter {
  name?: string
  party?: string
  region?: string
  position?: string
  minRating?: number
  sortBy?: 'name' | 'rating' | 'ai_score' | 'recent'
  sortOrder?: 'asc' | 'desc'
}

// 페이지네이션 인터페이스
export interface PaginationInfo {
  total: number
  page: number
  perPage: number
  totalPages: number
}

// API 응답 인터페이스
export interface PoliticianListResponse {
  politicians: PoliticianListItem[]
  pagination: PaginationInfo
}

// 에러 응답 인터페이스
export interface ApiErrorResponse {
  error: string
  message?: string
}