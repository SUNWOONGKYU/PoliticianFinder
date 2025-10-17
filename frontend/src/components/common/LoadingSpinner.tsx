'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * LoadingSpinner 컴포넌트 Props
 */
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

/**
 * LoadingSpinner 컴포넌트
 * 로딩 상태를 표시하는 스피너
 *
 * @features
 * - 다양한 크기 옵션
 * - 선택적 텍스트 표시
 * - 애니메이션 효과
 */
export function LoadingSpinner({
  size = 'md',
  text,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full border-gray-200 border-t-blue-600 animate-spin',
          sizeClasses[size]
        )}
        role="status"
        aria-label="로딩 중"
      />
      {text && (
        <p className={cn('text-gray-600 font-medium', textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * FullPageLoader 컴포넌트
 * 전체 페이지 로딩을 표시
 */
export function FullPageLoader({ text = '로딩 중...' }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

/**
 * InlineLoader 컴포넌트
 * 인라인 로딩을 표시
 */
export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
}
