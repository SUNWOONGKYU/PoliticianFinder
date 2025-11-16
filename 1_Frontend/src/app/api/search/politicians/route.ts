// P2BA3: 정치인 검색 API (Real DB)
// 정치인 검색 기능 제공
// Updated: 2025-11-17 - Mock 데이터 제거, 실제 DB 쿼리 사용

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const searchQuerySchema = z.object({
  q: z.string().min(1),
  type: z.enum(['name', 'bio', 'all']).optional().default('all'),
  limit: z.string().optional().default('10').transform(Number),
});

type SearchQuery = z.infer<typeof searchQuerySchema>;

/**
 * GET /api/search/politicians?q=검색어&type=name&limit=10
 * 정치인 검색 (Real Supabase DB)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchQuerySchema.parse({
      q: searchParams.get('q'),
      type: searchParams.get('type'),
      limit: searchParams.get('limit'),
    });

    const supabase = createClient();
    const searchTerm = `%${query.q}%`;

    // Build query based on search type
    let queryBuilder = supabase
      .from('politicians')
      .select('id, name, party, region, district, position, identity, title, profile_image_url')
      .limit(query.limit);

    if (query.type === 'name') {
      // Search by name only
      queryBuilder = queryBuilder.ilike('name', searchTerm);
    } else if (query.type === 'bio') {
      // Search by biography/career
      queryBuilder = queryBuilder.or(
        `education.ilike.${searchTerm},career.ilike.${searchTerm}`
      );
    } else {
      // Search all fields (name, party, region, position)
      queryBuilder = queryBuilder.or(
        `name.ilike.${searchTerm},party.ilike.${searchTerm},region.ilike.${searchTerm},district.ilike.${searchTerm},position.ilike.${searchTerm}`
      );
    }

    const { data: politicians, error, count } = await queryBuilder;

    if (error) {
      console.error('[정치인 검색 API] DB 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Database query failed',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: politicians || [],
        total: politicians?.length || 0,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
