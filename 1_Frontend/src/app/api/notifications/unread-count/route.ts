// P7BA3: 읽지 않은 알림 수 조회 API
// GET /api/notifications/unread-count

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const supabase = await createClient();

    // 읽지 않은 알림 수 조회
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('[unread-count] Error:', error);
      return NextResponse.json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: '알림 수 조회 중 오류가 발생했습니다.' }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
    });

  } catch (error) {
    console.error('[unread-count] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' }
    }, { status: 500 });
  }
}
