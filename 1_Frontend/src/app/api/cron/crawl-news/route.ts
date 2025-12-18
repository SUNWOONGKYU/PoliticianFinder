// P7BA4: 뉴스 크롤링 Cron API
// GET /api/cron/crawl-news
// 정치인 관련 뉴스를 외부 API에서 수집

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Vercel Cron 인증 확인
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  return process.env.NODE_ENV === 'development';
}

// URL 해시 생성 (중복 체크용)
function hashUrl(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

// 네이버 뉴스 API 호출 (NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 필요)
async function fetchNaverNews(query: string): Promise<any[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('[crawl-news] Naver API credentials not configured');
    return [];
  }

  try {
    const response = await fetch(
      `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=10&sort=date`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      }
    );

    if (!response.ok) {
      console.error('[crawl-news] Naver API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('[crawl-news] Naver fetch error:', error);
    return [];
  }
}

// HTML 태그 제거
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' }
      }, { status: 401 });
    }

    const supabase = createAdminClient();

    // URL 파라미터: 특정 정치인만 크롤링 (선택적)
    const { searchParams } = new URL(request.url);
    const targetPoliticianId = searchParams.get('politician_id');
    const maxPoliticians = parseInt(searchParams.get('limit') || '10');

    // 자동화 로그 시작
    const { data: logEntry } = await ((supabase.from('automation_logs') as any)
      .insert({
        job_type: 'news_crawl',
        status: 'running',
        started_at: new Date().toISOString(),
        metadata: { target_politician: targetPoliticianId, max_politicians: maxPoliticians },
      })
      .select('id')
      .single());

    const logId = logEntry?.id;

    try {
      // 크롤링 대상 정치인 조회
      let query = supabase
        .from('politicians')
        .select('id, name, party')
        .order('updated_at', { ascending: false })
        .limit(maxPoliticians);

      if (targetPoliticianId) {
        query = query.eq('id', targetPoliticianId);
      }

      const { data: politicians, error: politicianError } = await query as { data: any[]; error: any };

      if (politicianError || !politicians) {
        throw new Error('정치인 목록 조회 실패');
      }

      const crawlResults: Record<string, { fetched: number; saved: number; duplicates: number }> = {};
      let totalFetched = 0;
      let totalSaved = 0;
      let totalDuplicates = 0;

      // 각 정치인별 뉴스 크롤링
      for (const politician of politicians) {
        const searchQuery = `${politician.name} 정치인`;
        const newsItems = await fetchNaverNews(searchQuery);

        let savedCount = 0;
        let duplicateCount = 0;

        for (const item of newsItems) {
          const urlHash = hashUrl(item.link);

          // 중복 체크
          const { data: existing } = await (supabase
            .from('crawled_news')
            .select('id')
            .eq('url_hash', urlHash)
            .single() as any);

          if (existing) {
            duplicateCount++;
            continue;
          }

          // 뉴스 저장
          const { error: insertError } = await ((supabase.from('crawled_news') as any)
            .insert({
              politician_id: politician.id,
              title: stripHtml(item.title),
              summary: stripHtml(item.description),
              source_url: item.link,
              source_name: item.originallink ? new URL(item.originallink).hostname : null,
              published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
              url_hash: urlHash,
              category: '정치',
              metadata: {
                original_link: item.originallink,
                search_query: searchQuery,
              },
            }));

          if (!insertError) {
            savedCount++;
          }
        }

        crawlResults[politician.name] = {
          fetched: newsItems.length,
          saved: savedCount,
          duplicates: duplicateCount,
        };

        totalFetched += newsItems.length;
        totalSaved += savedCount;
        totalDuplicates += duplicateCount;

        // API 호출 간격 (네이버 API 제한 고려)
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const duration = Date.now() - startTime;

      // 자동화 로그 업데이트 (성공)
      if (logId) {
        await (supabase.from('automation_logs') as any)
          .update({
            status: 'success',
            completed_at: new Date().toISOString(),
            duration_ms: duration,
            records_processed: totalSaved,
            metadata: {
              politicians_processed: politicians.length,
              total_fetched: totalFetched,
              total_saved: totalSaved,
              total_duplicates: totalDuplicates,
              results: crawlResults,
            },
          })
          .eq('id', logId);
      }

      return NextResponse.json({
        success: true,
        message: '뉴스 크롤링이 완료되었습니다.',
        data: {
          politicians_processed: politicians.length,
          total_fetched: totalFetched,
          total_saved: totalSaved,
          total_duplicates: totalDuplicates,
          results: crawlResults,
          duration_ms: duration,
        },
      });

    } catch (innerError: any) {
      if (logId) {
        await (supabase.from('automation_logs') as any)
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            error_message: innerError.message,
          })
          .eq('id', logId);
      }
      throw innerError;
    }

  } catch (error: any) {
    console.error('[crawl-news] Error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'CRAWL_ERROR',
        message: '뉴스 크롤링 중 오류가 발생했습니다.',
        details: error.message,
      },
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300;  // 5분
