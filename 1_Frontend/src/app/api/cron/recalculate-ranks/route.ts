// P4O3: 등급 재계산 스케줄러
// Vercel Cron Job for automatic user level recalculation

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Points calculation constants
const POINTS = {
  POST_CREATED: 10,
  COMMENT_CREATED: 5,
  LIKE_RECEIVED: 2,
  COMMENT_RECEIVED: 3,
  REPORT_PENALTY: -50,
} as const;

// Level thresholds
const LEVELS = [
  { level: 1, min: 0, max: 99, name: '새싹' },
  { level: 2, min: 100, max: 499, name: '일반' },
  { level: 3, min: 500, max: 1999, name: '활동가' },
  { level: 4, min: 2000, max: 4999, name: '전문가' },
  { level: 5, min: 5000, max: Infinity, name: '명예' },
] as const;

/**
 * Calculate user level based on points
 */
function calculateLevel(points: number): number {
  for (const levelInfo of LEVELS) {
    if (points >= levelInfo.min && points <= levelInfo.max) {
      return levelInfo.level;
    }
  }
  return 1; // Default to level 1
}

/**
 * GET /api/cron/recalculate-ranks
 * Vercel Cron Job - Recalculates all user ranks based on activity
 * Runs daily at 3:00 AM (0 3 * * *)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify Vercel Cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Unauthorized access attempt');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized: Invalid cron secret',
          },
        },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting user rank recalculation...');

    // 2. Create Supabase service client (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Cron] Missing Supabase credentials');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'Server configuration error',
          },
        },
        { status: 500 }
      );
    }

    const supabase = createServiceClient(supabaseUrl, supabaseServiceKey);

    // 3. Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, level, points');

    if (usersError) {
      console.error('[Cron] Error fetching users:', usersError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch users',
          },
        },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.log('[Cron] No users to process');
      return NextResponse.json({
        success: true,
        data: {
          processed: 0,
          updated: 0,
          notifications_created: 0,
        },
      });
    }

    console.log(`[Cron] Processing ${users.length} users...`);

    let updatedCount = 0;
    let notificationsCreated = 0;
    const updates: { userId: string; oldLevel: number; newLevel: number; points: number }[] = [];

    // 4. Process each user
    for (const user of users) {
      try {
        // Calculate points from activities
        // a) Posts created
        const { count: postCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // b) Comments created
        const { count: commentCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // c) Likes received on posts
        const { data: userPosts } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', user.id);

        let postLikesCount = 0;
        if (userPosts && userPosts.length > 0) {
          const postIds = userPosts.map((p) => p.id);
          const { count } = await supabase
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .in('post_id', postIds);
          postLikesCount = count || 0;
        }

        // d) Likes received on comments
        const { data: userComments } = await supabase
          .from('comments')
          .select('id')
          .eq('user_id', user.id);

        let commentLikesCount = 0;
        if (userComments && userComments.length > 0) {
          const commentIds = userComments.map((c) => c.id);
          const { count } = await supabase
            .from('comment_likes')
            .select('*', { count: 'exact', head: true })
            .in('comment_id', commentIds);
          commentLikesCount = count || 0;
        }

        // e) Comments received on posts
        let commentsReceivedCount = 0;
        if (userPosts && userPosts.length > 0) {
          const postIds = userPosts.map((p) => p.id);
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .in('post_id', postIds)
            .neq('user_id', user.id); // Don't count own comments
          commentsReceivedCount = count || 0;
        }

        // f) Reports received (penalty)
        const { count: reportCount } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('target_type', 'user')
          .eq('target_id', user.id)
          .in('status', ['accepted', 'resolved']);

        // Calculate total points
        const totalPoints =
          (postCount || 0) * POINTS.POST_CREATED +
          (commentCount || 0) * POINTS.COMMENT_CREATED +
          postLikesCount * POINTS.LIKE_RECEIVED +
          commentLikesCount * POINTS.LIKE_RECEIVED +
          commentsReceivedCount * POINTS.COMMENT_RECEIVED +
          (reportCount || 0) * POINTS.REPORT_PENALTY;

        // Ensure points don't go below 0
        const finalPoints = Math.max(0, totalPoints);

        // Calculate new level
        const newLevel = calculateLevel(finalPoints);
        const oldLevel = user.level || 1;

        // 5. Update user if points or level changed
        if (finalPoints !== user.points || newLevel !== oldLevel) {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              points: finalPoints,
              level: newLevel,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (updateError) {
            console.error(`[Cron] Error updating user ${user.id}:`, updateError);
            continue;
          }

          updatedCount++;
          updates.push({
            userId: user.id,
            oldLevel,
            newLevel,
            points: finalPoints,
          });

          // 6. Create notification if level changed
          if (newLevel !== oldLevel) {
            const levelInfo = LEVELS.find((l) => l.level === newLevel);
            const levelName = levelInfo?.name || '사용자';

            const isLevelUp = newLevel > oldLevel;
            const notificationTitle = isLevelUp ? '레벨 업!' : '레벨 변경';
            const notificationMessage = isLevelUp
              ? `축하합니다! 레벨 ${oldLevel}에서 레벨 ${newLevel} (${levelName})로 승급하셨습니다!`
              : `레벨이 ${oldLevel}에서 레벨 ${newLevel} (${levelName})로 변경되었습니다.`;

            const { error: notificationError } = await supabase
              .from('notifications')
              .insert({
                user_id: user.id,
                type: 'system',
                title: notificationTitle,
                message: notificationMessage,
                link_url: '/profile',
                target_type: 'user',
                target_id: user.id,
              });

            if (!notificationError) {
              notificationsCreated++;
            } else {
              console.error(`[Cron] Error creating notification for user ${user.id}:`, notificationError);
            }
          }
        }
      } catch (userError) {
        console.error(`[Cron] Error processing user ${user.id}:`, userError);
        continue;
      }
    }

    console.log(`[Cron] Rank recalculation completed:`, {
      processed: users.length,
      updated: updatedCount,
      notifications: notificationsCreated,
    });

    return NextResponse.json({
      success: true,
      data: {
        processed: users.length,
        updated: updatedCount,
        notifications_created: notificationsCreated,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Cron] Unexpected error during rank recalculation:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to recalculate ranks',
        },
      },
      { status: 500 }
    );
  }
}
