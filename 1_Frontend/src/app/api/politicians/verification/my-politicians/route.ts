// API: Get user's verified politicians
// Description: Get list of politicians that the current user has verified

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: '로그인이 필요합니다.'
        },
        { status: 401 }
      )
    }

    // 2. Get user's verified politicians
    const { data: verifications, error: verificationError } = await supabase
      .from('politician_verification')
      .select(`
        id,
        politician_id,
        status,
        created_at,
        reviewed_at,
        politicians (
          id,
          name,
          political_party_name,
          position_name,
          is_verified
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (verificationError) {
      console.error('[My Politicians] Database error:', verificationError)
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: '데이터를 불러오는 중 오류가 발생했습니다.'
        },
        { status: 500 }
      )
    }

    // 3. Format response
    const politicians = verifications
      .filter((v: any) => v.politicians) // Filter out null politicians
      .map((v: any) => ({
        id: v.politician_id,
        name: v.politicians.name,
        party: v.politicians.political_party_name || '정당 정보 없음',
        position: v.politicians.position_name || '직책 정보 없음',
        is_verified: v.politicians.is_verified,
        verified_at: v.reviewed_at,
        verification_id: v.id
      }))

    return NextResponse.json(
      {
        success: true,
        data: politicians
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[My Politicians] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
