// P3BA_FOLLOW: 팔로잉 목록 조회 API
// GET /api/users/[id]/following

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

    // 타입 필터 (user, politician, all)
    const type = request.nextUrl.searchParams.get('type') || 'all';

    // 대상 사용자 확인
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, username, nickname, following_count')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { success: false, error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 팔로잉 목록 조회
    let query = supabase
      .from('follows')
      .select(`
        id,
        following_type,
        created_at,
        following_user:following_user_id (
          id,
          username,
          nickname,
          profile_image_url,
          activity_level,
          influence_grade,
          follower_count
        ),
        following_politician:following_politician_id (
          id,
          name,
          party,
          position,
          profile_image_url
        )
      `, { count: 'exact' })
      .eq('follower_id', targetUserId)
      .order('created_at', { ascending: false });

    // 타입 필터 적용
    if (type === 'user') {
      query = query.eq('following_type', 'user');
    } else if (type === 'politician') {
      query = query.eq('following_type', 'politician');
    }

    const { data: following, error: followingError, count } = await query
      .range(offset, offset + limit - 1);

    if (followingError) {
      console.error('Following query error:', followingError);
      return NextResponse.json(
        { success: false, error: "팔로잉 목록 조회 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // 결과 포맷팅
    const formattedFollowing = following?.map(f => {
      if (f.following_type === 'user' && f.following_user) {
        const user = f.following_user as any;
        return {
          type: 'user',
          id: user.id,
          username: user.username || user.nickname,
          profile_image_url: user.profile_image_url,
          activity_level: user.activity_level || 'ML1',
          influence_grade: user.influence_grade || 'Wanderer',
          follower_count: user.follower_count || 0,
          followed_at: f.created_at,
        };
      } else if (f.following_type === 'politician' && f.following_politician) {
        const politician = f.following_politician as any;
        return {
          type: 'politician',
          id: politician.id,
          name: politician.name,
          party: politician.party,
          position: politician.position,
          profile_image_url: politician.profile_image_url,
          followed_at: f.created_at,
        };
      }
      return null;
    }).filter(Boolean) || [];

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: targetUser.id,
          username: targetUser.username || targetUser.nickname,
          following_count: targetUser.following_count || 0,
        },
        following: formattedFollowing,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('GET /api/users/[id]/following error:', error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
