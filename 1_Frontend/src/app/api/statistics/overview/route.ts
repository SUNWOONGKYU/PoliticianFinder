// P3BA4: Real API - Statistics Overview (Supabase Integration)
// 전체 통계 API - 실시간 Supabase 데이터 연동

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/statistics/overview
 * 전체 통계 데이터 조회
 * - 총 정치인 수
 * - 총 사용자 수
 * - 총 게시글 수
 * - 총 댓글 수
 * - 총 평가 수
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 병렬로 모든 통계 데이터 가져오기
    const [
      { count: totalPoliticians },
      { count: totalUsers },
      { count: totalPosts },
      { count: totalComments },
      { count: totalRatings },
      { count: activePoliticians },
      { count: verifiedPoliticians },
    ] = await Promise.all([
      // 총 정치인 수
      supabase.from('politicians').select('*', { count: 'exact', head: true }),

      // 총 사용자 수
      supabase.from('users').select('*', { count: 'exact', head: true }),

      // 총 게시글 수 (승인된 게시글만)
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('moderation_status', 'approved'),

      // 총 댓글 수 (comments 테이블이 있다면)
      supabase.from('comments').select('*', { count: 'exact', head: true }),

      // 총 평가 수 (ratings 테이블이 있다면)
      supabase.from('ratings').select('*', { count: 'exact', head: true }),

      // 활성 정치인 수
      supabase
        .from('politicians')
        .select('*', { count: 'exact', head: true })
        .gte('view_count', 10),

      // 검증된 정치인 수
      supabase
        .from('politicians')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true),
    ]);

    // 최근 30일간 활동 통계
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      { count: recentPosts },
      { count: recentUsers },
    ] = await Promise.all([
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString()),

      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString()),
    ]);

    // 응답 데이터 구성
    const statistics = {
      total: {
        politicians: totalPoliticians || 0,
        users: totalUsers || 0,
        posts: totalPosts || 0,
        comments: totalComments || 0,
        ratings: totalRatings || 0,
      },
      politicians: {
        total: totalPoliticians || 0,
        active: activePoliticians || 0,
        verified: verifiedPoliticians || 0,
        verificationRate: totalPoliticians
          ? Math.round((verifiedPoliticians || 0) / totalPoliticians * 100)
          : 0,
      },
      community: {
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
        totalComments: totalComments || 0,
        recentPosts30d: recentPosts || 0,
        recentUsers30d: recentUsers || 0,
      },
      engagement: {
        avgPostsPerUser: totalUsers
          ? Math.round((totalPosts || 0) / totalUsers * 100) / 100
          : 0,
        avgRatingsPerPolitician: totalPoliticians
          ? Math.round((totalRatings || 0) / totalPoliticians * 100) / 100
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
    console.error('GET /api/statistics/overview error:', error);

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
