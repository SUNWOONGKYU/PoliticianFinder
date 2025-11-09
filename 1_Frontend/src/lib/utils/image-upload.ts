// P4BA3: 이미지 업로드 헬퍼
// 작업일: 2025-11-09
// 설명: Supabase Storage 이미지 업로드 유틸 (Sharp 리사이징 포함)

import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

// ============================================================================
// 상수 정의
// ============================================================================

/**
 * 허용된 이미지 포맷 및 MIME 타입
 */
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/**
 * 최대 파일 크기: 5MB
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * 이미지 리사이징 규격
 */
export const IMAGE_SIZES = {
  thumbnail: { width: 200, height: 200 },
  medium: { width: 800, height: 800 },
  large: { width: 1200, height: 1200 },
} as const;

/**
 * Storage 버킷 경로 템플릿
 */
export const STORAGE_PATHS = {
  avatars: (userId: string) => `avatars/${userId}/`,
  politicianImages: (politicianId: string) => `politician-images/${politicianId}/`,
} as const;

// ============================================================================
// 타입 정의
// ============================================================================

export type ImageFormat = (typeof ALLOWED_FORMATS)[number];
export type ImageSize = keyof typeof IMAGE_SIZES;

export interface ImageUploadOptions {
  /**
   * 업로드할 이미지 파일 (Buffer 또는 File)
   */
  file: Buffer | File;

  /**
   * 저장할 버킷 이름 (예: 'avatars', 'politician-images')
   */
  bucket: string;

  /**
   * 저장 경로 (예: 'avatars/user123/', 'politician-images/pol456/')
   */
  path: string;

  /**
   * 파일명 (확장자 제외)
   */
  filename: string;

  /**
   * 리사이징할 크기 목록 (기본값: ['thumbnail', 'medium', 'large'])
   */
  sizes?: ImageSize[];

  /**
   * 원본 이미지 저장 여부 (기본값: true)
   */
  keepOriginal?: boolean;
}

export interface UploadedImage {
  /**
   * 이미지 크기 (original, thumbnail, medium, large)
   */
  size: ImageSize | 'original';

  /**
   * 저장된 파일의 전체 경로
   */
  path: string;

  /**
   * 공개 URL
   */
  url: string;

  /**
   * 파일 크기 (bytes)
   */
  fileSize: number;

  /**
   * 이미지 가로 크기
   */
  width: number;

  /**
   * 이미지 세로 크기
   */
  height: number;
}

export interface ImageUploadResult {
  /**
   * 성공 여부
   */
  success: boolean;

  /**
   * 업로드된 이미지 목록
   */
  images: UploadedImage[];

  /**
   * 에러 메시지 (실패 시)
   */
  error?: string;

  /**
   * 에러 코드 (실패 시)
   */
  code?: string;
}

// ============================================================================
// Supabase 클라이언트 초기화
// ============================================================================

/**
 * 서버 환경에서 사용할 Supabase 클라이언트
 * (환경변수 기반)
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 파일이 허용된 이미지 형식인지 확인
 */
function isAllowedImageFormat(file: Buffer | File): boolean {
  if (file instanceof File) {
    return ALLOWED_MIME_TYPES.includes(file.type as any);
  }

  // Buffer의 경우 매직 넘버로 확인
  const magicNumbers = {
    jpg: [0xff, 0xd8, 0xff],
    png: [0x89, 0x50, 0x4e, 0x47],
    gif: [0x47, 0x49, 0x46],
    webp: [0x52, 0x49, 0x46, 0x46],
  };

  for (const [format, signature] of Object.entries(magicNumbers)) {
    const matches = signature.every((byte, index) => file[index] === byte);
    if (matches) return true;
  }

  return false;
}

/**
 * 파일 크기 확인
 */
function isFileSizeValid(file: Buffer | File): boolean {
  const size = file instanceof File ? file.size : file.length;
  return size <= MAX_FILE_SIZE;
}

/**
 * File 객체를 Buffer로 변환
 */
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * 이미지 메타데이터 추출
 */
async function getImageMetadata(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
  };
}

/**
 * 파일명 생성 (타임스탬프 + 랜덤 문자열)
 */
function generateUniqueFilename(originalName: string, size?: ImageSize): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const suffix = size ? `_${size}` : '';
  return `${originalName}${suffix}_${timestamp}_${random}`;
}

// ============================================================================
// 이미지 처리 함수
// ============================================================================

/**
 * 이미지 리사이징 및 최적화
 */
async function resizeImage(
  buffer: Buffer,
  size: ImageSize
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const { width, height } = IMAGE_SIZES[size];

  const resized = await sharp(buffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 85 })
    .toBuffer();

  return { buffer: resized, width, height };
}

/**
 * 원본 이미지 최적화 (리사이징 없이)
 */
