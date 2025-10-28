/**
 * Unread Notifications API Route
 * 읽지 않은 알림 조회 API
 *
 * GET /api/notifications/unread - 읽지 않은 알림 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Notification, PaginatedResponse } from '@/types/community'

/**
 * GET /api/notifications/unread
 * 읽지 않은 알림 목록 조회
 *
 * Query Parameters:
 * - page (optional): 페이지 번호 (기본값: 1)
 * - limit (optional): 페이지당 항목 수 (기본값: 20, 최대: 100)
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
    const page = Number(searchParams.get('page')) || 1
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)

    // 페이지네이션 계산
    const from = (page - 1) * limit
    const to = from + limit - 1

    // P4D2: Optimized - Use JOIN to fetch sender profiles in single query
    const { data, error, count } = await supabase
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
      .eq('status', 'unread')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Unread notifications fetch error:', error)
      return NextResponse.json(
        { success: false, error: '읽지 않은 알림 조회에 실패했습니다.' },
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

    // P4B3: 읽지 않은 알림 - private 캐싱 1분
    return NextResponse.json({
      success: true,
      ...response
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60'
      }
    })

  } catch (error) {
    console.error('GET /api/notifications/unread error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}