// P4O2: Vercel Cron Job - Aggregate Trending Posts
// Calculates popular post rankings based on engagement metrics
// Runs hourly at the top of the hour (0 * * * *)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Trending score calculation formula:
 * score = (like_count * 3) + (comment_count * 5) + (view_count * 0.1) - (age_in_hours * 2)
 *
 * This formula prioritizes:
 * - Comments (5x weight) - highest engagement
 * - Likes (3x weight) - moderate engagement
 * - Views (0.1x weight) - passive engagement
 * - Recency penalty (-2 per hour) - ensures fresh content rises
 */
interface TrendingPost {
  id: string;
  title: string;
  user_id: string;
  politician_id: string | null;
  category: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  trend_score: number;
  age_in_hours: number;
}

/**
 * Calculate trending score for a post
 */
function calculateTrendingScore(post: {
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
}): { score: number; ageInHours: number } {
  const now = new Date();
  const createdAt = new Date(post.created_at);
  const ageInHours = Math.max(1, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));

  // Apply the trending score formula
  const score =
    post.like_count * 3 +
    post.comment_count * 5 +
    post.view_count * 0.1 -
    ageInHours * 2;

  return {
    score: Math.max(0, score), // Ensure non-negative score
    ageInHours: Math.round(ageInHours * 10) / 10, // Round to 1 decimal
  };
}

/**
 * POST /api/cron/aggregate-trending
 * Cron job to calculate and cache trending posts
 *
 * Security:
 * - Vercel cron jobs include CRON_SECRET header for authentication
 * - Falls back to checking Authorization header in development
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Verify cron authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-vercel-cron-secret');

    // In production, Vercel adds the CRON_SECRET header
    if (process.env.NODE_ENV === 'production') {
      if (cronSecret !== process.env.CRON_SECRET) {
        console.error('[CRON aggregate-trending] Unauthorized: Invalid CRON_SECRET');
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid cron secret',
            },
          },
          { status: 401 }
        );
      }
    } else {
      // In development, allow Bearer token for testing
      const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`;
      if (authHeader !== expectedAuth) {
        console.warn('[CRON aggregate-trending] Development mode: Authentication skipped or invalid');
      }
    }

    console.log('[CRON aggregate-trending] Starting trending posts aggregation');

    // 2. Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 3. Fetch posts from last 7 days that are approved
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: posts, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, user_id, politician_id, category, view_count, like_count, comment_count, created_at')
      .eq('moderation_status', 'approved')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[CRON aggregate-trending] Error fetching posts:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch posts',
            details: fetchError.message,
          },
        },
        { status: 500 }
      );
    }

    if (!posts || posts.length === 0) {
      console.log('[CRON aggregate-trending] No posts found in the last 7 days');
      return NextResponse.json(
        {
          success: true,
          data: {
            processed: 0,
            cached: 0,
            duration_ms: Date.now() - startTime,
          },
          message: 'No posts to process',
        },
        { status: 200 }
      );
    }

    // 4. Calculate trending scores for all posts
    const trendingPosts: TrendingPost[] = posts
      .map((post) => {
        const { score, ageInHours } = calculateTrendingScore({
          like_count: post.like_count || 0,
          comment_count: post.comment_count || 0,
          view_count: post.view_count || 0,
          created_at: post.created_at,
        });

        return {
          id: post.id,
          title: post.title,
          user_id: post.user_id,
          politician_id: post.politician_id,
          category: post.category,
          view_count: post.view_count || 0,
          like_count: post.like_count || 0,
          comment_count: post.comment_count || 0,
          created_at: post.created_at,
          trend_score: score,
          age_in_hours: ageInHours,
        };
      })
      .filter((post) => post.trend_score > 0) // Filter out posts with zero or negative scores
      .sort((a, b) => b.trend_score - a.trend_score)
      .slice(0, 100); // Keep top 100

    console.log(`[CRON aggregate-trending] Calculated ${trendingPosts.length} trending posts from ${posts.length} total posts`);

    // 5. Store results in a cache table (trending_posts_cache)
    // First, check if the cache table exists, if not we'll use a simple approach
    // Delete old cache entries first
    const { error: deleteError } = await supabase
      .from('trending_posts_cache')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (PostgreSQL UUID trick)

    if (deleteError && deleteError.code !== '42P01') {
      // 42P01 = table does not exist
      console.error('[CRON aggregate-trending] Error clearing cache:', deleteError);
      // Continue anyway - we'll try to insert
    }

    // 6. Insert new trending posts into cache
    if (trendingPosts.length > 0) {
      const cacheEntries = trendingPosts.map((post, index) => ({
        post_id: post.id,
        rank: index + 1,
        trend_score: post.trend_score,
        snapshot_data: {
          title: post.title,
          category: post.category,
          view_count: post.view_count,
          like_count: post.like_count,
          comment_count: post.comment_count,
          created_at: post.created_at,
          age_in_hours: post.age_in_hours,
        },
        calculated_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('trending_posts_cache')
        .insert(cacheEntries);

      if (insertError) {
        console.error('[CRON aggregate-trending] Error inserting cache entries:', insertError);

        // If table doesn't exist, log it but return success with warning
        if (insertError.code === '42P01') {
          console.warn('[CRON aggregate-trending] trending_posts_cache table does not exist. Skipping cache storage.');
          return NextResponse.json(
            {
              success: true,
              warning: 'Cache table does not exist',
              data: {
                processed: posts.length,
                cached: 0,
                top_10: trendingPosts.slice(0, 10).map(p => ({
                  id: p.id,
                  title: p.title,
                  score: p.trend_score,
                  rank: trendingPosts.indexOf(p) + 1,
                })),
                duration_ms: Date.now() - startTime,
              },
              message: 'Trending posts calculated but not cached (table missing)',
            },
            { status: 200 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CACHE_ERROR',
              message: 'Failed to cache trending posts',
              details: insertError.message,
            },
          },
          { status: 500 }
        );
      }
    }

    // 7. Return success response with statistics
    const duration = Date.now() - startTime;
    console.log(`[CRON aggregate-trending] Completed successfully in ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        data: {
          processed: posts.length,
          cached: trendingPosts.length,
          top_10: trendingPosts.slice(0, 10).map((p, i) => ({
            rank: i + 1,
            id: p.id,
            title: p.title,
            score: Math.round(p.trend_score * 100) / 100,
            likes: p.like_count,
            comments: p.comment_count,
            views: p.view_count,
            age_hours: p.age_in_hours,
          })),
          duration_ms: duration,
          calculated_at: new Date().toISOString(),
        },
        message: `Successfully aggregated ${trendingPosts.length} trending posts`,
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[CRON aggregate-trending] Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        duration_ms: duration,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/aggregate-trending
 * Manual trigger endpoint for development/testing
 * Not used by actual cron job (which uses POST)
 */
export async function GET(request: NextRequest) {
  // In production, reject GET requests to prevent accidental triggers
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'GET requests are not allowed in production. Use POST with proper authentication.',
        },
      },
      { status: 405 }
    );
  }

  // In development, allow GET for easy testing
  console.log('[CRON aggregate-trending] Manual trigger via GET (development mode)');
  return POST(request);
}
