// P2D7: Auto-generated Database Types from Supabase
// Generated from Supabase schema migrations

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      politicians: {
        Row: {
          id: string;
          name: string;
          name_kana: string | null;
          name_english: string | null;
          birth_date: string | null;
          gender: string | null;
          political_party_id: number | null;
          position_id: number | null;
          constituency_id: number | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          twitter_handle: string | null;
          facebook_url: string | null;
          instagram_handle: string | null;
          profile_image_url: string | null;
          bio: string | null;
          verified_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_kana?: string | null;
          name_english?: string | null;
          birth_date?: string | null;
          gender?: string | null;
          political_party_id?: number | null;
          position_id?: number | null;
          constituency_id?: number | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          twitter_handle?: string | null;
          facebook_url?: string | null;
          instagram_handle?: string | null;
          profile_image_url?: string | null;
          bio?: string | null;
          verified_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_kana?: string | null;
          name_english?: string | null;
          birth_date?: string | null;
          gender?: string | null;
          political_party_id?: number | null;
          position_id?: number | null;
          constituency_id?: number | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          twitter_handle?: string | null;
          facebook_url?: string | null;
          instagram_handle?: string | null;
          profile_image_url?: string | null;
          bio?: string | null;
          verified_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      politician_details: {
        Row: {
          id: string;
          politician_id: string;
          education: string | null;
          career_history: string | null;
          achievements: string | null;
          controversies: string | null;
          donation_limit: string | null;
          campaign_headquarters: string | null;
          election_count: number;
          election_wins: number;
          election_votes_received: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          politician_id: string;
          education?: string | null;
          career_history?: string | null;
          achievements?: string | null;
          controversies?: string | null;
          donation_limit?: string | null;
          campaign_headquarters?: string | null;
          election_count?: number;
          election_wins?: number;
          election_votes_received?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          politician_id?: string;
          education?: string | null;
          career_history?: string | null;
          achievements?: string | null;
          controversies?: string | null;
          donation_limit?: string | null;
          campaign_headquarters?: string | null;
          election_count?: number;
          election_wins?: number;
          election_votes_received?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      favorite_politicians: {
        Row: {
          id: string;
          user_id: string;
          politician_id: string;
          notes: string | null;
          notification_enabled: boolean;
          is_pinned: boolean;
          added_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          politician_id: string;
          notes?: string | null;
          notification_enabled?: boolean;
          is_pinned?: boolean;
          added_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          politician_id?: string;
          notes?: string | null;
          notification_enabled?: boolean;
          is_pinned?: boolean;
          added_at?: string;
          updated_at?: string;
        };
      };
      ai_evaluations: {
        Row: {
          id: string;
          politician_id: string;
          evaluation_date: string;
          evaluator: string | null;
          overall_score: number | null;
          overall_grade: string | null;
          pledge_completion_rate: number | null;
          activity_score: number | null;
          controversy_score: number | null;
          public_sentiment_score: number | null;
          strengths: string[] | null;
          weaknesses: string[] | null;
          summary: string | null;
          detailed_analysis: Json | null;
          sources: string[] | null;
          ai_model_version: string | null;
          report_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          politician_id: string;
          evaluation_date: string;
          evaluator?: string | null;
          overall_score?: number | null;
          overall_grade?: string | null;
          pledge_completion_rate?: number | null;
          activity_score?: number | null;
          controversy_score?: number | null;
          public_sentiment_score?: number | null;
          strengths?: string[] | null;
          weaknesses?: string[] | null;
          summary?: string | null;
          detailed_analysis?: Json | null;
          sources?: string[] | null;
          ai_model_version?: string | null;
          report_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          politician_id?: string;
          evaluation_date?: string;
          evaluator?: string | null;
          overall_score?: number | null;
          overall_grade?: string | null;
          pledge_completion_rate?: number | null;
          activity_score?: number | null;
          controversy_score?: number | null;
          public_sentiment_score?: number | null;
          strengths?: string[] | null;
          weaknesses?: string[] | null;
          summary?: string | null;
          detailed_analysis?: Json | null;
          sources?: string[] | null;
          ai_model_version?: string | null;
          report_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          payment_method: string;
          pg_provider: string;
          status: string;
          purpose: string;
          description: string | null;
          metadata: Json | null;
          pg_transaction_id: string | null;
          paid_at: string | null;
          cancelled_at: string | null;
          cancel_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency?: string;
          payment_method: string;
          pg_provider: string;
          status?: string;
          purpose: string;
          description?: string | null;
          metadata?: Json | null;
          pg_transaction_id?: string | null;
          paid_at?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          payment_method?: string;
          pg_provider?: string;
          status?: string;
          purpose?: string;
          description?: string | null;
          metadata?: Json | null;
          pg_transaction_id?: string | null;
          paid_at?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      download_history: {
        Row: {
          id: string;
          user_id: string;
          evaluation_id: string;
          payment_id: string;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          evaluation_id: string;
          payment_id: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          evaluation_id?: string;
          payment_id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      // V24.0 AI 평가 테이블 (실제 DB 스키마 반영)
      ai_final_scores: {
        Row: {
          id: number;
          politician_id: string;
          ai_name: string;
          total_score: number;
          grade_code: string;        // M/D/E/P/G/S/B/I/Tn/L
          grade_name: string;        // 무궁화/다이아몬드/에메랄드/플래티넘/골드/실버/브론즈/철/주석/납
          grade_emoji: string | null;
          categories_completed: number;
          total_data_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          politician_id: string;
          ai_name: string;
          total_score: number;
          grade_code: string;
          grade_name: string;
          grade_emoji?: string | null;
          categories_completed?: number;
          total_data_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          politician_id?: string;
          ai_name?: string;
          total_score?: number;
          grade_code?: string;
          grade_name?: string;
          grade_emoji?: string | null;
          categories_completed?: number;
          total_data_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_category_scores: {
        Row: {
          id: string;
          politician_id: string;
          ai_name: string;
          category_id: number;
          category_name: string;
          score: number;
          data_count: number;
          calculation_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          politician_id: string;
          ai_name: string;
          category_id: number;
          category_name: string;
          score: number;
          data_count?: number;
          calculation_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          politician_id?: string;
          ai_name?: string;
          category_id?: number;
          category_name?: string;
          score?: number;
          data_count?: number;
          calculation_date?: string;
          created_at?: string;
        };
      };
      collected_data: {
        Row: {
          collected_data_id: string;
          politician_id: string;
          ai_name: string;
          category_name: string;
          item_num: number;
          data_title: string;
          data_content: string;
          data_source: string | null;
          source_url: string | null;
          collection_date: string;
          rating: string;  // A~H 알파벳
          rating_rationale: string | null;
          source_type: string | null;  // OFFICIAL | PUBLIC
        };
        Insert: {
          collected_data_id?: string;
          politician_id: string;
          ai_name: string;
          category_name: string;
          item_num: number;
          data_title: string;
          data_content: string;
          data_source?: string | null;
          source_url?: string | null;
          collection_date?: string;
          rating: string;
          rating_rationale?: string | null;
          source_type?: string | null;
        };
        Update: {
          collected_data_id?: string;
          politician_id?: string;
          ai_name?: string;
          category_name?: string;
          item_num?: number;
          data_title?: string;
          data_content?: string;
          data_source?: string | null;
          source_url?: string | null;
          collection_date?: string;
          rating?: string;
          rating_rationale?: string | null;
          source_type?: string | null;
        };
      };
    };
  };
}

// V24.0 등급 시스템 타입
export type V24Grade = 'M' | 'D' | 'E' | 'P' | 'G' | 'S' | 'B' | 'I' | 'Tn' | 'L';
export type V24GradeName = 'Mugunghwa' | 'Diamond' | 'Emerald' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Iron' | 'Tin' | 'Lead';
export type V24Rating = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

// V24.0 등급 정보 인터페이스
export interface V24GradeInfo {
  grade: V24Grade;
  gradeEmoji: string;
  gradeName: V24GradeName;
  minScore: number;
  maxScore: number;
}

// V24.0 등급 체계 상수
export const V24_GRADE_THRESHOLDS: V24GradeInfo[] = [
  { grade: 'M', gradeEmoji: '🌺', gradeName: 'Mugunghwa', minScore: 920, maxScore: 1000 },
  { grade: 'D', gradeEmoji: '💎', gradeName: 'Diamond', minScore: 840, maxScore: 919 },
  { grade: 'E', gradeEmoji: '💚', gradeName: 'Emerald', minScore: 760, maxScore: 839 },
  { grade: 'P', gradeEmoji: '🥇', gradeName: 'Platinum', minScore: 680, maxScore: 759 },
  { grade: 'G', gradeEmoji: '🥇', gradeName: 'Gold', minScore: 600, maxScore: 679 },
  { grade: 'S', gradeEmoji: '🥈', gradeName: 'Silver', minScore: 520, maxScore: 599 },
  { grade: 'B', gradeEmoji: '🥉', gradeName: 'Bronze', minScore: 440, maxScore: 519 },
  { grade: 'I', gradeEmoji: '⚫', gradeName: 'Iron', minScore: 360, maxScore: 439 },
  { grade: 'Tn', gradeEmoji: '⬜', gradeName: 'Tin', minScore: 280, maxScore: 359 },
  { grade: 'L', gradeEmoji: '⬛', gradeName: 'Lead', minScore: 200, maxScore: 279 },
];

// V24.0 Rating 값 매핑 (점수 계산용)
export const V24_RATING_VALUES: Record<V24Rating, number> = {
  'A': 8, 'B': 6, 'C': 4, 'D': 2, 'E': -2, 'F': -4, 'G': -6, 'H': -8
};
