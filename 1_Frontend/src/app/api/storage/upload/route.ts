// P4BA3: 이미지 업로드 API 엔드포인트 (예시)
// 작업일: 2025-11-09
// 설명: Supabase Storage 이미지 업로드 API

import { NextRequest, NextResponse } from 'next/server';
import { uploadImage, uploadUserAvatar } from '@/lib/utils/image-upload';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/storage/upload
 *
 * 이미지 업로드 API
 *
 * @body {FormData} - file, bucket, path, filename
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
    const bucket = formData.get('bucket') as string;
    const path = formData.get('path') as string;
    const filename = formData.get('filename') as string;
    const uploadType = formData.get('uploadType') as string; // 'avatar' | 'politician' | 'custom'

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 필요합니다.', code: 'FILE_REQUIRED' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 3. 업로드 타입에 따라 처리
    // ========================================================================
    let result;

    if (uploadType === 'avatar') {
      // 사용자 아바타 업로드
      result = await uploadUserAvatar(user.id, file);
    } else if (uploadType === 'politician') {
      // 정치인 이미지 업로드
      if (!filename) {
        return NextResponse.json(
          { success: false, error: '정치인 ID가 필요합니다.', code: 'POLITICIAN_ID_REQUIRED' },
          { status: 400 }
        );
      }

      const { uploadPoliticianImage } = await import('@/lib/utils/image-upload');
      result = await uploadPoliticianImage(filename, file);
    } else {
      // 커스텀 업로드
      if (!bucket || !path || !filename) {
        return NextResponse.json(
          { success: false, error: '필수 파라미터가 누락되었습니다.', code: 'MISSING_PARAMS' },
          { status: 400 }
        );
      }

      result = await uploadImage({
        file,
        bucket,
        path,
        filename,
      });
    }

    // ========================================================================
    // 4. 응답
    // ========================================================================
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      images: result.images,
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
