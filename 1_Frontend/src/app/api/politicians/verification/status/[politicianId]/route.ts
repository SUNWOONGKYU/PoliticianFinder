// P4BA18: Verification Status API
// Description: Get politician verification status and history

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: {
    politicianId: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { politicianId } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(politicianId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID',
          message: '유효하지 않은 정치인 ID입니다.'
        },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 1. Get politician verification status
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id, name, is_verified, verified_at, verified_by')
      .eq('id', politicianId)
      .single()

    if (politicianError || !politician) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: '정치인을 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    // 2. Get verification request history (optional, only for authenticated users)
    let verificationHistory = null
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: history } = await supabase
        .from('politician_verification')
        .select(`
          id,
          verification_method,
          status,
          created_at,
          reviewed_at,
          rejection_reason,
          token_expires_at
        `)
        .eq('politician_id', politicianId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      verificationHistory = history
    }

    // 3. Get verifier information if verified
    let verifierInfo = null
    if (politician.is_verified && politician.verified_by) {
      const { data: verifier } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('id', politician.verified_by)
        .single()

      if (verifier) {
        verifierInfo = {
          id: verifier.id,
          name: verifier.full_name || verifier.email
        }
      }
    }

    // 4. Return verification status
    return NextResponse.json(
      {
        success: true,
        data: {
          politician_id: politician.id,
          politician_name: politician.name,
          is_verified: politician.is_verified,
          verified_at: politician.verified_at,
          verified_by: verifierInfo,
          verification_history: verificationHistory
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Verification Status] Unexpected error:', error)
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
