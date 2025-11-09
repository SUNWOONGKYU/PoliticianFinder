// Task: P5T1
/**
 * Utils Library Tests
 * 작업일: 2025-11-10
 * 설명: cn 유틸리티 함수 테스트
 */

import { cn } from '../utils';

describe('Utils Library', () => {
  describe('cn (className merger)', () => {
    it('should merge single className', () => {
      const result = cn('text-center');
      expect(result).toBe('text-center');
    });

    it('should merge multiple classNames', () => {
      const result = cn('text-center', 'bg-blue-500', 'p-4');
      expect(result).toContain('text-center');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('p-4');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
    });

    it('should filter out false conditions', () => {
      const isActive = false;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).not.toContain('active-class');
    });

    it('should merge Tailwind conflicting classes', () => {
      // tailwind-merge should keep the last conflicting class
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
    });

    it('should handle array of classes', () => {
      const result = cn(['text-sm', 'font-bold']);
      expect(result).toContain('text-sm');
      expect(result).toContain('font-bold');
    });

    it('should handle object notation', () => {
      const result = cn({
        'text-center': true,
        'bg-blue-500': false,
        'p-4': true,
      });
      expect(result).toContain('text-center');
      expect(result).not.toContain('bg-blue-500');
      expect(result).toContain('p-4');
    });

    it('should handle undefined and null', () => {
      const result = cn('base', undefined, null, 'other');
      expect(result).toContain('base');
      expect(result).toContain('other');
    });

    it('should handle empty strings', () => {
      const result = cn('base', '', 'other');
      expect(result).toContain('base');
      expect(result).toContain('other');
    });

    it('should handle no arguments', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should merge complex Tailwind classes', () => {
      const result = cn(
        'flex items-center justify-center',
        'px-4 py-2',
        'bg-blue-500 hover:bg-blue-700',
        'text-white font-bold'
      );
      expect(result).toContain('flex');
      expect(result).toContain('items-center');
      expect(result).toContain('px-4');
      expect(result).toContain('bg-blue-500');
    });

    it('should override conflicting widths', () => {
      const result = cn('w-full', 'w-1/2');
      expect(result).toBe('w-1/2');
      expect(result).not.toContain('w-full');
    });

    it('should override conflicting text sizes', () => {
      const result = cn('text-sm', 'text-lg');
      expect(result).toBe('text-lg');
    });

    it('should override conflicting backgrounds', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBe('bg-blue-500');
    });

    it('should handle mixed types of inputs', () => {
      const result = cn(
        'base',
        ['array-class'],
        { 'object-class': true },
        true && 'conditional',
        undefined,
        null
      );
      expect(result).toContain('base');
      expect(result).toContain('array-class');
      expect(result).toContain('object-class');
      expect(result).toContain('conditional');
    });

    it('should preserve non-conflicting classes', () => {
      const result = cn('text-center', 'bg-blue-500', 'p-4', 'rounded-lg');
      expect(result).toContain('text-center');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('p-4');
      expect(result).toContain('rounded-lg');
    });

    it('should handle arbitrary values', () => {
      const result = cn('w-[100px]', 'h-[200px]');
      expect(result).toContain('w-[100px]');
      expect(result).toContain('h-[200px]');
    });

    it('should handle responsive classes', () => {
      const result = cn('md:flex', 'lg:grid', 'sm:block');
      expect(result).toContain('md:flex');
      expect(result).toContain('lg:grid');
      expect(result).toContain('sm:block');
    });

    it('should handle pseudo-classes', () => {
      const result = cn('hover:bg-blue-700', 'focus:ring-2', 'active:scale-95');
      expect(result).toContain('hover:bg-blue-700');
      expect(result).toContain('focus:ring-2');
      expect(result).toContain('active:scale-95');
    });

    it('should handle dark mode classes', () => {
      const result = cn('bg-white', 'dark:bg-black', 'text-black', 'dark:text-white');
      expect(result).toContain('bg-white');
      expect(result).toContain('dark:bg-black');
      expect(result).toContain('text-black');
      expect(result).toContain('dark:text-white');
    });

    it('should handle group modifiers', () => {
      const result = cn('group-hover:visible', 'group-focus:underline');
      expect(result).toContain('group-hover:visible');
      expect(result).toContain('group-focus:underline');
    });

    it('should deduplicate identical classes', () => {
      const result = cn('p-4', 'text-center', 'p-4');
      // Should only include p-4 once
      const matches = result.match(/p-4/g);
      expect(matches).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long class strings', () => {
      const longClass = 'class-'.repeat(100) + 'end';
      const result = cn(longClass);
      expect(result).toContain('end');
    });

    it('should handle special characters in class names', () => {
      const result = cn('w-1/2', 'h-[calc(100vh-4rem)]');
      expect(result).toContain('w-1/2');
      expect(result).toContain('h-[calc(100vh-4rem)]');
    });

    it('should handle nested arrays', () => {
      const result = cn(['base', ['nested', ['deep']]]);
      expect(result).toContain('base');
      expect(result).toContain('nested');
      expect(result).toContain('deep');
    });

    it('should handle boolean values', () => {
      const result = cn(true, false, 'class');
      expect(result).toBe('class');
    });

    it('should handle number values', () => {
      const result = cn(0, 1, 'class');
      expect(result).toContain('class');
    });
  });
});
