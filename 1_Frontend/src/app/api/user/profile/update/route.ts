// P3BA1: Real API - 회원
/**
 * Project Grid Task ID: P3BA1
 * 작업명: 사용자 프로필 수정 API (Real - Supabase)
 * 생성시간: 2025-11-07
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P2D1, P1BA1
 * 설명: Supabase users 테이블 실제 연동
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Request Schema (Zod)
// ============================================================================
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar_url: z.string().url().nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  location: z.string().max(100).nullable().optional(),
});

type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

// ============================================================================
// PUT /api/user/profile/update
// ============================================================================
/**
 * 사용자 프로필 수정 API (Real - Supabase)
 *
 * @description Phase 3: users 테이블 프로필 수정
 * @route PUT /api/user/profile/update
 * @access Private (requires authentication)
 *
 * @param {string} [name] - 사용자 이름
 * @param {string} [avatar_url] - 프로필 이미지 URL
 * @param {string} [bio] - 자기소개
 * @param {string} [location] - 위치
 *
 * @returns {200} { success: true, data: { user, message } }
 * @returns {400} { success: false, error: { code, message, details } }
 * @returns {401} { success: false, error: { code, message } } - 인증 실패
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Supabase Client Connection
    const supabase = await createClient();

    // 2. Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '인증이 필요합니다.',
          },
        },
        { status: 401 }
      );
    }

    // 3. Request Body Parsing
    const body = await request.json();

    // 4. Input Validation (Zod)
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력 데이터가 올바르지 않습니다.',
            details: validationResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const data: UpdateProfileRequest = validationResult.data;

    // 5. Check if there are any fields to update
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_FIELDS_TO_UPDATE',
            message: '수정할 필드가 없습니다.',
          },
        },
        { status: 400 }
      );
    }

    // 6. Update user profile in users table
    // Note: users 테이블의 PK는 'user_id'
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', authUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('[프로필 수정 API] 오류:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROFILE_UPDATE_FAILED',
            message: '프로필 수정에 실패했습니다.',
            details: updateError.message,
          },
        },
        { status: 500 }
      );
    }

    console.log('[프로필 수정 API] 수정 완료:', authUser.id);

    // 7. Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: updatedProfile.user_id,
            email: updatedProfile.email,
            name: updatedProfile.name || updatedProfile.nickname,
            avatar_url: updatedProfile.avatar_url || updatedProfile.profile_image_url,
            role: updatedProfile.role,
            points: updatedProfile.points,
            level: updatedProfile.level,
            bio: updatedProfile.bio,
            location: updatedProfile.location,
            updated_at: updatedProfile.updated_at,
          },
          message: '프로필이 수정되었습니다.',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[프로필 수정 API] 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/user/profile/update (alias for PUT)
// ============================================================================
export { PUT as PATCH };

// ============================================================================
// OPTIONS /api/user/profile/update
// ============================================================================
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
