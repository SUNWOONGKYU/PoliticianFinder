// Admin API - 정치인 프로필 이미지 일괄 업데이트
// Service Role Key 사용으로 RLS 우회

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/helpers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '') || '';

// 단일 정치인 이미지 업데이트 스키마
const singleUpdateSchema = z.object({
  politician_id: z.string().length(8, "유효한 정치인 ID가 아닙니다"),
  profile_image_url: z.string().url("유효한 URL이 아닙니다"),
});

// 일괄 업데이트 스키마
const bulkUpdateSchema = z.object({
  updates: z.array(singleUpdateSchema).min(1, "최소 1개 이상의 업데이트가 필요합니다"),
});

/**
 * GET /api/admin/politicians/update-images
 * 이미지가 없거나 기본 이미지인 정치인 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error.' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 이미지가 없거나 기본 이미지(placeholder)인 정치인 조회
    const { data: politicians, error } = await supabase
      .from('politicians')
      .select('id, name, party, position, region, profile_image_url')
      .or('profile_image_url.is.null,profile_image_url.like.%placeholder%,profile_image_url.like.%default%')
      .order('name', { ascending: true });

    if (error) {
      console.error('[Update Images API] Query error:', error);
      return NextResponse.json(
        { success: false, error: '정치인 목록 조회 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: politicians?.length || 0,
      data: politicians || [],
    });
  } catch (error) {
    console.error('[Update Images API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/politicians/update-images
 * 정치인 프로필 이미지 일괄 업데이트
 */
export async function PATCH(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validated = bulkUpdateSchema.parse(body);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: { politician_id: string; success: boolean; error?: string }[] = [];
    let successCount = 0;
    let failCount = 0;

    // 각 정치인 이미지 업데이트
    for (const update of validated.updates) {
      const { data, error } = await supabase
        .from('politicians')
        .update({
          profile_image_url: update.profile_image_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.politician_id)
        .select('id, name')
        .single();

      if (error) {
        console.error(`[Update Images API] Update failed for ${update.politician_id}:`, error);
        results.push({
          politician_id: update.politician_id,
          success: false,
          error: error.message,
        });
        failCount++;
      } else {
        results.push({
          politician_id: update.politician_id,
          success: true,
        });
        successCount++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: validated.updates.length,
        success: successCount,
        failed: failCount,
      },
      results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '입력 데이터가 올바르지 않습니다', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Update Images API] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/politicians/update-images
 * 단일 정치인 이미지 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validated = singleUpdateSchema.parse(body);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('politicians')
      .update({
        profile_image_url: validated.profile_image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.politician_id)
      .select('id, name, profile_image_url')
      .single();

    if (error) {
      console.error('[Update Images API] Update failed:', error);
      return NextResponse.json(
        { success: false, error: '이미지 업데이트 실패', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${data.name} 정치인의 이미지가 업데이트되었습니다`,
      data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '입력 데이터가 올바르지 않습니다', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Update Images API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
