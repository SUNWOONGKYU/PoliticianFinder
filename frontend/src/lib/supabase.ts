import { createClient } from '@supabase/supabase-js'

// Mock data mode - use dummy credentials when not configured
const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: !isMockMode,
    persistSession: !isMockMode,
    detectSessionInUrl: !isMockMode,
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
