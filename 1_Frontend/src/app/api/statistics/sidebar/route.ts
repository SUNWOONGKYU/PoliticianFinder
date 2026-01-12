// Sidebar Statistics API - 홈 사이드바 통계 정보
// 정치인/회원/커뮤니티 전체 통계 제공

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // 날짜 계산
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // ============================================
    // 1. 정치인 통계
    // ============================================

    // 전체 정치인 수
    const { count: totalPoliticians } = await supabase
      .from("politicians")
      .select("*", { count: "exact", head: true });

    // 신분별 정치인 수 (identity 컬럼 사용)
    const { data: politiciansByIdentity } = await supabase
      .from("politicians")
      .select("identity");

    const identityStats = {
      현직: 0,
      후보자: 0,
      예비후보자: 0,
      출마예정자: 0,
    };

    (politiciansByIdentity || []).forEach((p: any) => {
      const identity = p.identity || '현직';
      if (identity in identityStats) {
        identityStats[identity as keyof typeof identityStats]++;
      } else {
        // 매핑되지 않은 identity는 현직으로 처리
        identityStats['현직']++;
      }
    });

    // 출마직종별 정치인 수 (position_type 컬럼 사용)
    const { data: politiciansByPositionType } = await supabase
      .from("politicians")
      .select("position_type");

    const positionStats = {
      국회의원: 0,
      광역단체장: 0,
      광역의원: 0,
      기초단체장: 0,
      기초의원: 0,
      교육감: 0,
    };

    (politiciansByPositionType || []).forEach((p: any) => {
      const positionType = p.position_type || '';
      if (positionType in positionStats) {
        positionStats[positionType as keyof typeof positionStats]++;
      }
    });

    // ============================================
    // 2. 회원 통계
    // ============================================

    // 전체 회원 수
    const { count: totalUsers } = await adminClient
      .from("users")
      .select("*", { count: "exact", head: true });

    // 이번 달 가입자 수
    const { count: thisMonthUsers } = await adminClient
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisMonthStart);

    // 레벨별 분포
    const { data: usersByLevel } = await adminClient
      .from("users")
      .select("activity_level");

    const levelStats: Record<string, number> = {};
    (usersByLevel || []).forEach((u: any) => {
      const level = u.activity_level || 'ML1';
      levelStats[level] = (levelStats[level] || 0) + 1;
    });

    // 레벨 내림차순 정렬 (ML10, ML9, ... ML1)
    const sortedLevelStats = Object.entries(levelStats)
      .sort((a, b) => {
        const numA = parseInt(a[0].replace('ML', '')) || 0;
        const numB = parseInt(b[0].replace('ML', '')) || 0;
        return numB - numA;
      })
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, number>);

    // ============================================
    // 3. 커뮤니티 통계
    // ============================================

    // 전체 게시글 수
    const { count: totalPosts } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true });

    // 정치인 게시글 수 (politician_id가 있는 글)
    const { count: politicianPosts } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .not("politician_id", "is", null);

    // 회원 게시글 수 (politician_id가 없는 글)
    const userPosts = (totalPosts || 0) - (politicianPosts || 0);

    // 전체 댓글 수
    const { count: totalComments } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true });

    // 오늘 게시글 수
    const { count: todayPosts } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart);

    // 오늘 댓글 수
    const { count: todayComments } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart);

    // 이번 주 게시글 수
    const { count: weekPosts } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo);

    // 이번 주 댓글 수
    const { count: weekComments } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo);

    // ============================================
    // 응답 데이터 구성
    // ============================================
    const statistics = {
      politicians: {
        total: totalPoliticians || 0,
        byIdentity: identityStats,
        byPosition: positionStats,
      },
      users: {
        total: totalUsers || 0,
        thisMonth: thisMonthUsers || 0,
        byLevel: sortedLevelStats,
      },
      community: {
        posts: {
          total: totalPosts || 0,
          politician: politicianPosts || 0,
          user: userPosts,
        },
        comments: {
          total: totalComments || 0,
        },
        today: {
          posts: todayPosts || 0,
          comments: todayComments || 0,
        },
        thisWeek: {
          posts: weekPosts || 0,
          comments: weekComments || 0,
        },
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: statistics,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error("[Sidebar Statistics API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
