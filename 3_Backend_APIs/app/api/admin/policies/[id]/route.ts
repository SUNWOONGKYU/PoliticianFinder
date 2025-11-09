/**
 * Project Grid Task ID: P4BA10
 * 작업명: 정책 관리 API - 개별 정책 관리
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5 (api-designer)
 * 의존성: P2D1 (Database 스키마)
 * 설명: 관리자용 개별 정책 관리 API (조회, 수정, 삭제, 현재 버전 설정)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PolicyVersionManager } from '../../../../lib/policies/version-manager';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 정책 업데이트 요청 스키마
const updatePolicySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  effective_date: z.string().datetime().optional(),
});

// 현재 버전 설정 요청 스키마
const setCurrentSchema = z.object({
  set_current: z.boolean(),
});

/**
 * GET /api/admin/policies/[id]
 * 특정 정책 조회
 *
 * Response:
 * {
 *   "success": true,
 *   "data": Policy
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const policyManager = new PolicyVersionManager(
      supabaseUrl,
      supabaseServiceKey
    );

    const { id } = params;

    // Supabase에서 직접 조회
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: policy, error } = await supabase
      .from('policies')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !policy) {
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
        data: policy,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/admin/policies/[id] error:', error);
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
 * PATCH /api/admin/policies/[id]
 * 정책 수정 또는 현재 버전으로 설정
 *
 * Request Body (수정):
 * {
 *   "title": "새 제목" (optional),
 *   "content": "새 내용" (optional),
 *   "effective_date": "2025-11-09T00:00:00Z" (optional)
 * }
 *
 * Request Body (현재 버전 설정):
 * {
 *   "set_current": true
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": Policy,
 *   "message": "정책이 업데이트되었습니다"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const policyManager = new PolicyVersionManager(
      supabaseUrl,
      supabaseServiceKey
    );

    const { id } = params;
    const body = await request.json();

    // 현재 버전 설정 요청인지 확인
    if ('set_current' in body) {
      const validated = setCurrentSchema.parse(body);

      if (validated.set_current) {
        const result = await policyManager.setAsCurrent(id);

        if (!result.success) {
          return NextResponse.json(
            {
              success: false,
              error: result.error || '현재 버전 설정에 실패했습니다',
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          {
            success: true,
            data: result.data,
            message: '현재 버전으로 설정되었습니다',
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      }
    }

    // 일반 업데이트 요청
    const validated = updatePolicySchema.parse(body);

    const result = await policyManager.updatePolicy(id, validated);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || '정책 업데이트에 실패했습니다',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: '정책이 업데이트되었습니다',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
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

    console.error('PATCH /api/admin/policies/[id] error:', error);
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
 * DELETE /api/admin/policies/[id]
 * 정책 삭제 (현재 활성 버전은 삭제 불가)
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "정책이 삭제되었습니다"
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const policyManager = new PolicyVersionManager(
      supabaseUrl,
      supabaseServiceKey
    );

    const { id } = params;

    const result = await policyManager.deletePolicy(id);

    if (!result.success) {
      const statusCode = result.error?.includes('찾을 수 없습니다')
        ? 404
        : result.error?.includes('삭제할 수 없습니다')
        ? 403
        : 400;

      return NextResponse.json(
        {
          success: false,
          error: result.error || '정책 삭제에 실패했습니다',
          timestamp: new Date().toISOString(),
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: '정책이 삭제되었습니다',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/admin/policies/[id] error:', error);
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
 * OPTIONS /api/admin/policies/[id]
 * CORS preflight 요청 처리
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
