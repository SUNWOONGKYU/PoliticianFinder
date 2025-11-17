// P1BA4: Real API - 투표/공감 API
// Supabase RLS 연동: 실제 인증 사용자 기반 투표

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/helpers";

const voteSchema = z.object({
  post_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  vote_type: z.enum(["like", "dislike"]),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    // 2. 요청 데이터 검증
    const body = await request.json();
    const vote = voteSchema.parse({
      ...body,
      user_id: user.id,
    });

    // 3. Supabase 클라이언트 생성
    const supabase = createClient();

    // 4. 게시물 존재 여부 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, title')
      .eq('id', vote.post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: "게시물을 찾을 수 없습니다",
          },
        },
        { status: 404 }
      );
    }

    // 기존 투표 확인
    const { data: existing } = await supabase
      .from('votes')
      .select('id, vote_type')
      .eq('post_id', vote.post_id)
      .eq('user_id', vote.user_id)
      .single();

    // 동일한 투표가 이미 있는 경우
    if (existing && existing.vote_type === vote.vote_type) {
      return NextResponse.json(
        { success: false, error: "이미 투표하셨습니다" },
        { status: 409 }
      );
    }

    let result;

    if (existing) {
      // 기존 투표 타입 변경
      const { data, error: updateError } = await supabase
        .from('votes')
        .update({ vote_type: vote.vote_type, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        return NextResponse.json(
          { success: false, error: "투표 업데이트 중 오류가 발생했습니다" },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // 새 투표 생성
      const { data, error: insertError } = await supabase
        .from('votes')
        .insert({
          post_id: vote.post_id,
          user_id: vote.user_id,
          vote_type: vote.vote_type,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return NextResponse.json(
          { success: false, error: "투표 생성 중 오류가 발생했습니다" },
          { status: 500 }
        );
      }

      result = data;
    }

    // 게시물의 like/dislike 카운트 업데이트
    if (vote.vote_type === 'like') {
      await supabase.rpc('increment_like_count', { post_id: vote.post_id });
    } else {
      await supabase.rpc('increment_dislike_count', { post_id: vote.post_id });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...result,
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
    console.error('POST /api/votes error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const post_id = request.nextUrl.searchParams.get("post_id");
    const user_id = request.nextUrl.searchParams.get("user_id");
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    if (!post_id) {
      return NextResponse.json(
        { success: false, error: {code: 'VALIDATION_ERROR', message: "post_id is required"} },
        { status: 400 }
      );
    }

    let query = supabase
      .from('votes')
      .select('*, profiles(id, username)', { count: 'exact' })
      .eq('post_id', post_id)
      .order('created_at', { ascending: false });

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
        { success: false, error: "투표 목록 조회 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    // 투표 요약 계산
    const votes = data || [];
    const likes = votes.filter(v => v.vote_type === 'like').length;
    const dislikes = votes.filter(v => v.vote_type === 'dislike').length;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: votes,
        summary: { likes, dislikes, total },
        pagination: { page, limit, total, totalPages },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/votes error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. 인증 확인
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    // 2. Supabase 클라이언트 생성
    const supabase = createClient();
    const post_id = request.nextUrl.searchParams.get("post_id");

    if (!post_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: "post_id is required",
          },
        },
        { status: 400 }
      );
    }

    // 3. 투표 삭제
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('post_id', post_id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { success: false, error: "투표 삭제 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Vote removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/votes error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
