// P4BA18: Verification Request API
// Description: Request politician verification with official email

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VerificationEmailSender } from '@/lib/verification/email-sender'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const verificationRequestSchema = z.object({
  politician_id: z.string().uuid('유효하지 않은 정치인 ID입니다.'),
  official_email: z
    .string()
    .email('유효하지 않은 이메일 주소입니다.')
    .refine(
      (email) => {
        const domain = email.split('@')[1]
        const allowedDomains = ['go.kr', 'assembly.go.kr', 'korea.kr']
        return allowedDomains.some(allowed => domain?.endsWith(allowed))
      },
      { message: '공직 이메일 주소만 사용 가능합니다. (*.go.kr, *.assembly.go.kr, *.korea.kr)' }
    ),
  documents: z.array(z.string().url()).optional(),
  notes: z.string().max(1000).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // 1. User authentication check
    const supabase = createClient()
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
    const validated = verificationRequestSchema.parse(body)

    // 3. Check if politician exists and is not already verified
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id, name, is_verified, verified_at')
      .eq('id', validated.politician_id)
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

    if (politician.is_verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Already verified',
          message: '이미 검증된 정치인입니다.',
          verified_at: politician.verified_at
        },
        { status: 400 }
      )
    }

    // 4. Check for pending verification requests
    const { data: existingRequest } = await supabase
      .from('politician_verification')
      .select('id, status, created_at')
      .eq('politician_id', validated.politician_id)
      .eq('user_id', user.id)
      .in('status', ['pending', 'reviewing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request exists',
          message: '이미 처리 중인 검증 요청이 있습니다.',
          request_id: existingRequest.id,
          status: existingRequest.status,
          created_at: existingRequest.created_at
        },
        { status: 400 }
      )
    }

    // 5. Generate 6-digit verification code (uppercase alphanumeric)
    const verificationCode = nanoid(6).toUpperCase()

    // 6. Set expiration time (15 minutes from now)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    // 7. Insert verification request into database
    const { data: verificationRequest, error: insertError } = await supabase
      .from('politician_verification')
      .insert({
        politician_id: validated.politician_id,
        user_id: user.id,
        verification_method: 'email',
        verification_token: verificationCode,
        token_expires_at: expiresAt.toISOString(),
        submitted_documents: validated.documents || [],
        notes: validated.notes || null,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Verification Request] Database insert error:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: '검증 요청 생성 중 오류가 발생했습니다.',
          details: insertError.message
        },
        { status: 500 }
      )
    }

    // 8. Send verification email
    try {
      const emailSender = new VerificationEmailSender()
      await emailSender.sendVerificationEmail(
        validated.official_email,
        politician.name,
        verificationCode
      )
    } catch (emailError) {
      console.error('[Verification Request] Email send error:', emailError)
      // Don't fail the request if email fails, but log it
      // The admin can manually verify or resend
    }

    // 9. Return success response
    return NextResponse.json(
      {
        success: true,
        message: '인증 코드가 이메일로 발송되었습니다. 15분 내에 인증 코드를 입력해주세요.',
        data: {
          request_id: verificationRequest.id,
          politician_id: validated.politician_id,
          email: validated.official_email,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        }
      },
      { status: 201 }
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

    console.error('[Verification Request] Unexpected error:', error)
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
