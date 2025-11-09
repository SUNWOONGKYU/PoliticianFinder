/**
 * Project Grid Task ID: P4BA12
 * 작업명: 시스템 설정 API - 관리자 설정 관리
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5 (api-designer)
 * 의존성: P2D1 (Database 스키마)
 * 설명: 관리자용 시스템 설정 API (포인트, 기능 토글, 유지보수 모드)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  SettingsManager,
  isValidSettingKey,
  getSettingCategory,
} from '../../../../lib/system/settings-manager';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 설정 업데이트 요청 스키마
const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
});

// 여러 설정 업데이트 요청 스키마
const bulkUpdateSettingsSchema = z.object({
  settings: z.array(updateSettingSchema),
});

/**
 * GET /api/admin/system-settings
 * 시스템 설정 조회
 *
 * Query Parameters:
 * - category: string - 특정 카테고리만 조회 (points, features, maintenance, limits)
 * - key: string - 특정 설정 키만 조회
 *
 * Response:
 * {
 *   "success": true,
 *   "data": SystemSetting[] | Record<string, any> | any,
 *   "category"?: string
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const settingsManager = new SettingsManager(
      supabaseUrl,
      supabaseServiceKey
    );

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const key = searchParams.get('key');

    // 특정 키 조회
    if (key) {
      const value = await settingsManager.getSetting(key);

      if (value === null) {
        return NextResponse.json(
          {
            success: false,
            error: `설정을 찾을 수 없습니다: ${key}`,
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: { key, value },
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // 카테고리별 조회
    if (category) {
      let data: any;

      switch (category) {
        case 'points':
          data = await settingsManager.getPointSettings();
          break;
        case 'ranks':
          data = await settingsManager.getRankSettings();
          break;
        case 'features':
          data = await settingsManager.getFeatureSettings();
          break;
        case 'maintenance':
          data = await settingsManager.getMaintenanceSettings();
          break;
        case 'limits':
          data = await settingsManager.getLimitSettings();
          break;
        default:
          data = await settingsManager.getSettingsByCategory(category);
      }

      return NextResponse.json(
        {
          success: true,
          category,
          data,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // 전체 설정 조회
    const settings = await settingsManager.getAllSettings();

    return NextResponse.json(
      {
        success: true,
        data: settings,
        total: settings.length,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/admin/system-settings error:', error);
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
 * PATCH /api/admin/system-settings
 * 시스템 설정 수정
 *
 * Request Body (단일 설정):
 * {
 *   "key": "points.post",
 *   "value": 15
 * }
 *
 * Request Body (여러 설정 일괄):
 * {
 *   "settings": [
 *     { "key": "points.post", "value": 15 },
 *     { "key": "points.comment", "value": 7 }
 *   ]
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": SystemSetting | { updated: number },
 *   "message": string
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const settingsManager = new SettingsManager(
      supabaseUrl,
      supabaseServiceKey
    );

    const body = await request.json();

    // 일괄 업데이트 확인
    if (body.settings && Array.isArray(body.settings)) {
      // 여러 설정 일괄 업데이트
      const validated = bulkUpdateSettingsSchema.parse(body);

      // 모든 키 유효성 검증
      const invalidKeys = validated.settings
        .filter(s => !isValidSettingKey(s.key))
        .map(s => s.key);

      if (invalidKeys.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: '유효하지 않은 설정 키가 포함되어 있습니다',
            invalidKeys,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      // 업데이트 실행
      const result = await settingsManager.updateSettings(validated.settings);

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || '설정 업데이트에 실패했습니다',
            updated: result.updated,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: { updated: result.updated },
          message: `${result.updated}개의 설정이 업데이트되었습니다`,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // 단일 설정 업데이트
    const validated = updateSettingSchema.parse(body);

    // 키 유효성 검증
    if (!isValidSettingKey(validated.key)) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 설정 키입니다',
          key: validated.key,
          validPrefixes: ['points.*', 'ranks.*', 'features.*', 'maintenance.*', 'limits.*'],
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 업데이트 실행
    const result = await settingsManager.updateSetting(
      validated.key,
      validated.value
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || '설정 업데이트에 실패했습니다',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: '설정이 업데이트되었습니다',
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

    console.error('PATCH /api/admin/system-settings error:', error);
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
 * DELETE /api/admin/system-settings/cache
 * 캐시 무효화
 *
 * Query Parameters:
 * - key: string - 특정 키의 캐시만 삭제 (선택사항)
 * - pattern: string - 패턴과 일치하는 캐시 삭제 (예: 'points.*')
 *
 * Response:
 * {
 *   "success": true,
 *   "message": string
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const settingsManager = new SettingsManager(
      supabaseUrl,
      supabaseServiceKey
    );

    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const pattern = searchParams.get('pattern');

    if (key) {
      settingsManager.clearCache(key);
      return NextResponse.json(
        {
          success: true,
          message: `캐시가 삭제되었습니다: ${key}`,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    if (pattern) {
      // Note: 패턴 기반 삭제는 cache-manager에서 지원 필요
      settingsManager.clearCache();
      return NextResponse.json(
        {
          success: true,
          message: '전체 캐시가 삭제되었습니다',
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // 전체 캐시 삭제
    settingsManager.clearCache();

    return NextResponse.json(
      {
        success: true,
        message: '전체 캐시가 삭제되었습니다',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/admin/system-settings/cache error:', error);
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
 * OPTIONS /api/admin/system-settings
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
