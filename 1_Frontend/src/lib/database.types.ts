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
    };
  };
}
