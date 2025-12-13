// Profile API - 프로필 조회 및 수정
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/helpers";

// 프로필 업데이트 스키마
const updateProfileSchema = z.object({
  nickname: z.string().min(2).max(20).optional(),
  bio: z.string().max(200).optional(),
  preferred_district: z.string().max(100).optional(),
  // profile_image_url은 Supabase Storage URL을 허용해야 하므로 .url() 제거
  profile_image_url: z.string().optional(),
});

/**
 * GET /api/profile
 * 현재 로그인한 사용자의 프로필 조회
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return NextResponse.json(
        { success: false, error: "프로필 조회에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('GET /api/profile error:', error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * 현재 로그인한 사용자의 프로필 수정
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    const supabase = await createClient();

    // 업데이트할 데이터 구성
    const updateData: Record<string, any> = {};
    if (validated.nickname !== undefined) {
      updateData.name = validated.nickname;
      updateData.nickname = validated.nickname;
    }
    if (validated.bio !== undefined) {
      updateData.bio = validated.bio;
    }
    if (validated.preferred_district !== undefined) {
      updateData.preferred_district = validated.preferred_district;
    }
    if (validated.profile_image_url !== undefined) {
      updateData.profile_image_url = validated.profile_image_url;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "수정할 내용이 없습니다" },
        { status: 400 }
      );
    }

    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json(
        { success: false, error: "프로필 수정에 실패했습니다", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: "프로필이 수정되었습니다",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "입력 데이터가 올바르지 않습니다", details: error.errors },
        { status: 400 }
      );
    }
    console.error('PATCH /api/profile error:', error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
