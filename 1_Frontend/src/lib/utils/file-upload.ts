/**
 * Project Grid Task ID: P4BA4
 * 작업명: 파일 업로드 헬퍼
 * 생성시간: 2025-11-09
 * 생성자: Claude Code (api-designer)
 * 의존성: P2D1
 * 설명: 게시글 첨부파일 업로드 처리를 위한 헬퍼 함수
 */

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// =============================================
// 타입 정의
// =============================================

/**
 * 허용 파일 타입 카테고리
 */
export enum FileCategory {
  DOCUMENT = 'document',
  IMAGE = 'image',
  ARCHIVE = 'archive',
}

/**
 * 파일 업로드 옵션
 */
export interface FileUploadOptions {
  userId: string;
  postId: string;
  file: File;
}

/**
 * 파일 업로드 결과
 */
export interface FileUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  code?: string;
}

/**
 * 파일 검증 결과
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
  category?: FileCategory;
}

// =============================================
// 상수 정의
// =============================================

/**
 * 허용 파일 타입 및 최대 크기 설정
 */
const FILE_TYPE_CONFIG = {
  [FileCategory.DOCUMENT]: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    extensions: ['pdf', 'doc', 'docx', 'txt'],
    maxSize: 10 * 1024 * 1024, // 10MB
    label: '문서',
  },
  [FileCategory.IMAGE]: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    label: '이미지',
  },
  [FileCategory.ARCHIVE]: {
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-zip-compressed'],
    extensions: ['zip', 'rar'],
    maxSize: 20 * 1024 * 1024, // 20MB
    label: '압축파일',
  },
};

/**
 * Supabase Storage 버킷 이름
 */
const STORAGE_BUCKET = 'attachments';

/**
 * 에러 코드 정의
 */
export const ERROR_CODES = {
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  INVALID_PARAMS: 'INVALID_PARAMS',
  STORAGE_ERROR: 'STORAGE_ERROR',
} as const;

// =============================================
// Supabase 클라이언트 초기화
// =============================================

/**
 * Supabase 클라이언트 생성 (서버 사이드용)
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// =============================================
// 유틸리티 함수
// =============================================

/**
 * 파일 확장자 추출
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * 파일 카테고리 판별
 */