async function optimizeImage(buffer: Buffer): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
}> {
  const metadata = await sharp(buffer).metadata();

  const optimized = await sharp(buffer)
    .jpeg({ quality: 90 })
    .toBuffer();

  return {
    buffer: optimized,
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

// ============================================================================
// Storage 업로드 함수
// ============================================================================

/**
 * Supabase Storage에 이미지 업로드
 */
async function uploadToStorage(
  bucket: string,
  path: string,
  filename: string,
  buffer: Buffer
): Promise<{ path: string; url: string }> {
  const supabase = getSupabaseClient();
  const fullPath = `${path}${filename}.jpg`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fullPath, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage 업로드 실패: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(fullPath);

  return { path: fullPath, url: publicUrl };
}

// ============================================================================
// 메인 업로드 함수
// ============================================================================

/**
 * 이미지 업로드 및 리사이징
 *
 * @param options 업로드 옵션
 * @returns 업로드 결과
 *
 * @example
 * ```typescript
 * const result = await uploadImage({
 *   file: imageFile,
 *   bucket: 'avatars',
 *   path: 'avatars/user123/',
 *   filename: 'profile',
 *   sizes: ['thumbnail', 'medium'],
 *   keepOriginal: true,
 * });
 *
 * if (result.success) {
 *   console.log('업로드된 이미지:', result.images);
 * }
 * ```
 */
export async function uploadImage(
  options: ImageUploadOptions
): Promise<ImageUploadResult> {
  try {
    const {
      file,
      bucket,
      path,
      filename,
      sizes = ['thumbnail', 'medium', 'large'],
      keepOriginal = true,
    } = options;

    // ========================================================================
    // 1. 파일 유효성 검증
    // ========================================================================

    if (!isAllowedImageFormat(file)) {
      return {
        success: false,
        images: [],
        error: '허용되지 않은 이미지 형식입니다. (jpg, jpeg, png, webp, gif만 허용)',
        code: 'INVALID_FORMAT',
      };
    }

    if (!isFileSizeValid(file)) {
      return {
        success: false,
        images: [],
        error: '파일 크기가 5MB를 초과합니다.',
        code: 'FILE_TOO_LARGE',
      };
    }

    // ========================================================================
    // 2. Buffer 변환
    // ========================================================================

    const buffer = file instanceof File ? await fileToBuffer(file) : file;

    // ========================================================================
    // 3. 이미지 처리 및 업로드
    // ========================================================================

    const uploadedImages: UploadedImage[] = [];

    // 원본 이미지 업로드
    if (keepOriginal) {
      const { buffer: optimizedBuffer, width, height } = await optimizeImage(buffer);
      const uniqueFilename = generateUniqueFilename(filename);
      const { path: storagePath, url } = await uploadToStorage(
        bucket,
        path,
        uniqueFilename,
        optimizedBuffer
      );

      uploadedImages.push({
        size: 'original',
        path: storagePath,
        url,
        fileSize: optimizedBuffer.length,
        width,
        height,
      });
    }

    // 리사이징된 이미지 업로드
    for (const size of sizes) {
      const { buffer: resizedBuffer, width, height } = await resizeImage(buffer, size);
      const uniqueFilename = generateUniqueFilename(filename, size);
      const { path: storagePath, url } = await uploadToStorage(
        bucket,
        path,
        uniqueFilename,
        resizedBuffer
      );

      uploadedImages.push({
        size,
        path: storagePath,
        url,
        fileSize: resizedBuffer.length,
        width,
        height,
      });
    }

    return {
      success: true,
      images: uploadedImages,
    };
  } catch (error) {
    console.error('이미지 업로드 중 에러:', error);

    return {
      success: false,
      images: [],
      error: error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.',
      code: 'UPLOAD_ERROR',
    };
  }
}

// ============================================================================
// 삭제 함수
// ============================================================================

/**
 * Storage에서 이미지 삭제
 *
 * @param bucket 버킷 이름
 * @param paths 삭제할 파일 경로 목록
 * @returns 삭제 결과
 */
export async function deleteImages(
  bucket: string,
  paths: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      throw new Error(`이미지 삭제 실패: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('이미지 삭제 중 에러:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.',
    };
  }
}

/**
 * 특정 경로의 모든 이미지 삭제
 *
 * @param bucket 버킷 이름
 * @param path 삭제할 경로
 * @returns 삭제 결과
 */
export async function deleteImagesInPath(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // 해당 경로의 파일 목록 조회
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list(path);

    if (listError) {
      throw new Error(`파일 목록 조회 실패: ${listError.message}`);
    }

    if (!files || files.length === 0) {
      return { success: true };
    }

    // 파일 경로 생성
    const filePaths = files.map((file) => `${path}${file.name}`);

    // 삭제 실행
    return await deleteImages(bucket, filePaths);
  } catch (error) {
    console.error('경로 내 이미지 삭제 중 에러:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.',
    };
  }
}

// ============================================================================
// 편의 함수
// ============================================================================

/**
 * 사용자 아바타 업로드
 */
export async function uploadUserAvatar(
  userId: string,
  file: Buffer | File
): Promise<ImageUploadResult> {
  return uploadImage({
    file,
    bucket: 'avatars',
    path: STORAGE_PATHS.avatars(userId),
    filename: 'avatar',
    sizes: ['thumbnail', 'medium'],
    keepOriginal: false,
  });
}

/**
 * 정치인 이미지 업로드
 */
export async function uploadPoliticianImage(
  politicianId: string,
  file: Buffer | File
): Promise<ImageUploadResult> {
  return uploadImage({
    file,
    bucket: 'politician-images',
    path: STORAGE_PATHS.politicianImages(politicianId),
    filename: 'photo',
    sizes: ['thumbnail', 'medium', 'large'],
    keepOriginal: true,
  });
}

// ============================================================================
// 완료
// ============================================================================
// P4BA3: 이미지 업로드 헬퍼 완료
//
// 생성된 내용:
// - 이미지 업로드 함수 (리사이징 포함)
// - Sharp를 이용한 이미지 최적화
// - Supabase Storage 연결
// - 이미지 삭제 함수
// - 편의 함수 (아바타, 정치인 이미지)
//
// 사용 예시:
// import { uploadImage, uploadUserAvatar } from '@/lib/utils/image-upload';
//
// const result = await uploadUserAvatar('user123', imageFile);
// if (result.success) {
//   console.log('업로드 완료:', result.images);
// }
