/**
 * Project Grid Task ID: P1D4
 * 작업명: Supabase 데이터베이스 타입 생성
 * 생성시간: 2025-11-03 14:50
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P1D1, P1D2, P1D3
 * 설명: Supabase 데이터베이스 스키마로부터 자동 생성된 TypeScript 타입 정의
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          role: "user" | "admin" | "moderator" | null
          is_email_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          role?: "user" | "admin" | "moderator" | null
          is_email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          role?: "user" | "admin" | "moderator" | null
          is_email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      politicians: {
        Row: {
          id: string
          name: string
          party: string | null
          position: string | null
          district: string | null
          profile_image_url: string | null
          birth_date: string | null
          career: string[] | null
          education: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          party?: string | null
          position?: string | null
          district?: string | null
          profile_image_url?: string | null
          birth_date?: string | null
          career?: string[] | null
          education?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          party?: string | null
          position?: string | null
          district?: string | null
          profile_image_url?: string | null
          birth_date?: string | null
          career?: string[] | null
          education?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          id: string
          politician_id: string
          category_id: string
          score: number
          grade: string | null
          evaluated_by: string | null
          evaluated_at: string
          comments: string | null
          created_at: string
        }
        Insert: {
          id?: string
          politician_id: string
          category_id: string
          score: number
          grade?: string | null
          evaluated_by?: string | null
          evaluated_at?: string
          comments?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          politician_id?: string
          category_id?: string
          score?: number
          grade?: string | null
          evaluated_by?: string | null
          evaluated_at?: string
          comments?: string | null
          created_at?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          politician_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          politician_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          politician_id?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