export function getFileCategory(mimeType: string, extension: string): FileCategory | null {
  for (const [category, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if (
      config.mimeTypes.includes(mimeType) ||
      config.extensions.includes(extension.toLowerCase())
    ) {
      return category as FileCategory;
    }
  }
  return null;
}

/**
 * 안전한 파일명 생성 (특수문자 제거, 타임스탬프 추가)
 */
export function generateSafeFilename(originalName: string): string {
  const extension = getFileExtension(originalName);
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;

  // 특수문자 제거 및 공백을 언더스코어로 변경
  const safeName = nameWithoutExt
    .replace(/[^a-zA-Z0-9가-힣_\-]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 50); // 이름 길이 제한

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  return `${safeName}_${timestamp}_${random}.${extension}`;
}

/**
 * Storage 경로 생성: attachments/{userId}/{postId}/
 */
export function generateStoragePath(userId: string, postId: string, filename: string): string {
  return `${userId}/${postId}/${filename}`;
}

// =============================================
// 검증 함수
// =============================================

/**
 * Zod 스키마: 파일 업로드 파라미터 검증
 */
const uploadParamsSchema = z.object({
  userId: z.string().uuid('유효하지 않은 사용자 ID'),
  postId: z.string().uuid('유효하지 않은 게시글 ID'),
  file: z.custom<File>((val) => val instanceof File, '유효하지 않은 파일'),
});

/**
 * 파일 타입 및 크기 검증
 */
export function validateFile(file: File): FileValidationResult {
  const extension = getFileExtension(file.name);
  const mimeType = file.type;
  const category = getFileCategory(mimeType, extension);

  // 1. 파일 타입 검증
  if (!category) {
    return {
      valid: false,
      error: `지원하지 않는 파일 형식입니다. 허용 형식: ${Object.values(FILE_TYPE_CONFIG)
        .map((c) => c.extensions.join(', '))
        .join(' | ')}`,
      code: ERROR_CODES.INVALID_FILE_TYPE,
    };
  }

  const config = FILE_TYPE_CONFIG[category];

  // 2. MIME 타입 체크
  if (!config.mimeTypes.includes(mimeType) && !config.extensions.includes(extension)) {
    return {
      valid: false,
      error: `${config.label} 파일 형식이 올바르지 않습니다`,
      code: ERROR_CODES.INVALID_FILE_TYPE,
    };
  }

  // 3. 파일 크기 체크
  if (file.size > config.maxSize) {
    const maxSizeMB = config.maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `${config.label} 파일 크기가 ${maxSizeMB}MB를 초과합니다 (현재: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
      code: ERROR_CODES.FILE_TOO_LARGE,
    };
  }

  return {
    valid: true,
    category,
  };
}

// =============================================
// 메인 업로드 함수
// =============================================

/**
 * 파일 업로드 메인 함수
 *
 * @param options - 업로드 옵션 (userId, postId, file)
 * @returns 업로드 결과 (성공 시 url, path 포함)
 *
 * @example
 * ```typescript
 * const result = await uploadPostAttachment({
 *   userId: 'user-uuid',
 *   postId: 'post-uuid',
 *   file: fileObject
 * });
 *
 * if (result.success) {
 *   console.log('업로드 URL:', result.url);
 * } else {
 *   console.error('업로드 실패:', result.error);
 * }
 * ```
 */
export async function uploadPostAttachment(
  options: FileUploadOptions
): Promise<FileUploadResult> {
  try {
    // 1. 파라미터 검증
    const validation = uploadParamsSchema.safeParse(options);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0].message,
        code: ERROR_CODES.INVALID_PARAMS,
      };
    }

    const { userId, postId, file } = options;

    // 2. 파일 검증
    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      return {
        success: false,
        error: fileValidation.error,
        code: fileValidation.code,
      };
    }

    // 3. 안전한 파일명 생성
    const safeFilename = generateSafeFilename(file.name);
    const storagePath = generateStoragePath(userId, postId, safeFilename);

    // 4. Supabase Storage에 업로드
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false, // 같은 이름 파일 덮어쓰기 방지
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return {
        success: false,
        error: `파일 업로드 실패: ${error.message}`,
        code: ERROR_CODES.STORAGE_ERROR,
      };
    }

    // 5. Public URL 생성
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: storagePath,
    };
  } catch (error) {
    console.error('Unexpected upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      code: ERROR_CODES.UPLOAD_FAILED,
    };
  }
}

/**
 * 다중 파일 업로드
 *
 * @param options - 업로드 옵션 배열
 * @returns 각 파일의 업로드 결과 배열
 */
export async function uploadMultipleAttachments(
  userId: string,
  postId: string,
  files: File[]
): Promise<FileUploadResult[]> {
  const uploadPromises = files.map((file) =>
    uploadPostAttachment({ userId, postId, file })
  );

  return Promise.all(uploadPromises);
}

/**
 * 파일 삭제
 *
 * @param path - Storage 경로
 * @returns 삭제 성공 여부
 */
export async function deleteAttachment(path: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) {
      console.error('File deletion error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected deletion error:', error);
    return false;
  }
}

/**
 * 게시글의 모든 첨부파일 삭제
 *
 * @param userId - 사용자 ID
 * @param postId - 게시글 ID
 * @returns 삭제 성공 여부
 */
export async function deletePostAttachments(userId: string, postId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const folderPath = `${userId}/${postId}`;

    // 폴더 내 모든 파일 목록 조회
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folderPath);

    if (listError || !files || files.length === 0) {
      return true; // 파일이 없으면 성공으로 간주
    }

    // 모든 파일 경로 생성
    const filePaths = files.map((file) => `${folderPath}/${file.name}`);

    // 일괄 삭제
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths);

    if (deleteError) {
      console.error('Batch deletion error:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected deletion error:', error);
    return false;
  }
}

// =============================================
// 유틸리티 익스포트
// =============================================

/**
 * 파일 타입 설정 조회 (읽기 전용)
 */
export function getFileTypeConfig() {
  return FILE_TYPE_CONFIG;
}

/**
 * 허용된 파일 확장자 목록 반환
 */
export function getAllowedExtensions(): string[] {
  return Object.values(FILE_TYPE_CONFIG).flatMap((config) => config.extensions);
}

/**
 * 허용된 MIME 타입 목록 반환
 */
export function getAllowedMimeTypes(): string[] {
  return Object.values(FILE_TYPE_CONFIG).flatMap((config) => config.mimeTypes);
}

/**
 * 카테고리별 최대 파일 크기 반환 (MB 단위)
 */
export function getMaxFileSizeMB(category: FileCategory): number {
  return FILE_TYPE_CONFIG[category].maxSize / (1024 * 1024);
}
