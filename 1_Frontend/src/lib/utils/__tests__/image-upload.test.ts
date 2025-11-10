// P4BA3: 이미지 업로드 헬퍼 테스트
// 작업일: 2025-11-09

import {
  uploadImage,
  uploadUserAvatar,
  uploadPoliticianImage,
  deleteImages,
  deleteImagesInPath,
  IMAGE_SIZES,
  STORAGE_PATHS,
} from '../image-upload';

// Mock dependencies
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image')),
    metadata: jest.fn().mockResolvedValue({
      width: 1000,
      height: 1000,
      format: 'jpeg',
    }),
  }));
});

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test/path/image.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://example.com/test/path/image.jpg' },
        })),
        remove: jest.fn().mockResolvedValue({ error: null }),
        list: jest.fn().mockResolvedValue({
          data: [{ name: 'image1.jpg' }, { name: 'image2.jpg' }],
          error: null,
        }),
      })),
    },
  })),
}));

describe('image-upload 유틸리티', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 환경변수 설정
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  describe('상수 정의', () => {
    it('IMAGE_SIZES가 올바르게 정의되어 있어야 함', () => {
      expect(IMAGE_SIZES).toEqual({
        thumbnail: { width: 200, height: 200 },
        medium: { width: 800, height: 800 },
        large: { width: 1200, height: 1200 },
      });
    });

    it('STORAGE_PATHS가 올바르게 정의되어 있어야 함', () => {
      expect(STORAGE_PATHS.avatars('user123')).toBe('avatars/user123/');
      expect(STORAGE_PATHS.politicianImages('pol456')).toBe('politician-images/pol456/');
    });
  });

  describe('uploadImage 함수', () => {
    it('유효한 이미지 파일을 업로드해야 함', async () => {
      const mockFile = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG magic number

      const result = await uploadImage({
        file: mockFile,
        bucket: 'avatars',
        path: 'avatars/user123/',
        filename: 'profile',
        sizes: ['thumbnail'],
        keepOriginal: false,
      });

      expect(result.success).toBe(true);
      expect(result.images).toHaveLength(1);
      expect(result.images[0].size).toBe('thumbnail');
    });

    it('파일 크기가 5MB를 초과하면 에러를 반환해야 함', async () => {
      // Issue #5: Use valid JPEG header so type validation passes and size validation runs
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const padding = Buffer.alloc(6 * 1024 * 1024 - jpegHeader.length); // 6MB total
      const largeFile = Buffer.concat([jpegHeader, padding]);

      const result = await uploadImage({
        file: largeFile,
        bucket: 'avatars',
        path: 'avatars/user123/',
        filename: 'profile',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('5MB를 초과');
      expect(result.code).toBe('FILE_TOO_LARGE');
    });

    it('원본 이미지와 리사이징된 이미지를 모두 업로드해야 함', async () => {
      const mockFile = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

      const result = await uploadImage({
        file: mockFile,
        bucket: 'avatars',
        path: 'avatars/user123/',
        filename: 'profile',
        sizes: ['thumbnail', 'medium'],
        keepOriginal: true,
      });

      expect(result.success).toBe(true);
      expect(result.images).toHaveLength(3); // original + 2 sizes

      const sizes = result.images.map((img) => img.size);
      expect(sizes).toContain('original');
      expect(sizes).toContain('thumbnail');
      expect(sizes).toContain('medium');
    });
  });

  describe('uploadUserAvatar 함수', () => {
    it('사용자 아바타를 업로드해야 함', async () => {
      const mockFile = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

      const result = await uploadUserAvatar('user123', mockFile);

      expect(result.success).toBe(true);
      expect(result.images.length).toBeGreaterThan(0);
    });
  });

  describe('uploadPoliticianImage 함수', () => {
    it('정치인 이미지를 업로드해야 함', async () => {
      const mockFile = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

      const result = await uploadPoliticianImage('pol123', mockFile);

      expect(result.success).toBe(true);
      expect(result.images.length).toBeGreaterThan(0);
    });
  });

  describe('deleteImages 함수', () => {
    it('이미지를 삭제해야 함', async () => {
      const result = await deleteImages('avatars', [
        'avatars/user123/image1.jpg',
        'avatars/user123/image2.jpg',
      ]);

      expect(result.success).toBe(true);
    });
  });

  describe('deleteImagesInPath 함수', () => {
    it('특정 경로의 모든 이미지를 삭제해야 함', async () => {
      const result = await deleteImagesInPath('avatars', 'avatars/user123/');

      expect(result.success).toBe(true);
    });
  });

  describe('에러 처리', () => {
    it('허용되지 않은 이미지 형식에 대해 에러를 반환해야 함', async () => {
      const invalidFile = Buffer.from([0x00, 0x00, 0x00, 0x00]);

      const result = await uploadImage({
        file: invalidFile,
        bucket: 'avatars',
        path: 'avatars/user123/',
        filename: 'profile',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('허용되지 않은 이미지 형식');
      expect(result.code).toBe('INVALID_FORMAT');
    });
  });
});

// ============================================================================
// 테스트 완료
// ============================================================================
// P4BA3: 이미지 업로드 헬퍼 테스트 완료
//
// 테스트 항목:
// - 상수 정의 검증
// - 이미지 업로드 기능
// - 파일 크기 제한
// - 리사이징 기능
// - 사용자 아바타 업로드
// - 정치인 이미지 업로드
// - 이미지 삭제 기능
// - 에러 처리
