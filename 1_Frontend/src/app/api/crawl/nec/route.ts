// Task: P4BA1 - 선관위 크롤링 스크립트
// API Route for NEC Crawler

import { NextRequest, NextResponse } from 'next/server';
import { crawlNEC, CrawlerOptions } from '@/lib/crawlers';

/**
 * POST /api/crawl/nec
 *
 * 선관위 크롤링 실행 API
 *
 * Request Body (optional):
 * {
 *   "options": {
 *     "headless": true,
 *     "timeout": 30000,
 *     "maxRetries": 3
 *   }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": [...],
 *   "stats": {...}
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json().catch(() => ({}));
    const options: CrawlerOptions = body.options || {};

    // 크롤링 실행
    const result = await crawlNEC({
      headless: true, // 서버에서는 항상 headless 모드
      timeout: options.timeout || 60000,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 2000,
      waitTime: options.waitTime || 2000,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully crawled ${result.data.length} politicians`,
        data: result.data,
        stats: {
          startTime: result.stats.startTime.toISOString(),
          endTime: result.stats.endTime.toISOString(),
          duration: result.stats.duration,
          itemsCollected: result.stats.itemsCollected,
          itemsFailed: result.stats.itemsFailed,
          retryCount: result.stats.retryCount,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.error?.code,
            message: result.error?.message,
            retryable: result.error?.retryable,
          },
          stats: {
            startTime: result.stats.startTime.toISOString(),
            endTime: result.stats.endTime.toISOString(),
            duration: result.stats.duration,
            itemsCollected: result.stats.itemsCollected,
            itemsFailed: result.stats.itemsFailed,
            retryCount: result.stats.retryCount,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Crawl API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: (error as Error).message,
          retryable: false,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crawl/nec
 *
 * 크롤러 정보 조회
 */
export async function GET() {
  return NextResponse.json({
    service: 'NEC Crawler',
    description: '중앙선거관리위원회 정치인 정보 크롤러',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: '크롤링 실행',
        body: {
          options: {
            timeout: 'number (optional, default: 60000)',
            maxRetries: 'number (optional, default: 3)',
            retryDelay: 'number (optional, default: 2000)',
            waitTime: 'number (optional, default: 2000)',
          },
        },
      },
    },
    usage: {
      example: {
        method: 'POST',
        url: '/api/crawl/nec',
        body: {
          options: {
            timeout: 60000,
            maxRetries: 3,
          },
        },
      },
    },
  });
}
