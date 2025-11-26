/**
 * P3F4: Politician Type Definitions
 *
 * Complete type definitions for politician data with all fields
 * including official information from Election Commission
 */

/**
 * V24.0 Category Score for AI Evaluation
 */
export interface CategoryScore {
  categoryId: number;
  categoryName: string;
  score: number;
  dataCount: number;
  calculationDate: string;
}

/**
 * Full Politician interface with all fields
 */
export interface Politician {
  // Basic info
  id: string | number;
  name: string;
  nameKanji?: string;
  nameEn?: string;

  // P3F3: identity and title (separated from status)
  identity: string;       // 신분 (현직, 후보자 등)
  title?: string;        // 직책 (국회의원 (21대) 등)

  // Position and party
  position: string;
  party: string;
  region: string;
  district?: string;

  // Personal info
  birthDate: string;
  age: number;
  gender: string;

  // AI evaluation (V24.0)
  claudeScore: number;
  totalScore: number;
  grade: string;       // M/D/E/P/G/S/B/I/Tn/L (10단계 금속)
  gradeEmoji: string;
  gradeName?: string;  // Mugunghwa/Diamond/Emerald/Platinum/Gold/Silver/Bronze/Iron/Tin/Lead
  categoryScores?: CategoryScore[];
  lastUpdated: string;

  // Community activity (computed fields)
  postCount: number;
  likeCount: number;
  taggedCount: number;

  // Election Commission official info
  education?: string[];
  career?: string[];
  electionHistory?: string[];
  militaryService?: string;
  assets?: {
    total?: string;
    real_estate?: string;
    financial?: string;
  };
  taxArrears?: string;
  criminalRecord?: string;
  militaryServiceIssue?: string;
  residencyFraud?: string;
  pledges?: string[];
  legislativeActivity?: {
    attendance_rate?: string;
    bills_proposed?: number;
    bills_representative?: number;
    bills_co_proposed?: number;
    bills_passed?: number;
  };

  // Other fields
  profileImageUrl: string | null;
  websiteUrl: string | null;
  bio: string;
  phone: string;
  email: string;

  // SNS
  twitterHandle: string;
  facebookUrl: string;
  instagramHandle: string;

  // Metadata
  verifiedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // User ratings
  userRating: number;
  ratingCount: number;
}

/**
 * Lightweight politician list item for list views
 */
export interface PoliticianListItem {
  id: string | number;
  name: string;
  identity: string;
  title?: string;
  position: string;
  party: string;
  region: string;

  // AI scores
  claudeScore: number;
  totalScore: number;
  grade: string;
  gradeEmoji: string;

  // User ratings
  userRating: number;
  ratingCount: number;

  // Metadata
  profileImageUrl: string | null;
  updatedAt: string;
}

/**
 * Database record with snake_case fields
 */
export interface PoliticianDbRecord {
  id: string | number;
  name: string;
  name_kanji?: string;
  name_en?: string;
  name_english?: string;

  // P3F3: identity and title
  identity?: string;
  title?: string;

  // Position and party
  position?: string;
  party?: string;
  region?: string;
  district?: string;

  // Personal info
  birth_date?: string;
  gender?: string;

  // AI evaluation (DB field names)
  ai_score?: number;
  evaluation_score?: number;
  evaluation_grade?: string;
  updated_at?: string;

  // Election Commission official info
  education?: string[];
  career?: string[];
  election_history?: string[];
  military_service?: string;
  assets?: {
    total?: string;
    real_estate?: string;
    financial?: string;
  };
  tax_arrears?: string;
  criminal_record?: string;
  military_service_issue?: string;
  residency_fraud?: string;
  pledges?: string[];
  legislative_activity?: {
    attendance_rate?: string;
    bills_proposed?: number;
    bills_representative?: number;
    bills_co_proposed?: number;
    bills_passed?: number;
  };

  // Other fields
  profile_image_url?: string | null;
  website?: string | null;
  bio?: string;
  phone?: string;
  email?: string;

  // SNS
  twitter_handle?: string;
  facebook_url?: string;
  instagram_handle?: string;

  // Metadata
  verified_at?: string | null;
  is_active?: boolean;
  created_at?: string;

  // User ratings
  user_rating?: number;
  rating_count?: number;
}

/**
 * Career Item for Politician Timeline
 */
export interface CareerItem {
  period: string;
  title: string;
  description?: string;
}

/**
 * Pledge Status Types
 */
export type PledgeStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Politician Pledge/Promise
 */
export interface Pledge {
  id: number;
  title: string;
  description: string;
  category: string;
  status: PledgeStatus;
  created_at?: string;
  updated_at?: string;
}

/**
 * Politician Filter Options
 */
export interface PoliticianFilters {
  party?: string[];
  region?: string[];
  position?: string[];
  minRating?: number;
  maxRating?: number;
  isVerified?: boolean;
  sortBy?: 'name' | 'rating' | 'ai_score' | 'followers';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated Politician Response
 */
export interface PaginatedPoliticians {
  data: PoliticianListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
