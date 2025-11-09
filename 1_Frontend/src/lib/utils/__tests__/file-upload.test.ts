/**
 * Project Grid Task ID: P4BA4
 * 파일 업로드 헬퍼 테스트
 */

import {
  validateFile,
  getFileExtension,
  getFileCategory,
  generateSafeFilename,
  generateStoragePath,
  getAllowedExtensions,
  getAllowedMimeTypes,
  getMaxFileSizeMB,
  FileCategory,
  ERROR_CODES,
} from '../file-upload';

describe('File Upload Helper - P4BA4', () => {
  describe('getFileExtension', () => {
    it('should extract file extension correctly', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.png')).toBe('png');
      expect(getFileExtension('archive.zip')).toBe('zip');
    });

    it('should handle files with multiple dots', () => {
      expect(getFileExtension('my.document.pdf')).toBe('pdf');
      expect(getFileExtension('test.file.name.docx')).toBe('docx');
    });

    it('should handle files without extension', () => {
      expect(getFileExtension('README')).toBe('');
    });

    it('should return lowercase extension', () => {
      expect(getFileExtension('Document.PDF')).toBe('pdf');
      expect(getFileExtension('Image.PNG')).toBe('png');
    });
  });

  describe('getFileCategory', () => {
    it('should identify document files', () => {
      expect(getFileCategory('application/pdf', 'pdf')).toBe(FileCategory.DOCUMENT);
      expect(getFileCategory('application/msword', 'doc')).toBe(FileCategory.DOCUMENT);
      expect(getFileCategory('text/plain', 'txt')).toBe(FileCategory.DOCUMENT);
    });

    it('should identify image files', () => {
      expect(getFileCategory('image/jpeg', 'jpg')).toBe(FileCategory.IMAGE);
      expect(getFileCategory('image/png', 'png')).toBe(FileCategory.IMAGE);
      expect(getFileCategory('image/webp', 'webp')).toBe(FileCategory.IMAGE);
    });

    it('should identify archive files', () => {
      expect(getFileCategory('application/zip', 'zip')).toBe(FileCategory.ARCHIVE);
      expect(getFileCategory('application/x-rar-compressed', 'rar')).toBe(FileCategory.ARCHIVE);
    });

    it('should return null for unsupported types', () => {
      expect(getFileCategory('video/mp4', 'mp4')).toBeNull();
      expect(getFileCategory('audio/mp3', 'mp3')).toBeNull();
    });
  });

  describe('generateSafeFilename', () => {
    it('should generate safe filename with timestamp and random string', () => {
      const filename = generateSafeFilename('test document.pdf');
      expect(filename).toMatch(/^test_document_\d+_[a-z0-9]{6}\.pdf$/);
    });

    it('should remove special characters', () => {
      const filename = generateSafeFilename('테스트@파일#이름$.pdf');
      expect(filename).toMatch(/^테스트_파일_이름__\d+_[a-z0-9]{6}\.pdf$/);
    });

    it('should truncate long filenames', () => {
      const longName = 'a'.repeat(100) + '.pdf';
      const filename = generateSafeFilename(longName);
      const nameWithoutTimestamp = filename.split('_')[0];
      expect(nameWithoutTimestamp.length).toBeLessThanOrEqual(50);
    });

    it('should preserve Korean characters', () => {
      const filename = generateSafeFilename('한글파일명.pdf');
      expect(filename).toMatch(/^한글파일명_\d+_[a-z0-9]{6}\.pdf$/);
    });
  });

  describe('generateStoragePath', () => {
    it('should generate correct storage path', () => {
      const userId = 'user-123';
      const postId = 'post-456';
      const filename = 'test.pdf';

      const path = generateStoragePath(userId, postId, filename);
      expect(path).toBe('user-123/post-456/test.pdf');
    });

    it('should handle UUIDs correctly', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const postId = '660e8400-e29b-41d4-a716-446655440000';
      const filename = 'document.docx';

      const path = generateStoragePath(userId, postId, filename);
      expect(path).toBe(
        '550e8400-e29b-41d4-a716-446655440000/660e8400-e29b-41d4-a716-446655440000/document.docx'
      );
    });
  });

  describe('validateFile', () => {
    // Mock File 객체 생성 헬퍼
    const createMockFile = (
      name: string,
      size: number,
      type: string
    ): File => {
      const blob = new Blob(['a'.repeat(size)], { type });
      return new File([blob], name, { type });
    };

    describe('Document files', () => {
      it('should accept valid PDF file', () => {
        const file = createMockFile('document.pdf', 5 * 1024 * 1024, 'application/pdf');
        const result = validateFile(file);

        expect(result.valid).toBe(true);
        expect(result.category).toBe(FileCategory.DOCUMENT);
      });

      it('should accept valid DOCX file', () => {
        const file = createMockFile(
          'document.docx',
          5 * 1024 * 1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        const result = validateFile(file);

        expect(result.valid).toBe(true);
        expect(result.category).toBe(FileCategory.DOCUMENT);
      });

      it('should reject document file exceeding 10MB', () => {
        const file = createMockFile('large.pdf', 11 * 1024 * 1024, 'application/pdf');
        const result = validateFile(file);

        expect(result.valid).toBe(false);
        expect(result.code).toBe(ERROR_CODES.FILE_TOO_LARGE);
        expect(result.error).toContain('10MB');
      });
    });

    describe('Image files', () => {
      it('should accept valid JPG file', () => {
        const file = createMockFile('image.jpg', 2 * 1024 * 1024, 'image/jpeg');
        const result = validateFile(file);

        expect(result.valid).toBe(true);
        expect(result.category).toBe(FileCategory.IMAGE);
      });

      it('should accept valid PNG file', () => {
        const file = createMockFile('image.png', 3 * 1024 * 1024, 'image/png');
        const result = validateFile(file);

        expect(result.valid).toBe(true);
        expect(result.category).toBe(FileCategory.IMAGE);
      });

      it('should accept valid WEBP file', () => {
        const file = createMockFile('image.webp', 4 * 1024 * 1024, 'image/webp');
        const result = validateFile(file);

        expect(result.valid).toBe(true);
        expect(result.category).toBe(FileCategory.IMAGE);
      });

      it('should reject image file exceeding 5MB', () => {
        const file = createMockFile('large.jpg', 6 * 1024 * 1024, 'image/jpeg');
        const result = validateFile(file);

        expect(result.valid).toBe(false);
        expect(result.code).toBe(ERROR_CODES.FILE_TOO_LARGE);
        expect(result.error).toContain('5MB');
      });
    });

    describe('Archive files', () => {
      it('should accept valid ZIP file', () => {
        const file = createMockFile('archive.zip', 15 * 1024 * 1024, 'application/zip');
        const result = validateFile(file);

        expect(result.valid).toBe(true);
        expect(result.category).toBe(FileCategory.ARCHIVE);
      });

      it('should accept valid RAR file', () => {
        const file = createMockFile('archive.rar', 18 * 1024 * 1024, 'application/x-rar-compressed');
        const result = validateFile(file);

        expect(result.valid).toBe(true);
        expect(result.category).toBe(FileCategory.ARCHIVE);
      });

      it('should reject archive file exceeding 20MB', () => {
        const file = createMockFile('large.zip', 21 * 1024 * 1024, 'application/zip');
        const result = validateFile(file);

        expect(result.valid).toBe(false);
        expect(result.code).toBe(ERROR_CODES.FILE_TOO_LARGE);
        expect(result.error).toContain('20MB');
      });
    });

    describe('Invalid file types', () => {
      it('should reject video file', () => {
        const file = createMockFile('video.mp4', 5 * 1024 * 1024, 'video/mp4');
        const result = validateFile(file);

        expect(result.valid).toBe(false);
        expect(result.code).toBe(ERROR_CODES.INVALID_FILE_TYPE);
      });

      it('should reject audio file', () => {
        const file = createMockFile('audio.mp3', 3 * 1024 * 1024, 'audio/mpeg');
        const result = validateFile(file);

        expect(result.valid).toBe(false);
        expect(result.code).toBe(ERROR_CODES.INVALID_FILE_TYPE);
      });

      it('should reject executable file', () => {
        const file = createMockFile('app.exe', 1 * 1024 * 1024, 'application/x-msdownload');
        const result = validateFile(file);

        expect(result.valid).toBe(false);
        expect(result.code).toBe(ERROR_CODES.INVALID_FILE_TYPE);
      });
    });
  });

  describe('Utility functions', () => {
    it('should return all allowed extensions', () => {
      const extensions = getAllowedExtensions();
      expect(extensions).toContain('pdf');
      expect(extensions).toContain('jpg');
      expect(extensions).toContain('png');
      expect(extensions).toContain('zip');
      expect(extensions).toContain('docx');
    });

    it('should return all allowed MIME types', () => {
      const mimeTypes = getAllowedMimeTypes();
      expect(mimeTypes).toContain('application/pdf');
      expect(mimeTypes).toContain('image/jpeg');
      expect(mimeTypes).toContain('application/zip');
    });

    it('should return correct max file size for each category', () => {
      expect(getMaxFileSizeMB(FileCategory.DOCUMENT)).toBe(10);
      expect(getMaxFileSizeMB(FileCategory.IMAGE)).toBe(5);
      expect(getMaxFileSizeMB(FileCategory.ARCHIVE)).toBe(20);
    });
  });

  describe('Edge cases', () => {
    const createMockFile = (
      name: string,
      size: number,
      type: string
    ): File => {
      const blob = new Blob(['a'.repeat(size)], { type });
      return new File([blob], name, { type });
    };

    it('should handle empty filename', () => {
      const filename = generateSafeFilename('.pdf');
      expect(filename).toMatch(/^_\d+_[a-z0-9]{6}\.pdf$/);
    });

    it('should handle file with only special characters', () => {
      const filename = generateSafeFilename('@#$%.pdf');
      expect(filename).toMatch(/^____\d+_[a-z0-9]{6}\.pdf$/);
    });

    it('should handle zero-byte file', () => {
      const file = createMockFile('empty.pdf', 0, 'application/pdf');
      const result = validateFile(file);

      expect(result.valid).toBe(true);
    });

    it('should handle file at exact size limit', () => {
      const file = createMockFile('exact.pdf', 10 * 1024 * 1024, 'application/pdf');
      const result = validateFile(file);

      expect(result.valid).toBe(true);
    });

    it('should handle file 1 byte over limit', () => {
      const file = createMockFile('over.pdf', 10 * 1024 * 1024 + 1, 'application/pdf');
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.code).toBe(ERROR_CODES.FILE_TOO_LARGE);
    });
  });
});
