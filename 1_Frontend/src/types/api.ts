// API Response 타입 정의

export interface ApiPolitician {
  id: string;
  name: string;
  identity?: string;
  title?: string;
  position?: string;
  party?: string;
  region?: string;
  district?: string;
  claudeScore?: number;
  chatgptScore?: number;
  grokScore?: number;
  totalScore?: number;
  grade?: string;
  gradeEmoji?: string;
  userRating?: number;
  ratingCount?: number;
  profileImageUrl?: string | null;
  updatedAt?: string;
}

export interface ApiPost {
  id: number;
  title: string;
  content: string;
  user_id: string;
  politician_id?: number | null;
  politicians?: {
    name: string;
    status: string;
    position: string;
  };
  upvotes: number;
  downvotes: number;
  view_count: number;
  comment_count: number;
  created_at: string;
  is_hot?: boolean;
  is_best?: boolean;
  tags?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface ApiPoliticianSearchResult {
  name: string;
  political_party_name: string;
  position_name: string;
  region?: string;
  district?: string;
}

export interface ApiRating {
  id: string;
  politician_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface ApiFavorite {
  id: string;
  politician_id: string;
  user_id: string;
  notification_enabled: boolean;
  created_at: string;
}
