import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

// Types for database schema
export interface Politician {
  id: string
  name: string
  party: string
  region: string
  position: string
  profile_image?: string
  birth_date?: string
  education?: string
  career?: string
  contact?: string
  website?: string
  created_at?: string
  updated_at?: string
}

export interface PoliticianResponse {
  data: Politician[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AutocompleteSuggestion {
  id: string
  name: string
  label: string
}