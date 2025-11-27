// Sidebar Statistics API - 홈 사이드바 통계 정보
// 전체 정치인 수, 활성 정치인 수, 게시글 수, 댓글 수 등 통계 제공

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. 전체 정치인 수
    const { count: totalPoliticians, error: politiciansError } = await supabase
      .from("politicians")
      .select("*", { count: "exact", head: true });

    if (politiciansError) {
      console.error("Error counting politicians:", politiciansError);
    }

    // 2. 활성 정치인 수 (is_active = true)
    const { count: activePoliticians, error: activeError } = await supabase
      .from("politicians")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (activeError) {
      console.error("Error counting active politicians:", activeError);
    }

    // 3. 전체 게시글 수
    const { count: totalPosts, error: postsError } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true });

    if (postsError) {
      console.error("Error counting posts:", postsError);
    }

    // 4. 정치인 게시판 게시글 수 (category = 'politician')
    const { count: politicianPosts, error: politicianPostsError } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("category", "politician");

    if (politicianPostsError) {
      console.error("Error counting politician posts:", politicianPostsError);
    }

    // 5. 일반 게시판 게시글 수 (category != 'politician')
    const { count: userPosts, error: userPostsError } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .neq("category", "politician");

    if (userPostsError) {
      console.error("Error counting user posts:", userPostsError);
    }

    // 6. 전체 댓글 수
    const { count: totalComments, error: commentsError } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true });

    if (commentsError) {
      console.error("Error counting comments:", commentsError);
    }

    // 7. 전체 평가 수
    const { count: totalRatings, error: ratingsError } = await supabase
      .from("politician_ratings")
      .select("*", { count: "exact", head: true });

    if (ratingsError) {
      console.error("Error counting ratings:", ratingsError);
    }

    // 8. 전체 즐겨찾기 수
    const { count: totalFavorites, error: favoritesError } = await supabase
      .from("favorite_politicians")
      .select("*", { count: "exact", head: true });

    if (favoritesError) {
      console.error("Error counting favorites:", favoritesError);
    }

    // 9. 최근 7일간 신규 게시글 수
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentPosts, error: recentPostsError } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString());

    if (recentPostsError) {
      console.error("Error counting recent posts:", recentPostsError);
    }

    // 10. 최근 7일간 신규 댓글 수
    const { count: recentComments, error: recentCommentsError } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString());

    if (recentCommentsError) {
      console.error("Error counting recent comments:", recentCommentsError);
    }

    const statistics = {
      politicians: {
        total: totalPoliticians || 0,
        active: activePoliticians || 0,
        inactive: (totalPoliticians || 0) - (activePoliticians || 0),
      },
      posts: {
        total: totalPosts || 0,
        politician: politicianPosts || 0,
        user: userPosts || 0,
        recent7Days: recentPosts || 0,
      },
      comments: {
        total: totalComments || 0,
        recent7Days: recentComments || 0,
      },
      engagement: {
        totalRatings: totalRatings || 0,
        totalFavorites: totalFavorites || 0,
      },
      summary: {
        totalPoliticians: totalPoliticians || 0,
        activePoliticians: activePoliticians || 0,
        totalPosts: totalPosts || 0,
        politicianPosts: politicianPosts || 0,
        userPosts: userPosts || 0,
        totalComments: totalComments || 0,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: statistics,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
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
