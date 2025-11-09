// P2BA3: 정치인 검색 API
// 정치인 검색 기능 제공

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const searchQuerySchema = z.object({
  q: z.string().min(1),
  type: z.enum(['name', 'bio', 'all']).optional().default('all'),
  limit: z.string().optional().default('10').transform(Number),
});

type SearchQuery = z.infer<typeof searchQuerySchema>;

// 임시 데이터
const mockPoliticians = [
  {
    id: '1',
    name: '김정치',
    party: '국민의힘',
    region: '서울',
    position: '국회의원',
    bio: '경제 전문가',
  },
  {
    id: '2',
    name: '이정책',
    party: '더불어민주당',
    region: '경기',
    position: '국회의원',
    bio: '교육 정책가',
  },
  {
    id: '3',
    name: '박개혁',
    party: '국민의힘',
    region: '인천',
    position: '시장',
    bio: '도시개발 전문가',
  },
];

/**
 * GET /api/search/politicians?q=검색어&type=name&limit=10
 * 정치인 검색
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchQuerySchema.parse({
      q: searchParams.get('q'),
      type: searchParams.get('type'),
      limit: searchParams.get('limit'),
    });

    // 검색 수행
    const results = mockPoliticians.filter((politician) => {
      const searchTerm = query.q.toLowerCase();

      if (query.type === 'name') {
        return politician.name.toLowerCase().includes(searchTerm);
      }

      if (query.type === 'bio') {
        return politician.bio.toLowerCase().includes(searchTerm);
      }

      // all
      return (
        politician.name.toLowerCase().includes(searchTerm) ||
        politician.bio.toLowerCase().includes(searchTerm) ||
        politician.party.toLowerCase().includes(searchTerm) ||
        politician.region.toLowerCase().includes(searchTerm)
      );
    });

    // 결과 제한
    const limited = results.slice(0, query.limit);

    return NextResponse.json(
      {
        success: true,
        data: limited,
        total: results.length,
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
