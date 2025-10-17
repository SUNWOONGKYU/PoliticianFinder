/**
 * Supabase Client Configuration
 *
 * This module provides the Supabase client instance for server-side operations
 * in Next.js API routes and server components.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase.types'

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a single Supabase client for server-side operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})

// Export types for convenience
export type { Database }