/**
 * Project Grid Task ID: P4BA12
 * 작업명: 시스템 설정 API - 공개 설정 조회
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5 (api-designer)
 * 의존성: P2D1 (Database 스키마)
 * 설명: 일반 사용자용 공개 시스템 설정 API (유지보수 모드, 기능 상태 등)
 */

import { NextRequest, NextResponse } from 'next/server';
import { SettingsManager } from '../../../../lib/system/settings-manager';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/system-settings/public
 * 공개 시스템 설정 조회 (일반 사용자용)
 *
 * Query Parameters:
 * - check: string - 특정 항목만 확인 (maintenance, features, limits)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "maintenance": MaintenanceSettings,
 *     "features": FeatureSettings,
 *     "limits": LimitSettings
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const settingsManager = new SettingsManager(
      supabaseUrl,
      supabaseServiceKey
    );

    const searchParams = request.nextUrl.searchParams;
    const check = searchParams.get('check');

    // 유지보수 모드만 확인
    if (check === 'maintenance') {
      const maintenance = await settingsManager.getMaintenanceSettings();

      return NextResponse.json(
        {
          success: true,
          data: {
            maintenance,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // 기능 상태만 확인
    if (check === 'features') {
      const features = await settingsManager.getFeatureSettings();

      return NextResponse.json(
        {
          success: true,
          data: {
            features,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // 제한 설정만 확인
    if (check === 'limits') {
      const limits = await settingsManager.getLimitSettings();

      return NextResponse.json(
        {
          success: true,
          data: {
            limits,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // 전체 공개 설정 조회
    const [maintenance, features, limits] = await Promise.all([
      settingsManager.getMaintenanceSettings(),
      settingsManager.getFeatureSettings(),
      settingsManager.getLimitSettings(),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          maintenance,
          features,
          limits,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/system-settings/public error:', error);
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
 * OPTIONS /api/system-settings/public
 * CORS preflight 요청 처리
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
