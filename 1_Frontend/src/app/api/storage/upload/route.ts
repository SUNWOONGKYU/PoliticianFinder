// P4BA3: 이미지 업로드 API 엔드포인트
// 작업일: 2025-11-09
// 수정일: 2025-12-14 - Vercel 서버리스 환경 호환 (sharp 제거)
// 설명: Supabase Storage 이미지 업로드 API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 허용된 이미지 형식
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

// 최대 파일 크기: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/storage/upload
 *
 * 이미지 업로드 API (Vercel 서버리스 호환)
 *
 * @body {FormData} - file, uploadType
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // 1. 인증 확인
    // ========================================================================
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // ========================================================================
    // 2. FormData 파싱
    // ========================================================================
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('uploadType') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 필요합니다.', code: 'FILE_REQUIRED' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 3. 파일 유효성 검증
    // ========================================================================
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '허용되지 않은 이미지 형식입니다.', code: 'INVALID_FORMAT' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: '파일 크기가 5MB를 초과합니다.', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 4. 직접 Supabase Storage에 업로드 (sharp 없이)
    // ========================================================================
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'jpg';

    let bucket = 'avatars';
    let filePath = '';

    if (uploadType === 'avatar') {
      bucket = 'avatars';
      filePath = `avatars/${user.id}/avatar_${timestamp}_${random}.${ext}`;
    } else if (uploadType === 'politician') {
      bucket = 'politician-images';
      const politicianId = formData.get('filename') as string || 'unknown';
      filePath = `politician-images/${politicianId}/photo_${timestamp}_${random}.${ext}`;
    } else {
      bucket = 'avatars';
      filePath = `uploads/${user.id}/${timestamp}_${random}.${ext}`;
    }

    // File을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Supabase Storage에 업로드
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: `업로드 실패: ${uploadError.message}`, code: 'UPLOAD_ERROR' },
        { status: 400 }
      );
    }

    // Public URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    // ========================================================================
    // 5. 응답
    // ========================================================================
    return NextResponse.json({
      success: true,
      images: [
        {
          size: 'medium',
          path: filePath,
          url: publicUrl,
        }
      ],
      message: '이미지가 성공적으로 업로드되었습니다.',
    });
  } catch (error) {
    console.error('이미지 업로드 API 에러:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/storage/upload
 *
 * 이미지 삭제 API
 *
 * @body {bucket, paths}
 */
export async function DELETE(request: NextRequest) {
  try {
    // ========================================================================
    // 1. 인증 확인
    // ========================================================================
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // ========================================================================
    // 2. Request Body 파싱
    // ========================================================================
    const body = await request.json();
    const { bucket, paths } = body;

    if (!bucket || !paths || !Array.isArray(paths)) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.', code: 'MISSING_PARAMS' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 3. 이미지 삭제
    // ========================================================================
    const { deleteImages } = await import('@/lib/utils/image-upload');
    const result = await deleteImages(bucket, paths);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, code: 'DELETE_ERROR' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '이미지가 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('이미지 삭제 API 에러:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// API 엔드포인트 완료
// ============================================================================
// P4BA3: 이미지 업로드 API 엔드포인트 완료
//
// 엔드포인트:
// - POST /api/storage/upload - 이미지 업로드
// - DELETE /api/storage/upload - 이미지 삭제
//
// 사용 예시:
// const formData = new FormData();
// formData.append('file', imageFile);
// formData.append('uploadType', 'avatar');
//
// const response = await fetch('/api/storage/upload', {
//   method: 'POST',
//   body: formData,
// });
