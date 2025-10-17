/**
 * Supabase Database Types
 *
 * These types are auto-generated from Supabase schema
 * Manually adjusted to match our database structure
 */

export interface Database {
  public: {
    Tables: {
      politicians: {
        Row: {
          id: number
          name: string
          name_en: string | null
          birth_year: number | null
          party: string
          position: string | null
          district: string | null
          profile_image_url: string | null
          bio: string | null
          education: string | null
          career: string | null
          website_url: string | null
          wikipedia_url: string | null
          assembly_url: string | null
          avg_rating: number
          total_ratings: number
          total_bookmarks: number
          category_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          name_en?: string | null
          birth_year?: number | null
          party: string
          position?: string | null
          district?: string | null
          profile_image_url?: string | null
          bio?: string | null
          education?: string | null
          career?: string | null
          website_url?: string | null
          wikipedia_url?: string | null
          assembly_url?: string | null
          avg_rating?: number
          total_ratings?: number
          total_bookmarks?: number
          category_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          name_en?: string | null
          birth_year?: number | null
          party?: string
          position?: string | null
          district?: string | null
          profile_image_url?: string | null
          bio?: string | null
          education?: string | null
          career?: string | null
          website_url?: string | null
          wikipedia_url?: string | null
          assembly_url?: string | null
          avg_rating?: number
          total_ratings?: number
          total_bookmarks?: number
          category_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      ratings: {
        Row: {
          id: number
          user_id: string
          politician_id: number
          score: number
          comment: string | null
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          politician_id: number
          score: number
          comment?: string | null
          category?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          politician_id?: number
          score?: number
          comment?: string | null
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}