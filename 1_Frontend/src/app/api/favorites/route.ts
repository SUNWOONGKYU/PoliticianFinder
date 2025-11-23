// P3BA2: Real API - 관심 정치인 (User Authentication + RLS)
// Supabase 연동: 관심 정치인 목록 조회 및 추가/삭제

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// 관심 정치인 추가 스키마
// politician_id는 8자리 hexadecimal 문자열 (예: 'cd8c0263')
const addFavoriteSchema = z.object({
  politician_id: z.string().length(8, "유효한 정치인 ID가 아닙니다."),
  notes: z.string().optional(),
  notification_enabled: z.boolean().optional().default(false),
  is_pinned: z.boolean().optional().default(false),
});

/**
 * GET /api/favorites
 * 현재 사용자의 관심 정치인 목록 조회 (RLS 적용)
 */
export async function GET(request: NextRequest) {
  try {
    // Supabase 서버 클라이언트 생성 (인증된 사용자)
    const supabase = createClient();

    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관심 정치인 목록 조회 (정치인 정보와 조인)
    // RLS 정책으로 자동으로 user_id 필터링됨
    // 성능 최적화: 필요한 컬럼만 선택
    const { data: favorites, error } = await supabase
      .from('favorite_politicians')
      .select(`
        id,
        politician_id,
        notes,
        notification_enabled,
        is_pinned,
        created_at,
        politicians (
          id,
          name,
          party,
          position,
          profile_image_url
        )
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        {
          success: false,
          error: '관심 정치인 목록 조회 중 오류가 발생했습니다.',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: favorites || [],
        count: favorites?.length || 0,
        user_id: user.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/favorites error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites
 * 관심 정치인 추가 (RLS 적용)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = addFavoriteSchema.parse(body);

    // Supabase 서버 클라이언트 생성 (인증된 사용자)
    const supabase = createClient();

    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 정치인 존재 여부 확인
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id, name, party, position')
      .eq('id', validated.politician_id)
      .single();

    if (politicianError || !politician) {
      return NextResponse.json(
        { success: false, error: '정치인을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 중복 확인 (RLS 정책으로 자동 필터링)
    const { data: existing, error: existError } = await supabase
      .from('favorite_politicians')
      .select('id')
      .eq('politician_id', validated.politician_id)
      .maybeSingle();

    if (existError && existError.code !== 'PGRST116') {
      console.error('Supabase query error:', existError);
      return NextResponse.json(
        {
          success: false,
          error: '관심 정치인 확인 중 오류가 발생했습니다.',
          details: existError.message
        },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { success: false, error: '이미 관심 정치인으로 등록된 정치인입니다.' },
        { status: 409 }
      );
    }

    // 관심 정치인 추가 (RLS 정책으로 user_id 자동 설정)
    const { data: newFavorite, error } = await supabase
      .from('favorite_politicians')
      .insert({
        user_id: user.id,
        politician_id: validated.politician_id,
        notes: validated.notes,
        notification_enabled: validated.notification_enabled,
        is_pinned: validated.is_pinned,
      })
      .select(`
        *,
        politicians (
          id,
          name,
          profile_image_url,
          party,
          position
        )
      `)
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        {
          success: false,
          error: '관심 정치인 등록 중 오류가 발생했습니다.',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: '관심 정치인으로 등록되었습니다.',
        data: newFavorite,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 입력 데이터입니다.',
          details: error.errors
        },
        { status: 400 }
      );
    }
    console.error('POST /api/favorites error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/favorites?politician_id={uuid}
 * 관심 정치인 삭제 (RLS 적용)
 */
export async function DELETE(request: NextRequest) {
  try {
    const politician_id = request.nextUrl.searchParams.get("politician_id");

    if (!politician_id) {
      return NextResponse.json(
        { success: false, error: 'politician_id는 필수입니다.' },
        { status: 400 }
      );
    }

    // politician_id 형식 검증 (8자리 hexadecimal)
    const politicianIdSchema = z.string().length(8);
    try {
      politicianIdSchema.parse(politician_id);
    } catch {
      return NextResponse.json(
        { success: false, error: '유효한 politician_id 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // Supabase 서버 클라이언트 생성 (인증된 사용자)
    const supabase = createClient();

    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관심 정치인 존재 여부 확인 (RLS 정책으로 자동 필터링)
    const { data: existing, error: existError } = await supabase
      .from('favorite_politicians')
      .select('id')
      .eq('politician_id', politician_id)
      .maybeSingle();

    if (existError && existError.code !== 'PGRST116') {
      console.error('Supabase query error:', existError);
      return NextResponse.json(
        {
          success: false,
          error: '관심 정치인 확인 중 오류가 발생했습니다.',
          details: existError.message
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '관심 정치인 목록에서 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 관심 정치인 삭제 (RLS 정책으로 user_id 자동 필터링)
    const { error: deleteError } = await supabase
      .from('favorite_politicians')
      .delete()
      .eq('politician_id', politician_id);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: '관심 정치인 삭제 중 오류가 발생했습니다.',
          details: deleteError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: '관심 정치인 목록에서 제거되었습니다.',
        data: { politician_id },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/favorites error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
