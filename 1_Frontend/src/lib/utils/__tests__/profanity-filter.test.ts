// Task: P5T1
/**
 * Profanity Filter Utility Tests
 * 작업일: 2025-11-10
 * 설명: 비속어 필터링 및 콘텐츠 검증 유틸리티 테스트
 */

import { filterProfanity, validateContent } from '../profanity-filter';

describe('Profanity Filter Utility', () => {
  describe('filterProfanity', () => {
    it('should filter single profanity word', () => {
      const result = filterProfanity('이것은 비방입니다');
      expect(result.filtered).toBe('이것은 ***입니다');
      expect(result.isCritical).toBe(true);
    });

    it('should filter multiple profanity words', () => {
      const result = filterProfanity('비방과 욕설이 포함됨');
      expect(result.filtered).toBe('***과 ***이 포함됨');
      expect(result.isCritical).toBe(true);
    });

    it('should be case insensitive', () => {
      const result = filterProfanity('비방 BITANG');
      expect(result.filtered).toContain('***');
      expect(result.isCritical).toBe(true);
    });

    it('should not filter clean text', () => {
      const result = filterProfanity('깨끗한 텍스트입니다');
      expect(result.filtered).toBe('깨끗한 텍스트입니다');
      expect(result.isCritical).toBe(false);
    });

    it('should handle empty string', () => {
      const result = filterProfanity('');
      expect(result.filtered).toBe('');
      expect(result.isCritical).toBe(false);
    });

    it('should filter all profanity words', () => {
      const words = ['비방', '욕설', '사기', '해킹', '노출'];
      words.forEach((word) => {
        const result = filterProfanity(`이것은 ${word}입니다`);
        expect(result.filtered).toContain('***');
        expect(result.isCritical).toBe(true);
      });
    });

    it('should replace with asterisks', () => {
      const result = filterProfanity('비방');
      expect(result.filtered).toBe('***');
    });

    it('should handle text with only profanity', () => {
      const result = filterProfanity('비방욕설사기');
      expect(result.isCritical).toBe(true);
      expect(result.filtered).toContain('***');
    });

    it('should handle multiple occurrences of same word', () => {
      const result = filterProfanity('비방 비방 비방');
      expect(result.filtered).toBe('*** *** ***');
      expect(result.isCritical).toBe(true);
    });

    it('should handle mixed content', () => {
      const result = filterProfanity('정상 텍스트 비방 정상 텍스트 욕설');
      expect(result.filtered).toContain('정상 텍스트');
      expect(result.filtered).toContain('***');
      expect(result.isCritical).toBe(true);
    });
  });

  describe('validateContent', () => {
    it('should validate normal content', () => {
      const result = validateContent('이것은 정상적인 콘텐츠입니다. 충분히 긴 내용입니다.');
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about short content', () => {
      const result = validateContent('짧음');
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('내용이 너무 짧습니다');
    });

    it('should warn about long content', () => {
      const longText = 'a'.repeat(5001);
      const result = validateContent(longText);
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('내용이 너무 깁니다');
    });

    it('should warn about profanity', () => {
      const result = validateContent('이것은 비방이 포함된 충분히 긴 내용입니다.');
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('부적절한 내용이 포함되어 있습니다');
    });

    it('should accept exactly 10 characters', () => {
      const result = validateContent('1234567890');
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should accept exactly 5000 characters', () => {
      const text = 'a'.repeat(5000);
      const result = validateContent(text);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle empty content', () => {
      const result = validateContent('');
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('내용이 너무 짧습니다');
    });

    it('should accumulate multiple warnings', () => {
      const result = validateContent('비방');
      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(1);
      expect(result.warnings).toContain('내용이 너무 짧습니다');
      expect(result.warnings).toContain('부적절한 내용이 포함되어 있습니다');
    });

    it('should handle content at boundary (9 chars)', () => {
      const result = validateContent('123456789');
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('내용이 너무 짧습니다');
    });

    it('should handle content at boundary (5001 chars)', () => {
      const text = 'a'.repeat(5001);
      const result = validateContent(text);
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('내용이 너무 깁니다');
    });

    it('should validate Korean text correctly', () => {
      const result = validateContent('한글 텍스트가 정상적으로 검증됩니다. 충분한 길이입니다.');
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate mixed language text', () => {
      const result = validateContent('Mixed 한글 and English content that is long enough.');
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle special characters', () => {
      const result = validateContent('특수문자!@#$%^&*()가 포함된 충분한 내용입니다.');
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null-like values gracefully', () => {
      // TypeScript would prevent this, but test runtime behavior
      const result = filterProfanity('' as any);
      expect(result.filtered).toBe('');
      expect(result.isCritical).toBe(false);
    });

    it('should handle numeric content', () => {
      const result = validateContent('1234567890');
      expect(result.valid).toBe(true);
    });

    it('should handle whitespace-only content', () => {
      const result = validateContent('     '); // 5 spaces, less than minimum
      // Assuming spaces count as characters
      expect(result.warnings).toContain('내용이 너무 짧습니다');
    });

    it('should handle newlines and tabs', () => {
      const result = validateContent('이것은\n충분히\t긴\n내용입니다.\n테스트용입니다.');
      expect(result.valid).toBe(true);
    });

    it('should handle Unicode characters', () => {
      const result = filterProfanity('😀 이모지와 비방 포함');
      expect(result.isCritical).toBe(true);
      expect(result.filtered).toContain('***');
    });
  });
});
