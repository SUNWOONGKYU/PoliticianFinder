// P3BA4: Real API - Community Statistics (Supabase Integration)
// 커뮤니티 통계 API - 실시간 Supabase 데이터 연동

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/statistics/community
 * 커뮤니티 통계 데이터 조회
 * - 사용자 통계
 * - 게시글 통계
 * - 댓글 통계
 * - 활동 추이
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = request.nextUrl;
    const period = searchParams.get('period') || '30'; // 기본 30일
    const days = parseInt(period, 10);

    // 기간 계산
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 사용자 통계
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: newUsers },
      { data: topUsers },
    ] = await Promise.all([
      // 총 사용자 수
      supabase.from('users').select('*', { count: 'exact', head: true }),

      // 활성 사용자 (최근 기간 내 활동)
      supabase
        .from('posts')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString()),

      // 신규 사용자 (최근 기간 내 가입)
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString()),

      // 상위 사용자 (포인트 기준)
      supabase
        .from('users')
        .select('id, name, avatar_url, points, level')
        .order('points', { ascending: false })
        .limit(10),
    ]);

    // 게시글 통계
    const [
      { count: totalPosts },
      { count: approvedPosts },
      { count: recentPosts },
      { data: postsByCategory },
      { data: topPosts },
    ] = await Promise.all([
      // 총 게시글 수
      supabase.from('posts').select('*', { count: 'exact', head: true }),

      // 승인된 게시글 수
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('moderation_status', 'approved'),

      // 최근 게시글 수
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString()),

      // 카테고리별 게시글 수
      supabase
        .from('posts')
        .select('category')
        .eq('moderation_status', 'approved'),

      // 인기 게시글 (좋아요 기준)
      supabase
        .from('posts')
        .select('id, title, upvotes, downvotes, view_count, comment_count, created_at')
        .eq('moderation_status', 'approved')
        .order('upvotes', { ascending: false })
        .limit(10),
    ]);

    // 카테고리별 집계
    const categoryStats = (postsByCategory || []).reduce((acc, post) => {
      const category = post.category || 'general';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 댓글 통계
    const [
      { count: totalComments },
      { count: recentComments },
    ] = await Promise.all([
      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString()),
    ]);

    // 일별 활동 추이 (최근 기간)
    const { data: dailyPosts } = await supabase
      .from('posts')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // 일별 데이터 집계
    const dailyActivity: Record<string, number> = {};
    (dailyPosts || []).forEach(post => {
      const date = new Date(post.created_at).toISOString().split('T')[0];
      dailyActivity[date] = (dailyActivity[date] || 0) + 1;
    });

    const activityTrend = Object.entries(dailyActivity).map(([date, count]) => ({
      date,
      posts: count,
    }));

    // 응답 데이터 구성
    const statistics = {
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
        new: newUsers || 0,
        activeRate: totalUsers
          ? Math.round((activeUsers || 0) / totalUsers * 100)
          : 0,
        topUsers: topUsers || [],
      },
      posts: {
        total: totalPosts || 0,
        approved: approvedPosts || 0,
        recent: recentPosts || 0,
        byCategory: categoryStats,
        topPosts: topPosts || [],
        approvalRate: totalPosts
          ? Math.round((approvedPosts || 0) / totalPosts * 100)
          : 0,
      },
      comments: {
        total: totalComments || 0,
        recent: recentComments || 0,
        avgPerPost: approvedPosts
          ? Math.round((totalComments || 0) / approvedPosts * 100) / 100
          : 0,
      },
      activity: {
        period: days,
        trend: activityTrend,
        avgDailyPosts: activityTrend.length
          ? Math.round((recentPosts || 0) / activityTrend.length * 100) / 100
          : 0,
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
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/statistics/community error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
