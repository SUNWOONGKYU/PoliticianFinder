// User Activities API - 사용자 활동 내역 조회
// 최근 게시글, 댓글, 평가, 즐겨찾기 정보 제공

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "사용자 ID가 필요합니다.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: "유효하지 않은 사용자 ID 형식입니다.",
        },
        { status: 400 }
      );
    }

    // 1. 최근 작성한 게시글 (5개)
    const { data: recentPosts, error: postsError } = await supabase
      .from("posts")
      .select("id, title, content, created_at, view_count, like_count, comment_count, category")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (postsError) {
      console.error("Error fetching recent posts:", postsError);
    }

    // 2. 최근 작성한 댓글 (5개)
    const { data: recentComments, error: commentsError } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        post_id,
        posts (
          id,
          title
        )
      `)
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (commentsError) {
      console.error("Error fetching recent comments:", commentsError);
    }

    // 3. 최근 평가한 정치인 (5개)
    const { data: recentRatings, error: ratingsError } = await supabase
      .from("politician_ratings")
      .select(`
        id,
        politician_id,
        rating,
        created_at,
        politicians (
          id,
          name,
          party,
          position,
          profile_image_url
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (ratingsError) {
      console.error("Error fetching recent ratings:", ratingsError);
    }

    // 4. 최근 추가한 즐겨찾기 (5개)
    const { data: recentFavorites, error: favoritesError } = await supabase
      .from("favorite_politicians")
      .select(`
        id,
        politician_id,
        created_at,
        politicians (
          id,
          name,
          party,
          position,
          profile_image_url,
          region,
          district
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (favoritesError) {
      console.error("Error fetching recent favorites:", favoritesError);
    }

    // 5. 활동 통계 계산
    const { count: totalPosts } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", userId);

    const { count: totalComments } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("author_id", userId);

    const { count: totalRatings } = await supabase
      .from("politician_ratings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: totalFavorites } = await supabase
      .from("favorite_politicians")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // 응답 데이터 구성
    const activities = {
      recentPosts: (recentPosts || []).map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content?.substring(0, 100) + (post.content?.length > 100 ? "..." : ""),
        category: post.category,
        createdAt: post.created_at,
        viewCount: post.view_count || 0,
        likeCount: post.like_count || 0,
        commentCount: post.comment_count || 0,
      })),
      recentComments: (recentComments || []).map((comment) => ({
        id: comment.id,
        content: comment.content?.substring(0, 100) + (comment.content?.length > 100 ? "..." : ""),
        createdAt: comment.created_at,
        postId: comment.post_id,
        postTitle: (comment.posts as any)?.title || "삭제된 게시글",
      })),
      recentRatings: (recentRatings || []).map((rating) => ({
        id: rating.id,
        politicianId: rating.politician_id,
        rating: rating.rating,
        createdAt: rating.created_at,
        politician: {
          id: (rating.politicians as any)?.id,
          name: (rating.politicians as any)?.name,
          party: (rating.politicians as any)?.party,
          position: (rating.politicians as any)?.position,
          profileImageUrl: (rating.politicians as any)?.profile_image_url,
        },
      })),
      recentFavorites: (recentFavorites || []).map((favorite) => ({
        id: favorite.id,
        politicianId: favorite.politician_id,
        createdAt: favorite.created_at,
        politician: {
          id: (favorite.politicians as any)?.id,
          name: (favorite.politicians as any)?.name,
          party: (favorite.politicians as any)?.party,
          position: (favorite.politicians as any)?.position,
          region: (favorite.politicians as any)?.region,
          district: (favorite.politicians as any)?.district,
          profileImageUrl: (favorite.politicians as any)?.profile_image_url,
        },
      })),
    };

    const statistics = {
      totalPosts: totalPosts || 0,
      totalComments: totalComments || 0,
      totalRatings: totalRatings || 0,
      totalFavorites: totalFavorites || 0,
      totalActivities: (totalPosts || 0) + (totalComments || 0) + (totalRatings || 0) + (totalFavorites || 0),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          activities,
          statistics,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[User Activities API] Error:", error);
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
