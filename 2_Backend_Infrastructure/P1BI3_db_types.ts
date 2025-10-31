/**
 * Project Grid Task ID: P1BI3
 * 작업명: 데이터베이스 타입 정의
 * 생성시간: 2025-10-31 14:30
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P1D1-P1D5
 * 설명: TypeScript 타입 정의
 */

export type Profile = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'moderator';
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type Politician = {
  id: string;
  name: string;
  party?: string;
  position?: string;
  district?: string;
  profile_image_url?: string;
  birth_date?: string;
  career?: string[];
  education?: string[];
  created_at: string;
  updated_at: string;
};

export type EvaluationCategory = {
  id: string;
  name: string;
  description?: string;
  weight: number;
  created_at: string;
};

export type Evaluation = {
  id: string;
  politician_id: string;
  category_id: string;
  score: number;
  grade?: string;
  evaluated_by?: string;
  evaluated_at: string;
  comments?: string;
  created_at: string;
};

export type Bookmark = {
  id: string;
  user_id: string;
  politician_id: string;
  created_at: string;
};
