// P2D2 Requirements - Rating Types

export interface Rating {
  id: number
  user_id: string              // UUID (Supabase Auth)
  politician_id: number        // BIGINT
  score: number                // 1-5
  comment: string | null       // Optional, max 1000 chars
  category: string             // 'overall' | 'policy' | 'integrity' | 'communication'
  created_at: string
  updated_at: string
}

// API request types
export interface CreateRatingRequest {
  politician_id: number
  score: number
  comment?: string
  category?: string
}

export interface UpdateRatingRequest {
  score: number
  comment?: string
  category?: string
}

// API response types with profile info
export interface RatingWithProfile extends Rating {
  profiles: {
    username: string
    avatar_url: string | null
  }
}

// Response with politician info
export interface RatingWithPolitician extends Rating {
  politician: {
    id: number
    name: string
    party: string
    position: string
    profile_image_url: string | null
  }
}

// Paginated response
export interface PaginatedRatingsResponse {
  data: Rating[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

// Rating statistics
export interface RatingStatistics {
  politician_id: number
  total_ratings: number
  average_score: number
  score_distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  category_averages: {
    [category: string]: number
  }
  recent_ratings: Rating[]
}

// Error response
export interface RatingErrorResponse {
  error: string
  message: string
  detail?: any
}

// Validation helpers
export const VALID_CATEGORIES = ['overall', 'policy', 'integrity', 'communication'] as const
export type RatingCategory = typeof VALID_CATEGORIES[number]

export const MIN_SCORE = 1
export const MAX_SCORE = 5
export const MAX_COMMENT_LENGTH = 1000

export function validateScore(score: number): boolean {
  return Number.isInteger(score) && score >= MIN_SCORE && score <= MAX_SCORE
}

export function validateComment(comment?: string): boolean {
  return !comment || comment.length <= MAX_COMMENT_LENGTH
}

export function validateCategory(category?: string): boolean {
  return !category || VALID_CATEGORIES.includes(category as RatingCategory)
}

// Type guards
export function isRating(obj: any): obj is Rating {
  return obj &&
    typeof obj.id === 'number' &&
    typeof obj.user_id === 'string' &&
    typeof obj.politician_id === 'number' &&
    typeof obj.score === 'number' &&
    (obj.comment === null || typeof obj.comment === 'string') &&
    typeof obj.category === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
}

export function isCreateRatingRequest(obj: any): obj is CreateRatingRequest {
  return obj &&
    typeof obj.politician_id === 'number' &&
    validateScore(obj.score) &&
    validateComment(obj.comment) &&
    validateCategory(obj.category)
}