// Task: P4O1 - 크롤링 스케줄러
// Vercel Cron Job for automated politician data updates

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Vercel Cron Job Configuration
 * This endpoint is called automatically by Vercel Cron
 * Schedule: Daily at 6:00 AM (0 6 * * *)
 *
 * Setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/update-politicians",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 */

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET || 'development-secret';

/**
 * Types for crawled politician data
 */
interface CrawledPolitician {
  name: string;
  party: string;
  district?: string;
  phone?: string;
  email?: string;
  office?: string;
  career?: string[];
  sourceUrl?: string;
  crawledAt?: Date;
}

/**
 * Update statistics
 */
interface UpdateStats {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  crawlSuccessful: boolean;
  itemsFound: number;
  itemsInserted: number;
  itemsUpdated: number;
  itemsFailed: number;
  errors: string[];
}

/**
 * Initialize Supabase client with service role key
 */
function createSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Execute NEC crawler (imported from lib/crawlers)
 * This function would call the actual crawler implementation
 */
async function executeCrawler(): Promise<CrawledPolitician[]> {
  try {
    // Import crawler dynamically to avoid build issues
    const { crawlNEC } = await import('@/lib/crawlers');

    const result = await crawlNEC({
      timeout: 90000, // 90 seconds for cron job
      maxRetries: 3,
      headless: true,
      waitTime: 3000,
    });

    if (!result.success) {
      throw new Error(`Crawler failed: ${result.error?.message || 'Unknown error'}`);
    }

    // Transform crawl data to our format
    const politicians = result.data.map((item) => ({
      name: item.name,
      party: item.party,
      district: item.district,
      phone: item.contact?.phone,
      email: item.contact?.email,
      office: item.contact?.office,
      career: item.career,
      sourceUrl: item.sourceUrl,
      crawledAt: new Date(item.crawledAt),
    }));

    return politicians;
  } catch (error) {
    console.error('Crawler execution failed:', error);
    throw error;
  }
}

/**
 * Upsert politician data to Supabase
 * Uses INSERT ... ON CONFLICT DO UPDATE pattern
 */
async function upsertPoliticians(
  politicians: CrawledPolitician[],
  supabase: ReturnType<typeof createSupabaseClient>
): Promise<{ inserted: number; updated: number; failed: number }> {
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const politician of politicians) {
    try {
      // First, check if politician exists by name and party
      const { data: existing, error: searchError } = await supabase
        .from('politicians')
        .select('id, name, phone, email')
        .eq('name', politician.name)
        .eq('political_party_id', politician.party) // Assuming party is stored as ID
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('Search error:', searchError);
        failed++;
        continue;
      }

      const now = new Date().toISOString();

      if (existing) {
        // Update existing politician
        const { error: updateError } = await supabase
          .from('politicians')
          .update({
            phone: politician.phone || existing.phone,
            email: politician.email || existing.email,
            updated_at: now,
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Update error:', updateError);
          failed++;
        } else {
          updated++;

          // Update politician_details if career data exists
          if (politician.career && politician.career.length > 0) {
            await supabase
              .from('politician_details')
              .upsert({
                politician_id: existing.id,
                career_history: politician.career.join('\n'),
                updated_at: now,
              });
          }
        }
      } else {
        // Insert new politician
        const { data: newPolitician, error: insertError } = await supabase
          .from('politicians')
          .insert({
            name: politician.name,
            // political_party_id: Needs mapping from party name to ID
            // constituency_id: Needs mapping from district to ID
            phone: politician.phone,
            email: politician.email,
            is_active: true,
            created_at: now,
            updated_at: now,
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          failed++;
        } else {
          inserted++;

          // Insert politician_details if career data exists
          if (newPolitician && politician.career && politician.career.length > 0) {
            await supabase.from('politician_details').insert({
              politician_id: newPolitician.id,
              career_history: politician.career.join('\n'),
              created_at: now,
              updated_at: now,
            });
          }
        }
      }
    } catch (error) {
      console.error('Upsert failed for politician:', politician.name, error);
      failed++;
    }
  }

  return { inserted, updated, failed };
}

/**
 * Log cron job execution to database or external service
 */
async function logExecution(
  stats: UpdateStats,
  supabase: ReturnType<typeof createSupabaseClient>
): Promise<void> {
  try {
    // Store execution log in a dedicated table (if exists)
    // This is optional but recommended for monitoring
    await supabase.from('cron_execution_logs').insert({
      job_name: 'update-politicians',
      started_at: stats.startTime.toISOString(),
      completed_at: stats.endTime?.toISOString(),
      duration_ms: stats.duration,
      status: stats.crawlSuccessful ? 'success' : 'failed',
      items_found: stats.itemsFound,
      items_inserted: stats.itemsInserted,
      items_updated: stats.itemsUpdated,
      items_failed: stats.itemsFailed,
      errors: stats.errors.length > 0 ? stats.errors.join('; ') : null,
    });
  } catch (error) {
    // If logging fails, just log to console (don't fail the whole job)
    console.error('Failed to log execution:', error);
  }
}

