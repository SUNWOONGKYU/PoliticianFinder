// P1BA4: Real API - 팔로우 API
// Supabase RLS 연동: 실제 인증 사용자 기반 팔로우
// 스키마: follower_id, following_type, following_user_id, following_politician_id

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/helpers";

const followSchema = z.object({
  politician_id: z.string().min(8).max(8),  // 8자리 hex 문자열
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const supabase = await createClient();
    const body = await request.json();

    const follow = followSchema.parse(body);

    // 정치인 존재 여부 확인
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id, name')
      .eq('id', follow.politician_id)
      .single();

    if (politicianError || !politician) {
      return NextResponse.json(
        { success: false, error: "정치인을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 중복 팔로우 확인 (DB 스키마에 맞게 수정)
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_type', 'politician')
      .eq('following_politician_id', follow.politician_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "이미 팔로우한 정치인입니다" },
        { status: 409 }
      );
    }

    // 팔로우 생성 (DB 스키마에 맞게 수정)
    const { data: newFollow, error: insertError } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_type: 'politician',
        following_politician_id: follow.politician_id,
        following_user_id: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { success: false, error: "팔로우 추가 중 오류가 발생했습니다", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newFollow,
          politician_name: politician.name
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }
    console.error('POST /api/follows error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const supabase = await createClient();
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    // DB 스키마에 맞게 수정: follower_id, following_politician_id
    let query = supabase
      .from('follows')
      .select('*, politicians:following_politician_id(id, name, party, position, region, profile_image_url)', { count: 'exact' })
      .eq('follower_id', user.id)
      .eq('following_type', 'politician')
      .order('created_at', { ascending: false });

    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, count, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { success: false, error: "팔로우 목록 조회 중 오류가 발생했습니다", details: error.message },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: data || [],
        pagination: { page, limit, total, totalPages },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/follows error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const supabase = await createClient();
    const body = await request.json();

    const { politician_id } = body;

    if (!politician_id) {
      return NextResponse.json(
        { success: false, error: {code: 'VALIDATION_ERROR', message: "politician_id is required"} },
        { status: 400 }
      );
    }

    // DB 스키마에 맞게 수정: follower_id, following_type, following_politician_id
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_type', 'politician')
      .eq('following_politician_id', politician_id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { success: false, error: "언팔로우 중 오류가 발생했습니다", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Unfollowed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/follows error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
