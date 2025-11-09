/**
 * Project Grid Task ID: P4BA4
 * API Route: POST /api/posts/attachments
 * 설명: 게시글 첨부파일 업로드 API (예제)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  uploadPostAttachment,
  uploadMultipleAttachments,
  validateFile,
  ERROR_CODES,
} from '@/lib/utils/file-upload';
import { z } from 'zod';

// =============================================
// Request Schema
// =============================================

const uploadRequestSchema = z.object({
  userId: z.string().uuid(),
  postId: z.string().uuid(),
});

// =============================================
// API Handler
// =============================================

/**
 * POST /api/posts/attachments
 * 게시글 첨부파일 업로드
 *
 * @example Request (multipart/form-data)
 * ```
 * FormData:
 * - userId: "550e8400-e29b-41d4-a716-446655440000"
 * - postId: "660e8400-e29b-41d4-a716-446655440000"
 * - file: File (단일 파일)
 * - files: File[] (다중 파일)
 * ```
 *
 * @example Response (Success - 단일 파일)
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "url": "https://ooddlafwdpzgxfefgsrx.supabase.co/storage/v1/object/public/attachments/...",
 *     "path": "550e8400-e29b-41d4-a716-446655440000/660e8400-e29b-41d4-a716-446655440000/document_1699123456789_abc123.pdf"
 *   }
 * }
 * ```
 *
 * @example Response (Success - 다중 파일)
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "uploads": [
 *       {
 *         "success": true,
 *         "url": "https://...",
 *         "path": "..."
 *       },
 *       {
 *         "success": true,
 *         "url": "https://...",
 *         "path": "..."
 *       }
 *     ],
 *     "successCount": 2,
 *     "failureCount": 0
 *   }
 * }
 * ```
 *
 * @example Response (Error)
 * ```json
 * {
 *   "success": false,
 *   "error": "파일 크기가 10MB를 초과합니다",
 *   "code": "FILE_TOO_LARGE"
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // 1. FormData 파싱
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const postId = formData.get('postId') as string;

    // 2. 파라미터 검증
    const validation = uploadRequestSchema.safeParse({ userId, postId });
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 요청 파라미터',
          code: ERROR_CODES.INVALID_PARAMS,
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    // 3. 파일 추출
    const singleFile = formData.get('file') as File | null;
    const multipleFiles = formData.getAll('files') as File[];

    // 단일 파일 업로드
    if (singleFile && singleFile instanceof File) {
      // 파일 검증
      const fileValidation = validateFile(singleFile);
      if (!fileValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: fileValidation.error,
            code: fileValidation.code,
          },
          { status: 400 }
        );
      }

      // 업로드 실행
      const result = await uploadPostAttachment({
        userId,
        postId,
        file: singleFile,
      });

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            code: result.code,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            url: result.url,
            path: result.path,
          },
        },
        { status: 201 }
      );
    }

    // 다중 파일 업로드
    if (multipleFiles.length > 0) {
      // 각 파일 검증
      const invalidFiles: string[] = [];
      for (const file of multipleFiles) {
        const fileValidation = validateFile(file);
        if (!fileValidation.valid) {
          invalidFiles.push(`${file.name}: ${fileValidation.error}`);
        }
      }

      if (invalidFiles.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: '일부 파일이 유효하지 않습니다',
            code: ERROR_CODES.INVALID_FILE_TYPE,
            details: invalidFiles,
          },
          { status: 400 }
        );
      }

      // 업로드 실행
      const results = await uploadMultipleAttachments(userId, postId, multipleFiles);

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      return NextResponse.json(
        {
          success: failureCount === 0,
          data: {
            uploads: results,
            successCount,
            failureCount,
          },
        },
        { status: failureCount === 0 ? 201 : 207 } // 207 Multi-Status
      );
    }

    // 파일이 없는 경우
    return NextResponse.json(
      {
        success: false,
        error: '업로드할 파일이 없습니다',
        code: ERROR_CODES.INVALID_PARAMS,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('File upload API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다',
        code: ERROR_CODES.UPLOAD_FAILED,
      },
      { status: 500 }
    );
  }
}

// =============================================
// API Metadata
// =============================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
