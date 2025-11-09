// P1BA4: Mock API - 기타 (팔로우 API)
// Supabase 연동 - 사용자-정치인 팔로우 관계 관리

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Mock User UUID for testing
const MOCK_USER_ID = '7f61567b-bbdf-427a-90a9-0ee060ef4595';

const followSchema = z.object({
  user_id: z.string().uuid().optional(),
  politician_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const follow = followSchema.parse({
      ...body,
      user_id: body.user_id || MOCK_USER_ID,
    });

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

    // 중복 팔로우 확인
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('user_id', follow.user_id)
      .eq('politician_id', follow.politician_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "이미 팔로우한 정치인입니다" },
        { status: 409 }
      );
    }

    // 팔로우 생성
    const { data: newFollow, error: insertError } = await supabase
      .from('follows')
      .insert({
        user_id: follow.user_id,
        politician_id: follow.politician_id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { success: false, error: "팔로우 추가 중 오류가 발생했습니다" },
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const user_id = request.nextUrl.searchParams.get("user_id") || MOCK_USER_ID;
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from('follows')
      .select('*, politicians(id, name, party, position, region, profile_image_url)', { count: 'exact' })
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, count, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { success: false, error: "팔로우 목록 조회 중 오류가 발생했습니다" },
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const { user_id, politician_id } = body;

    if (!user_id || !politician_id) {
      return NextResponse.json(
        { success: false, error: "user_id and politician_id are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('user_id', user_id || MOCK_USER_ID)
      .eq('politician_id', politician_id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { success: false, error: "언팔로우 중 오류가 발생했습니다" },
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
