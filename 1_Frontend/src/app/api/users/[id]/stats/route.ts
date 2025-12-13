// P3BA_FOLLOW: 사용자 통계 API
// GET /api/users/[id]/stats - 레벨, 그레이드, 팔로워 수 등

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: { id: string };
}

// 영향력 그레이드 정보
const INFLUENCE_GRADES: Record<string, { title: string; titleEn: string; emoji: string }> = {
  Wanderer: { title: '방랑자', titleEn: 'Wanderer', emoji: '🚶' },
  Knight: { title: '기사', titleEn: 'Knight', emoji: '⚔️' },
  Lord: { title: '영주', titleEn: 'Lord', emoji: '🏰' },
  Duke: { title: '공작', titleEn: 'Duke', emoji: '👑' },
  Monarch: { title: '군주', titleEn: 'Monarch', emoji: '🌟' },
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const targetUserId = params.id;
    const supabase = await createClient();

    // 사용자 정보 조회 (실제 존재하는 컬럼만)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, nickname, name, profile_image_url, activity_points, activity_level, influence_grade, follower_count, created_at')
      .eq('user_id', targetUserId)
      .single();

    if (userError || !user) {
      console.error('User query error:', userError);
      return NextResponse.json(
        { success: false, error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 게시글 수 조회
    const { count: postCount } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    // 댓글 수 조회
    const { count: commentCount } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    // 팔로잉 수 조회 (RLS 우회를 위해 adminClient 사용)
    const adminClient = createAdminClient();
    const { count: followingCount } = await adminClient
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', targetUserId);

    // 영향력 그레이드 정보
    const gradeKey = user.influence_grade || 'Wanderer';
    const gradeInfo = INFLUENCE_GRADES[gradeKey] || INFLUENCE_GRADES.Wanderer;

    // 활동 포인트 기반 레벨 계산 (DB 값이 아닌 포인트로 동적 계산)
    const currentPoints = user.activity_points || 0;
    const levelThresholds = [0, 100, 300, 600, 1000, 2000, 4000, 8000, 16000, 32000];

    // 포인트 기반으로 레벨 계산
    let calculatedLevelNum = 1;
    for (let i = 1; i < levelThresholds.length; i++) {
      if (currentPoints >= levelThresholds[i]) {
        calculatedLevelNum = i + 1;
      } else {
        break;
      }
    }
    const currentLevelNum = calculatedLevelNum;
    const nextLevelPoints = currentLevelNum < 10 ? levelThresholds[currentLevelNum] : null;
    const pointsToNextLevel = nextLevelPoints ? nextLevelPoints - currentPoints : null;
    const prevThreshold = levelThresholds[currentLevelNum - 1] || 0;
    const progressPercent = nextLevelPoints
      ? Math.min(100, ((currentPoints - prevThreshold) / (nextLevelPoints - prevThreshold)) * 100)
      : 100;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.user_id,
          username: user.name || user.nickname || '익명',
          profile_image_url: user.profile_image_url,
          joined_at: user.created_at,
        },
        activity: {
          level: 'ML' + currentLevelNum,  // 포인트 기반 계산된 레벨
          points: currentPoints,
          next_level: currentLevelNum < 10 ? 'ML' + (currentLevelNum + 1) : null,
          points_to_next_level: pointsToNextLevel,
          progress_percent: Math.round(progressPercent),
        },
        influence: {
          grade: gradeKey,
          title: gradeInfo.title,
          titleEn: gradeInfo.titleEn,
          emoji: gradeInfo.emoji,
          display: gradeInfo.emoji + ' ' + gradeInfo.title,
        },
        followers: {
          count: user.follower_count || 0,
          following_count: followingCount || 0,
        },
        district: null,
        activity_stats: {
          post_count: postCount || 0,
          comment_count: commentCount || 0,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/users/[id]/stats error:', error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
