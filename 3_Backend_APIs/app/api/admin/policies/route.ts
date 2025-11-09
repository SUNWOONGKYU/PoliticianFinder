/**
 * Project Grid Task ID: P4BA10
 * 작업명: 정책 관리 API - 관리자 정책 목록/생성
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5 (api-designer)
 * 의존성: P2D1 (Database 스키마)
 * 설명: 관리자용 정책 관리 API (목록 조회, 현재 버전 조회, 새 버전 생성)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  PolicyVersionManager,
  POLICY_TYPES,
  isValidPolicyType,
} from '../../../lib/policies/version-manager';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 정책 생성 요청 스키마
const createPolicySchema = z.object({
  type: z.enum(['terms', 'privacy', 'marketing', 'community']),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  effective_date: z.string().datetime(),
  updated_by: z.string().uuid().optional(),
});

/**
 * GET /api/admin/policies
 * 정책 목록 조회 (전체 버전 또는 현재 버전)
 *
 * Query Parameters:
 * - current: true - 현재 버전만 조회
 * - type: string - 특정 타입만 필터링
 * - page: number - 페이지 번호 (기본: 1)
 * - limit: number - 페이지 크기 (기본: 20)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": Policy[],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 50,
 *     "totalPages": 3
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const policyManager = new PolicyVersionManager(
      supabaseUrl,
      supabaseServiceKey
    );

    const searchParams = request.nextUrl.searchParams;
    const current = searchParams.get('current') === 'true';
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 현재 버전만 조회
    if (current) {
      if (type && isValidPolicyType(type)) {
        // 특정 타입의 현재 버전
        const policy = await policyManager.getCurrentPolicy(type);
        return NextResponse.json(
          {
            success: true,
            data: policy ? [policy] : [],
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      } else {
        // 모든 타입의 현재 버전
        const policies = await policyManager.getAllCurrentPolicies();
        return NextResponse.json(
          {
            success: true,
            data: policies,
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      }
    }

    // 특정 타입의 전체 히스토리 조회
    if (type && isValidPolicyType(type)) {
      const history = await policyManager.getPolicyHistory(type);
      return NextResponse.json(
        {
          success: true,
          data: history,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // 전체 정책 조회 (페이지네이션)
    const result = await policyManager.getAllPolicies(page, limit);

    return NextResponse.json(
      {
        success: true,
        data: result.policies,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/admin/policies error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/policies
 * 새 정책 버전 생성
 *
 * Request Body:
 * {
 *   "type": "terms" | "privacy" | "marketing" | "community",
 *   "title": "정책 제목",
 *   "content": "정책 내용",
 *   "effective_date": "2025-11-09T00:00:00Z",
 *   "updated_by": "user-uuid" (optional)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": Policy,
 *   "message": "새 정책 버전이 생성되었습니다"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const policyManager = new PolicyVersionManager(
      supabaseUrl,
      supabaseServiceKey
    );

    const body = await request.json();

    // 요청 검증
    const validated = createPolicySchema.parse(body);

    // 새 버전 생성
    const result = await policyManager.createNewVersion(validated);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || '정책 생성에 실패했습니다',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: `새 정책 버전이 생성되었습니다 (v${result.data?.version})`,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: error.errors,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    console.error('POST /api/admin/policies error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/admin/policies
 * CORS preflight 요청 처리
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
