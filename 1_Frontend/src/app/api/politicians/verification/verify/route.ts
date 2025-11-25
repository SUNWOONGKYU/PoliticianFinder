// P4BA18: Verification Confirm API
// Description: Verify politician with email confirmation code

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const verificationConfirmSchema = z.object({
  request_id: z.string().uuid('유효하지 않은 요청 ID입니다.'),
  verification_code: z
    .string()
    .min(6, '인증 코드는 6자리입니다.')
    .max(6, '인증 코드는 6자리입니다.')
    .transform(val => val.toUpperCase()),
})

export async function POST(request: NextRequest) {
  try {
    // 1. User authentication check
    const supabase = await createClient()
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

    // 2. Parse and validate request body
    const body = await request.json()
    const validated = verificationConfirmSchema.parse(body)

    // 3. Get verification request
    const { data: verificationRequest, error: requestError } = await supabase
      .from('politician_verification')
      .select('*')
      .eq('id', validated.request_id)
      .eq('user_id', user.id)
      .single()

    if (requestError || !verificationRequest) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: '검증 요청을 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    // 4. Check if already verified or rejected
    if (verificationRequest.status === 'approved') {
      return NextResponse.json(
        {
          success: false,
          error: 'Already verified',
          message: '이미 승인된 요청입니다.'
        },
        { status: 400 }
      )
    }

    if (verificationRequest.status === 'rejected') {
      return NextResponse.json(
        {
          success: false,
          error: 'Request rejected',
          message: '거부된 요청입니다.',
          rejection_reason: verificationRequest.rejection_reason
        },
        { status: 400 }
      )
    }

    // 5. Verify the code matches
    if (verificationRequest.verification_token !== validated.verification_code) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid code',
          message: '인증 코드가 일치하지 않습니다.'
        },
        { status: 400 }
      )
    }

    // 6. Check if code has expired
    const now = new Date()
    const expiresAt = new Date(verificationRequest.token_expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Code expired',
          message: '인증 코드가 만료되었습니다. 새로운 인증 코드를 요청해주세요.',
          expired_at: verificationRequest.token_expires_at
        },
        { status: 400 }
      )
    }

    // 7. Update politician verification status
    const nowIso = now.toISOString()

    const { error: updatePoliticianError } = await supabase
      .from('politicians')
      .update({
        is_verified: true,
        verified_at: nowIso,
        verified_by: user.id,
        updated_at: nowIso
      })
      .eq('id', verificationRequest.politician_id)

    if (updatePoliticianError) {
      console.error('[Verification Confirm] Politician update error:', updatePoliticianError)
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: '정치인 검증 상태 업데이트 중 오류가 발생했습니다.',
          details: updatePoliticianError.message
        },
        { status: 500 }
      )
    }

    // 8. Update verification request status
    const { error: updateRequestError } = await supabase
      .from('politician_verification')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: nowIso,
        updated_at: nowIso
      })
      .eq('id', validated.request_id)

    if (updateRequestError) {
      console.error('[Verification Confirm] Request update error:', updateRequestError)
      // Don't fail the request since politician is already verified
      // This is a secondary update
    }

    // 9. Get updated politician data
    const { data: politician } = await supabase
      .from('politicians')
      .select('id, name, is_verified, verified_at')
      .eq('id', verificationRequest.politician_id)
      .single()

    // 10. Return success response
    return NextResponse.json(
      {
        success: true,
        message: '검증이 완료되었습니다. "Verified" 배지가 부여되었습니다.',
        data: {
          politician_id: verificationRequest.politician_id,
          politician_name: politician?.name,
          is_verified: true,
          verified_at: nowIso,
          request_id: validated.request_id
        }
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: '입력 데이터가 유효하지 않습니다.',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('[Verification Confirm] Unexpected error:', error)
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
