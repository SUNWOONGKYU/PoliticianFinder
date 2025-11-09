// P1BA4: Mock API - 기타 (공유 API)
// Supabase 연동 - 게시물 공유 데이터 관리

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Mock User UUID for testing
const MOCK_USER_ID = '7f61567b-bbdf-427a-90a9-0ee060ef4595';

const shareSchema = z.object({
  post_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  shared_via: z.enum(["link", "social", "message"]),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const share = shareSchema.parse({
      ...body,
      user_id: body.user_id || MOCK_USER_ID,
    });

    // 게시물 존재 여부 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, title')
      .eq('id', share.post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: "게시물을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 공유 기록 생성
    const { data: newShare, error: insertError } = await supabase
      .from('shares')
      .insert({
        post_id: share.post_id,
        user_id: share.user_id,
        shared_via: share.shared_via,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { success: false, error: "공유 기록 생성 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    // 게시물의 share_count 증가
    await supabase.rpc('increment_share_count', { post_id: share.post_id });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newShare,
          post_title: post.title
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
    console.error('POST /api/shares error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const post_id = request.nextUrl.searchParams.get("post_id");
    const user_id = request.nextUrl.searchParams.get("user_id");
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    if (!post_id && !user_id) {
      return NextResponse.json(
        { success: false, error: "post_id or user_id is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from('shares')
      .select('*, posts(id, title), users(id, username)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (post_id) {
      query = query.eq('post_id', post_id);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, count, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { success: false, error: "공유 목록 조회 중 오류가 발생했습니다" },
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
    console.error('GET /api/shares error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
