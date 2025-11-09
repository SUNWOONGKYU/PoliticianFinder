// Task: P5T1
/**
 * File Upload Utility Tests
 * 작업일: 2025-11-10
 * 설명: 파일 업로드 유틸리티 함수 테스트
 */

import { uploadFile, getFileExtension } from '../uploads';

// Mock fetch globally
global.fetch = jest.fn();

// Helper to create mock files
const createMockFile = (type: string, size: number, name = 'test.jpg'): File => {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
};

describe('Upload Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {

    it('should successfully upload valid image file', async () => {
      const mockFile = createMockFile('image/jpeg', 1024 * 1024);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/image.jpg' }),
      });

      const result = await uploadFile({
        bucket: 'avatars',
        path: 'user/123',
        file: mockFile,
      });

      expect(result.url).toBe('https://example.com/image.jpg');
      expect(result.error).toBeUndefined();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should reject unsupported file type', async () => {
      const mockFile = createMockFile('application/zip', 1024, 'test.zip');

      const result = await uploadFile({
        bucket: 'avatars',
        path: 'user/123',
        file: mockFile,
      });

      expect(result.url).toBe('');
      expect(result.error).toBe('지원하지 않는 파일 형식입니다');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should reject file exceeding size limit', async () => {
      const mockFile = createMockFile('image/jpeg', 11 * 1024 * 1024); // 11MB

      const result = await uploadFile({
        bucket: 'avatars',
        path: 'user/123',
        file: mockFile,
      });

      expect(result.url).toBe('');
      expect(result.error).toBe('파일 크기가 10MB를 초과합니다');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle upload failure', async () => {
      const mockFile = createMockFile('image/jpeg', 1024);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await uploadFile({
        bucket: 'avatars',
        path: 'user/123',
        file: mockFile,
      });

      expect(result.url).toBe('');
      expect(result.error).toBe('업로드 실패');
    });

    it('should accept JPEG files', async () => {
      const mockFile = createMockFile('image/jpeg', 1024);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/image.jpg' }),
      });

      const result = await uploadFile({
        bucket: 'images',
        path: 'test',
        file: mockFile,
      });

      expect(result.error).toBeUndefined();
      expect(result.url).toBeTruthy();
    });

    it('should accept PNG files', async () => {
      const mockFile = createMockFile('image/png', 1024, 'test.png');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/image.png' }),
      });

      const result = await uploadFile({
        bucket: 'images',
        path: 'test',
        file: mockFile,
      });

      expect(result.error).toBeUndefined();
    });

    it('should accept WebP files', async () => {
      const mockFile = createMockFile('image/webp', 1024, 'test.webp');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/image.webp' }),
      });

      const result = await uploadFile({
        bucket: 'images',
        path: 'test',
        file: mockFile,
      });

      expect(result.error).toBeUndefined();
    });

    it('should accept PDF files', async () => {
      const mockFile = createMockFile('application/pdf', 1024, 'document.pdf');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/document.pdf' }),
      });

      const result = await uploadFile({
        bucket: 'documents',
        path: 'test',
        file: mockFile,
      });

      expect(result.error).toBeUndefined();
    });

    it('should accept file at exact size limit (10MB)', async () => {
      const mockFile = createMockFile('image/jpeg', 10 * 1024 * 1024);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/image.jpg' }),
      });

      const result = await uploadFile({
        bucket: 'images',
        path: 'test',
        file: mockFile,
      });

      expect(result.error).toBeUndefined();
    });

    it('should send correct FormData', async () => {
      const mockFile = createMockFile('image/jpeg', 1024, 'avatar.jpg');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/avatar.jpg' }),
      });

      await uploadFile({
        bucket: 'avatars',
        path: 'user/456',
        file: mockFile,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/storage/upload',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    it('should handle network errors', async () => {
      const mockFile = createMockFile('image/jpeg', 1024);
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        uploadFile({
          bucket: 'avatars',
          path: 'user/123',
          file: mockFile,
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle invalid JSON response', async () => {
      const mockFile = createMockFile('image/jpeg', 1024);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(
        uploadFile({
          bucket: 'avatars',
          path: 'user/123',
          file: mockFile,
        })
      ).rejects.toThrow('Invalid JSON');
    });
  });

  describe('getFileExtension', () => {
    it('should extract extension from filename', () => {
      expect(getFileExtension('image.jpg')).toBe('jpg');
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('should handle uppercase extensions', () => {
      expect(getFileExtension('IMAGE.JPG')).toBe('JPG');
      expect(getFileExtension('Document.PDF')).toBe('PDF');
    });

    it('should handle filename without extension', () => {
      expect(getFileExtension('filename')).toBe('filename');
    });

    it('should handle filename with multiple dots', () => {
      expect(getFileExtension('file.name.with.dots.txt')).toBe('txt');
    });

    it('should handle hidden files', () => {
      expect(getFileExtension('.gitignore')).toBe('gitignore');
      expect(getFileExtension('.env.local')).toBe('local');
    });

    it('should handle empty string', () => {
      expect(getFileExtension('')).toBe('');
    });

    it('should handle filename ending with dot', () => {
      expect(getFileExtension('filename.')).toBe('');
    });

    it('should handle path with directories', () => {
      expect(getFileExtension('/path/to/file.jpg')).toBe('jpg');
      expect(getFileExtension('C:\\Users\\file.png')).toBe('png');
    });

    it('should handle complex extensions', () => {
      expect(getFileExtension('backup.tar.gz')).toBe('gz');
      expect(getFileExtension('config.yaml.example')).toBe('example');
    });

    it('should handle numeric extensions', () => {
      expect(getFileExtension('backup.001')).toBe('001');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small files', async () => {
      const mockFile = createMockFile('image/jpeg', 1); // 1 byte
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/tiny.jpg' }),
      });

      const result = await uploadFile({
        bucket: 'images',
        path: 'test',
        file: mockFile,
      });

      expect(result.error).toBeUndefined();
    });

    it('should handle empty filename', () => {
      expect(getFileExtension('')).toBe('');
    });

    it('should handle special characters in filename', () => {
      expect(getFileExtension('file@name#.jpg')).toBe('jpg');
      expect(getFileExtension('file (1).png')).toBe('png');
    });

    it('should handle Unicode filenames', () => {
      expect(getFileExtension('파일.jpg')).toBe('jpg');
      expect(getFileExtension('文件.png')).toBe('png');
    });
  });
});
