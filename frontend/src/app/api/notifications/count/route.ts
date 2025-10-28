/**
 * Notification Count API Route
 * 알림 개수 조회 API
 *
 * GET /api/notifications/count - 알림 개수 조회 (전체, 읽지 않음, 타입별)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { NotificationCountResponse, NotificationCountApiResponse } from '@/types/community'

/**
 * GET /api/notifications/count
 * 알림 개수 조회
 *
 * 사용자의 알림 통계를 반환합니다.
 * - 전체 알림 개수
 * - 읽지 않은 알림 개수
 * - 타입별 알림 개수
 */
export async function GET(request: NextRequest) {
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

    // 전체 알림 개수 조회
    const { count: totalCount, error: totalError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (totalError) {
      throw totalError
    }

    // 읽지 않은 알림 개수 조회
    const { count: unreadCount, error: unreadError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'unread')

    if (unreadError) {
      throw unreadError
    }

    // 타입별 알림 개수 조회
    const { data: typeData, error: typeError } = await supabase
      .from('notifications')
      .select('type')
      .eq('user_id', user.id)
      .eq('status', 'unread')

    if (typeError) {
      throw typeError
    }

    // 타입별 카운트 집계
    const byType: { [key: string]: number } = {}
    if (typeData) {
      typeData.forEach((item: { type: string }) => {
        byType[item.type] = (byType[item.type] || 0) + 1
      })
    }

    const response: NotificationCountResponse = {
      total: totalCount || 0,
      unread: unreadCount || 0,
      by_type: byType
    }

    // P4B3: 알림 개수 - private 캐싱 1분
    return NextResponse.json({
      success: true,
      data: response
    } as NotificationCountApiResponse, {
      headers: {
        'Cache-Control': 'private, max-age=60'
      }
    })

  } catch (error) {
    console.error('GET /api/notifications/count error:', error)
    return NextResponse.json(
      { success: false, error: '알림 개수 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}