/**
 * GET handler - Returns cron job information
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: 'Politician Data Update Cron',
    description: '정치인 데이터 자동 업데이트 크론 잡',
    schedule: '0 6 * * * (매일 오전 6시)',
    endpoints: {
      GET: {
        description: 'Get cron job information',
        auth: 'Not required',
      },
      POST: {
        description: 'Manually trigger cron job',
        auth: 'Required (CRON_SECRET header)',
        headers: {
          'x-cron-secret': 'CRON_SECRET environment variable',
        },
      },
    },
    status: 'active',
    version: '1.0.0',
  });
}

/**
 * POST handler - Execute cron job
 * Called automatically by Vercel Cron or manually for testing
 */
export async function POST(request: NextRequest) {
  const stats: UpdateStats = {
    startTime: new Date(),
    crawlSuccessful: false,
    itemsFound: 0,
    itemsInserted: 0,
    itemsUpdated: 0,
    itemsFailed: 0,
    errors: [],
  };

  try {
    // Verify cron secret for manual triggers
    const cronSecret = request.headers.get('x-cron-secret');
    const isVercel = request.headers.get('user-agent')?.includes('vercel-cron');

    if (!isVercel && cronSecret !== CRON_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Invalid or missing cron secret',
        },
        { status: 401 }
      );
    }

    console.log(`[CRON] Politician update job started at ${stats.startTime.toISOString()}`);

    // Step 1: Execute crawler
    console.log('[CRON] Step 1: Executing NEC crawler...');
    let politicians: CrawledPolitician[] = [];

    try {
      politicians = await executeCrawler();
      stats.crawlSuccessful = true;
      stats.itemsFound = politicians.length;
      console.log(`[CRON] Crawler completed. Found ${politicians.length} politicians`);
    } catch (crawlError: any) {
      const errorMsg = `Crawler failed: ${crawlError.message}`;
      stats.errors.push(errorMsg);
      console.error(`[CRON] ${errorMsg}`);

      // Continue with empty array to log the failure
      stats.crawlSuccessful = false;
    }

    // Step 2: Upsert data to Supabase
    if (politicians.length > 0) {
      console.log('[CRON] Step 2: Upserting data to Supabase...');
      const supabase = createSupabaseClient();

      try {
        const result = await upsertPoliticians(politicians, supabase);
        stats.itemsInserted = result.inserted;
        stats.itemsUpdated = result.updated;
        stats.itemsFailed = result.failed;

        console.log(`[CRON] Upsert completed:`, {
          inserted: result.inserted,
          updated: result.updated,
          failed: result.failed,
        });
      } catch (upsertError: any) {
        const errorMsg = `Upsert failed: ${upsertError.message}`;
        stats.errors.push(errorMsg);
        console.error(`[CRON] ${errorMsg}`);
      }

      // Step 3: Log execution
      console.log('[CRON] Step 3: Logging execution...');
      try {
        await logExecution(stats, supabase);
      } catch (logError: any) {
        console.error('[CRON] Logging failed:', logError.message);
      }
    }

    // Calculate final stats
    stats.endTime = new Date();
    stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

    console.log(`[CRON] Job completed in ${stats.duration}ms`);

    // Return response
    return NextResponse.json({
      success: stats.crawlSuccessful && stats.itemsFailed < stats.itemsFound,
      message: `Cron job completed. Found: ${stats.itemsFound}, Inserted: ${stats.itemsInserted}, Updated: ${stats.itemsUpdated}, Failed: ${stats.itemsFailed}`,
      stats: {
        startTime: stats.startTime.toISOString(),
        endTime: stats.endTime.toISOString(),
        duration: `${stats.duration}ms`,
        crawlSuccessful: stats.crawlSuccessful,
        itemsFound: stats.itemsFound,
        itemsInserted: stats.itemsInserted,
        itemsUpdated: stats.itemsUpdated,
        itemsFailed: stats.itemsFailed,
        errors: stats.errors,
      },
    });
  } catch (error: any) {
    console.error('[CRON] Unexpected error:', error);

    stats.endTime = new Date();
    stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
    stats.errors.push(`Unexpected error: ${error.message}`);

    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed with unexpected error',
        details: error.message,
        stats: {
          startTime: stats.startTime.toISOString(),
          endTime: stats.endTime.toISOString(),
          duration: `${stats.duration}ms`,
          errors: stats.errors,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Runtime configuration for Vercel
 * maxDuration: Maximum execution time (seconds)
 * - Hobby plan: 10s
 * - Pro plan: 60s
 * - Enterprise: 900s
 */
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for Pro plan
