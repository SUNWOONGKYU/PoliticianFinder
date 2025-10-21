/**
 * Mark All Notifications as Read API Route
 * 전체 알림 읽음 처리 API
 *
 * PUT /api/notifications/read-all - 모든 알림을 읽음으로 표시
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { MarkNotificationsReadRequest, ApiResponse } from '@/types/community'

/**
 * PUT /api/notifications/read-all
 * 모든 알림 또는 선택한 알림들을 읽음으로 표시
 *
 * Body:
 * - notification_ids (optional): 특정 알림 ID 배열
 * - all (optional): true인 경우 모든 읽지 않은 알림을 읽음 처리
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // Request body 파싱
    const body: MarkNotificationsReadRequest = await request.json()
    const { notification_ids, all } = body

    // 파라미터 유효성 검증
    if (!all && (!notification_ids || notification_ids.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'notification_ids 배열 또는 all 플래그가 필요합니다.'
        },
        { status: 400 }
      )
    }

    let query = supabase
      .from('notifications')
      .update({
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('status', 'unread')

    // 특정 알림들만 처리하는 경우
    if (notification_ids && notification_ids.length > 0) {
      query = query.in('id', notification_ids)
    }

    // 쿼리 실행
    const { data: updatedNotifications, error: updateError } = await query.select()

    if (updateError) {
      console.error('Notifications update error:', updateError)
      return NextResponse.json(
        { success: false, error: '알림 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    const count = updatedNotifications?.length || 0

    return NextResponse.json({
      success: true,
      data: {
        updated_count: count,
        message: `${count}개의 알림이 읽음으로 표시되었습니다.`
      }
    } as ApiResponse<{ updated_count: number; message: string }>)

  } catch (error) {
    console.error('PUT /api/notifications/read-all error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}