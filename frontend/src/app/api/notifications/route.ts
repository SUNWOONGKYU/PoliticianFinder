/**
 * Notifications API Route
 * 알림 생성 및 조회를 담당하는 API Route
 *
 * POST /api/notifications - 새로운 알림 생성 (시스템 또는 트리거)
 * GET /api/notifications - 사용자 알림 목록 조회 (인증 필수)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  CreateNotificationRequest,
  Notification,
  NotificationFilters,
  NotificationType,
  NotificationStatus,
  PaginatedResponse,
  ApiResponse
} from '@/types/community'

/**
 * POST /api/notifications
 * 새로운 알림 생성
 *
 * - 시스템이나 다른 사용자 액션에 의해 트리거됨
 * - 주로 내부 API나 서버 함수에서 호출
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Request body 파싱
    const body: CreateNotificationRequest = await request.json()
    const { user_id, type, title, message, link, metadata, sender_id } = body

    // 입력 유효성 검증
    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다. (user_id, type, title, message)'
        },
        { status: 400 }
      )
    }

    // 알림 타입 유효성 검증
    const validTypes = ['comment', 'reply', 'like', 'rating', 'mention', 'system']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 알림 타입입니다.' },
        { status: 400 }
      )
    }

    // 수신자 존재 여부 확인
    const { data: recipient, error: recipientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single()

    if (recipientError || !recipient) {
      return NextResponse.json(
        { success: false, error: '수신자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 알림 생성
    const { data: newNotification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        status: 'unread',
        title,
        message,
        link: link || null,
        metadata: metadata || null,
        sender_id: sender_id || null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Notification insert error:', insertError)
      return NextResponse.json(
        { success: false, error: '알림 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: newNotification as Notification,
        message: '알림이 성공적으로 생성되었습니다.'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('POST /api/notifications error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/notifications
 * 사용자 알림 목록 조회
 *
 * Query Parameters:
 * - type (optional): 알림 타입 필터
 * - status (optional): 알림 상태 필터 (unread, read, archived)
 * - page (optional): 페이지 번호 (기본값: 1)
 * - limit (optional): 페이지당 항목 수 (기본값: 20, 최대: 100)
 * - startDate (optional): 시작 날짜 필터
 * - endDate (optional): 종료 날짜 필터
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

    const { searchParams } = new URL(request.url)

    // Query parameters 파싱
    const type = searchParams.get('type') as NotificationType | null
    const status = searchParams.get('status') as NotificationStatus | null
    const page = Number(searchParams.get('page')) || 1
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 페이지네이션 계산
    const from = (page - 1) * limit
    const to = from + limit - 1

    // P4D2: Optimized - Use JOIN to fetch sender profiles in single query
    // Build query with sender profile JOIN
    let query = supabase
      .from('notifications')
      .select(`
        *,
        sender:sender_id (
          id,
          username,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)

    // 필터 적용
    if (type) {
      query = query.eq('type', type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // 정렬 및 페이지네이션
    query = query
      .order('created_at', { ascending: false })
      .range(from, to)

    // 쿼리 실행 (sender 정보 포함, N+1 쿼리 제거)
    const { data, error, count } = await query

    if (error) {
      console.error('Notifications fetch error:', error)
      return NextResponse.json(
        { success: false, error: '알림 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    const enrichedData = data || []

    // 응답 구성
    const response: PaginatedResponse<Notification> = {
      data: enrichedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }

    // P4B3: 알림 목록 - 사용자 데이터, private 캐싱 1분
    return NextResponse.json({
      success: true,
      ...response
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60'
      }
    })

  } catch (error) {
    console.error('GET /api/notifications error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 알림 생성 헬퍼 함수
 * 다른 API 라우트에서 알림을 생성할 때 사용
 */
export async function createNotification(
  supabase: any,
  notification: CreateNotificationRequest
): Promise<Notification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.user_id,
        type: notification.type,
        status: 'unread',
        title: notification.title,
        message: notification.message,
        link: notification.link || null,
        metadata: notification.metadata || null,
        sender_id: notification.sender_id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create notification:', error)
      return null
    }

    return data as Notification
  } catch (error) {
    console.error('Error in createNotification helper:', error)
    return null
  }
}