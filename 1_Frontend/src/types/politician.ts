// Type definitions for Politician-related data structures

/**
 * Basic Politician Information
 */
export interface Politician {
  id: number
  name: string
  profile_image_url: string | null
  party: string
  position: string
  region: string
  is_verified: boolean
}

/**
 * Career Item for Politician Timeline
 */
export interface CareerItem {
  period: string
  title: string
  description?: string
}

/**
 * Pledge Status Types
 */
export type PledgeStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

/**
 * Politician Pledge/Promise
 */
export interface Pledge {
  id: number
  title: string
  description: string
  category: string
  status: PledgeStatus
  created_at?: string
  updated_at?: string
}

/**
 * Detailed Politician Profile (extends basic info)
 */
export interface PoliticianProfile extends Politician {
  bio: string | null
  birth_date: string | null
  education: string[]
  career: CareerItem[]
  pledges: Pledge[]
  ai_score: number | null
  followers_count: number
  ratings_count: number
  avg_rating: number
  website_url: string | null
  email?: string | null
  phone?: string | null
  social_media?: {
    twitter?: string
    facebook?: string
    instagram?: string
    youtube?: string
  }
}

/**
 * Politician Statistics
 */
export interface PoliticianStats {
  followers: number
  ratings: number
  avgScore: number
  aiScore: number | null
}

/**
 * Rating Distribution
 */
export interface RatingDistribution {
  1: number
  2: number
  3: number
  4: number
  5: number
}

/**
 * Politician Detail (includes rating stats)
 */
export interface PoliticianDetail extends PoliticianProfile {
  rating_distribution: RatingDistribution
  total_ratings: number
}

/**
 * Politician List Item (for list views)
 */
export interface PoliticianListItem {
  id: number
  name: string
  profile_image_url: string | null
  party: string
  position: string
  region: string
  is_verified: boolean
  avg_rating: number
  ratings_count: number
  ai_score: number | null
}

/**
 * Politician Filter Options
 */
export interface PoliticianFilters {
  party?: string[]
  region?: string[]
  position?: string[]
  minRating?: number
  maxRating?: number
  isVerified?: boolean
  sortBy?: 'name' | 'rating' | 'ai_score' | 'followers'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Paginated Politician Response
 */
export interface PaginatedPoliticians {
  data: PoliticianListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Follow Status
 */
export interface FollowStatus {
  isFollowing: boolean
  followerId?: number
  followedAt?: string
}

/**
 * Politician Search Result
 */
export interface PoliticianSearchResult {
  politician: PoliticianListItem
  matchScore: number
  matchedFields: string[]
}
