/**
 * Project Grid Task ID: P4BA10
 * 작업명: 정책 관리 API - 사용자용 정책 조회
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5 (api-designer)
 * 의존성: P2D1 (Database 스키마)
 * 설명: 사용자용 현재 정책 조회 API (인증 불필요)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  PolicyVersionManager,
  isValidPolicyType,
  getPolicyTypeName,
} from '../../../lib/policies/version-manager';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET /api/policies/[type]
 * 특정 타입의 현재 정책 조회 (사용자용)
 *
 * Path Parameters:
 * - type: "terms" | "privacy" | "marketing" | "community"
 *
 * Query Parameters:
 * - version: number - 특정 버전 조회 (선택사항)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "type": "terms",
 *     "version": 1,
 *     "title": "이용약관",
 *     "content": "...",
 *     "is_current": true,
 *     "effective_date": "2025-11-09T00:00:00Z",
 *     "created_at": "2025-11-09T00:00:00Z"
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const { type } = params;

    // 정책 타입 검증
    if (!isValidPolicyType(type)) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 정책 타입입니다',
          validTypes: ['terms', 'privacy', 'marketing', 'community'],
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const policyManager = new PolicyVersionManager(supabaseUrl, supabaseAnonKey);

    const searchParams = request.nextUrl.searchParams;
    const versionParam = searchParams.get('version');

    let policy;

    // 특정 버전 조회
    if (versionParam) {
      const version = parseInt(versionParam);
      if (isNaN(version) || version < 1) {
        return NextResponse.json(
          {
            success: false,
            error: '유효하지 않은 버전 번호입니다',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      policy = await policyManager.getPolicyByVersion(type, version);
    } else {
      // 현재 버전 조회
      policy = await policyManager.getCurrentPolicy(type);
    }

    if (!policy) {
      return NextResponse.json(
        {
          success: false,
          error: '정책을 찾을 수 없습니다',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...policy,
          type_name: getPolicyTypeName(type),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/policies/[type] error:', error);
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
 * OPTIONS /api/policies/[type]
 * CORS preflight 요청 처리
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
