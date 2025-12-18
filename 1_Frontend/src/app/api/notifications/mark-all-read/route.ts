// P7BA3: 모든 알림 읽음 처리 API
// POST /api/notifications/mark-all-read

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/helpers';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const supabase = await createClient();

    // 모든 읽지 않은 알림을 읽음 처리
    const { error, count } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('[mark-all-read] Error:', error);
      return NextResponse.json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: '알림 업데이트 중 오류가 발생했습니다.' }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '모든 알림이 읽음 처리되었습니다.',
      updated_count: count || 0,
    });

  } catch (error) {
    console.error('[mark-all-read] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' }
    }, { status: 500 });
  }
}
