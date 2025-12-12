// P3BA_FOLLOW: 사용자-사용자 팔로우 API
// POST: 팔로우, DELETE: 언팔로우, GET: 팔로우 상태 확인

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/helpers";

interface RouteParams {
  params: { id: string };
}

// POST /api/users/[id]/follow - 팔로우
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const targetUserId = params.id;

    // 자기 자신 팔로우 방지
    if (user.id === targetUserId) {
      return NextResponse.json(
        { success: false, error: "자기 자신을 팔로우할 수 없습니다" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 대상 사용자 존재 확인
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, username, nickname')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { success: false, error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 이미 팔로우 중인지 확인
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_type', 'user')
      .eq('following_user_id', targetUserId)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "이미 팔로우 중입니다" },
        { status: 409 }
      );
    }

    // 팔로우 생성
    const { data: newFollow, error: insertError } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_type: 'user',
        following_user_id: targetUserId,
        following_politician_id: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Follow insert error:', insertError);
      return NextResponse.json(
        { success: false, error: "팔로우 추가 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    // 대상 사용자의 최신 정보 조회 (트리거가 업데이트함)
    const { data: updatedUser } = await supabase
      .from('users')
      .select('follower_count, following_count, activity_points, activity_level, influence_grade')
      .eq('id', targetUserId)
      .single();

    return NextResponse.json(
      {
        success: true,
        message: "팔로우했습니다",
        data: {
          follow_id: newFollow.id,
          target_user: {
            id: targetUserId,
            username: targetUser.username || targetUser.nickname,
            follower_count: updatedUser?.follower_count || 0,
          },
          points_awarded: 20,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/users/[id]/follow error:', error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id]/follow - 언팔로우
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const targetUserId = params.id;
    const supabase = await createClient();

    // 팔로우 삭제
    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_type', 'user')
      .eq('following_user_id', targetUserId);

    if (deleteError) {
      console.error('Unfollow error:', deleteError);
      return NextResponse.json(
        { success: false, error: "언팔로우 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "언팔로우했습니다" },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/users/[id]/follow error:', error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// GET /api/users/[id]/follow - 팔로우 상태 확인
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      // 비로그인 시에도 팔로우 상태는 조회 가능 (false 반환)
      return NextResponse.json({
        success: true,
        data: { is_following: false }
      });
    }
    const { user } = authResult;

    const targetUserId = params.id;
    const supabase = await createClient();

    // 팔로우 상태 확인
    const { data: follow } = await supabase
      .from('follows')
      .select('id, created_at')
      .eq('follower_id', user.id)
      .eq('following_type', 'user')
      .eq('following_user_id', targetUserId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        is_following: !!follow,
        followed_at: follow?.created_at || null,
      }
    });
  } catch (error) {
    console.error('GET /api/users/[id]/follow error:', error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
