// P3BA_FOLLOW: 팔로워 목록 조회 API
// GET /api/users/[id]/followers

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const targetUserId = params.id;
    const supabase = await createClient();

    // 페이지네이션 파라미터
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 대상 사용자 확인
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, username, nickname, follower_count')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { success: false, error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 팔로워 목록 조회 (이 사용자를 팔로우하는 사람들)
    const { data: followers, error: followersError, count } = await supabase
      .from('follows')
      .select(`
        id,
        created_at,
        follower:follower_id (
          id,
          username,
          nickname,
          profile_image_url,
          activity_level,
          influence_grade,
          follower_count
        )
      `, { count: 'exact' })
      .eq('following_type', 'user')
      .eq('following_user_id', targetUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (followersError) {
      console.error('Followers query error:', followersError);
      return NextResponse.json(
        { success: false, error: "팔로워 목록 조회 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: targetUser.id,
          username: targetUser.username || targetUser.nickname,
          follower_count: targetUser.follower_count || 0,
        },
        followers: followers?.map(f => ({
          id: (f.follower as any)?.id,
          username: (f.follower as any)?.username || (f.follower as any)?.nickname,
          profile_image_url: (f.follower as any)?.profile_image_url,
          activity_level: (f.follower as any)?.activity_level || 'ML1',
          influence_grade: (f.follower as any)?.influence_grade || 'Wanderer',
          follower_count: (f.follower as any)?.follower_count || 0,
          followed_at: f.created_at,
        })) || [],
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('GET /api/users/[id]/followers error:', error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
