/**
 * Mark Notification as Read API Route
 * 개별 알림 읽음 처리 API
 *
 * PUT /api/notifications/[id]/read - 특정 알림을 읽음으로 표시
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Notification, ApiResponse } from '@/types/community'

/**
 * PUT /api/notifications/[id]/read
 * 특정 알림을 읽음으로 표시
 *
 * @param params.id - 알림 ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const notificationId = parseInt(params.id)

    // ID 유효성 검증
    if (!notificationId || isNaN(notificationId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 알림 ID입니다.' },
        { status: 400 }
      )
    }

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 알림 소유자 확인 및 현재 상태 조회
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !notification) {
      return NextResponse.json(
        { success: false, error: '알림을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 읽은 알림인 경우
    if (notification.status === 'read') {
      return NextResponse.json({
        success: true,
        data: notification as Notification,
        message: '이미 읽은 알림입니다.'
      })
    }

    // 알림을 읽음으로 표시
    const { data: updatedNotification, error: updateError } = await supabase
      .from('notifications')
      .update({
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Notification update error:', updateError)
      return NextResponse.json(
        { success: false, error: '알림 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedNotification as Notification,
      message: '알림이 읽음으로 표시되었습니다.'
    } as ApiResponse<Notification>)

  } catch (error) {
    console.error('PUT /api/notifications/[id]/read error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}