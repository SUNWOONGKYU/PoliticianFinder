// Optimized Supabase Client with Query Optimization
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton pattern for Supabase client
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'x-application-name': 'politician-finder',
        },
      },
      db: {
        schema: 'public',
      },
    });
  }
  return supabaseInstance;
}

// Optimized query helpers
export const supabaseQueries = {
  // N+1 Query Prevention - Use joins
  async getPoliticiansWithRelations(limit = 10, offset = 0) {
    const supabase = getSupabaseClient();

    return supabase
      .from('politicians')
      .select(`
        *,
        party:party_id (
          id,
          name,
          color
        ),
        comments (
          id,
          content,
          created_at,
          user:user_id (
            id,
            email,
            avatar_url
          )
        ),
        bookmarks (
          id,
          user_id
        )
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
  },

  // Optimized single politician query
  async getPoliticianById(id: string) {
    const supabase = getSupabaseClient();

    return supabase
      .from('politicians')
      .select(`
        *,
        party:party_id (*),
        comments (
          id,
          content,
          created_at,
          user:user_id (
            id,
            email,
            avatar_url
          )
        ),
        bookmarks (count)
      `)
      .eq('id', id)
      .single();
  },

  // Batch operations for better performance
  async batchInsertBookmarks(bookmarks: Array<{ user_id: string; politician_id: string }>) {
    const supabase = getSupabaseClient();

    return supabase
      .from('bookmarks')
      .insert(bookmarks)
      .select();
  },

  // Optimized comment fetching with pagination
  async getCommentsPaginated(politicianId: string, page = 1, pageSize = 20) {
    const supabase = getSupabaseClient();
    const offset = (page - 1) * pageSize;

    return supabase
      .from('comments')
      .select(`
        *,
        user:user_id (
          id,
          email,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('politician_id', politicianId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);
  },

  // Optimized search with full-text search
  async searchPoliticians(query: string) {
    const supabase = getSupabaseClient();

    return supabase
      .from('politicians')
      .select('id, name, party:party_id(name), position, image_url')
      .textSearch('name', query, {
        config: 'english',
        type: 'websearch',
      })
      .limit(10);
  },
};

// Connection pooling configuration
export const connectionConfig = {
  maxConnections: 10,
  idleTimeout: 30000,
  connectionTimeout: 10000,
};