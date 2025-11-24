/**
 * 통합 로딩 상태 컴포넌트
 * 프로젝트 전체에서 일관된 로딩 UI 제공
 */

import React from 'react';

/**
 * Spinner 크기 옵션
 * - xs: 16px (인라인, 아이콘 대체)
 * - sm: 20px (버튼 내부)
 * - md: 32px (카드, 섹션)
 * - lg: 48px (페이지 전체)
 * - xl: 64px (초기 로딩)
 */
type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Spinner 색상 variant
 * - primary: 주황색 (기본)
 * - secondary: 보라색
 * - white: 흰색 (어두운 배경)
 * - gray: 회색 (중립)
 */
type SpinnerVariant = 'primary' | 'secondary' | 'white' | 'gray';

export interface SpinnerProps {
  /**
   * 크기
   */
  size?: SpinnerSize;

  /**
   * 색상 variant
   */
  variant?: SpinnerVariant;

  /**
   * 추가 클래스명
   */
  className?: string;
}

/**
 * 기본 Spinner 컴포넌트
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const variantClasses = {
    primary: 'text-primary-500',
    secondary: 'text-secondary-500',
    white: 'text-white',
    gray: 'text-gray-500',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="로딩 중"
      role="status"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * 전체 페이지 로딩 컴포넌트
 */
export interface LoadingPageProps {
  /**
   * 로딩 메시지
   */
  message?: string;

  /**
   * Spinner 크기
   */
  size?: SpinnerSize;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  message = '로딩 중...',
  size = 'lg',
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-16">
      <Spinner size={size} variant="primary" />
      <p className="text-gray-600 text-lg mt-4 font-medium">{message}</p>
    </div>
  );
};

/**
 * 카드/섹션 로딩 컴포넌트
 */
export interface LoadingSectionProps {
  /**
   * 로딩 메시지
   */
  message?: string;

  /**
   * 높이 (Tailwind 클래스)
   */
  height?: string;
}

export const LoadingSection: React.FC<LoadingSectionProps> = ({
  message = '불러오는 중...',
  height = 'h-64',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${height}`}>
      <Spinner size="md" variant="primary" />
      <p className="text-gray-500 text-base mt-3">{message}</p>
    </div>
  );
};

/**
 * Skeleton 로딩 컴포넌트
 */
export interface SkeletonProps {
  /**
   * 너비 (Tailwind 클래스)
   */
  width?: string;

  /**
   * 높이 (Tailwind 클래스)
   */
  height?: string;

  /**
   * 원형 여부
   */
  circle?: boolean;

  /**
   * 추가 클래스명
   */
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = 'w-full',
  height = 'h-4',
  circle = false,
  className = '',
}) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${width} ${height} ${
        circle ? 'rounded-full' : 'rounded'
      } ${className}`}
      role="status"
      aria-label="로딩 중"
    />
  );
};

/**
 * 카드 Skeleton 컴포넌트 (정치인 카드)
 */
export const PoliticianCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
      {/* 프로필 이미지 + 이름 */}
      <div className="flex items-center gap-4">
        <Skeleton width="w-16" height="h-16" circle />
        <div className="flex-1 space-y-2">
          <Skeleton width="w-24" height="h-6" />
          <Skeleton width="w-32" height="h-4" />
        </div>
      </div>

      {/* 정보 */}
      <div className="space-y-2">
        <Skeleton width="w-full" height="h-4" />
        <Skeleton width="w-3/4" height="h-4" />
      </div>

      {/* 점수 */}
      <div className="flex gap-2">
        <Skeleton width="w-20" height="h-8" />
        <Skeleton width="w-20" height="h-8" />
      </div>
    </div>
  );
};

/**
 * 게시글 카드 Skeleton 컴포넌트
 */
export const PostCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      {/* 제목 */}
      <Skeleton width="w-3/4" height="h-6" />

      {/* 내용 */}
      <div className="space-y-2">
        <Skeleton width="w-full" height="h-4" />
        <Skeleton width="w-full" height="h-4" />
        <Skeleton width="w-2/3" height="h-4" />
      </div>

      {/* 메타 정보 */}
      <div className="flex gap-4">
        <Skeleton width="w-16" height="h-4" />
        <Skeleton width="w-16" height="h-4" />
        <Skeleton width="w-20" height="h-4" />
      </div>
    </div>
  );
};

/**
 * 테이블 행 Skeleton 컴포넌트
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({
  columns = 5,
}) => {
  return (
    <tr className="border-b border-gray-200">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <Skeleton width="w-full" height="h-4" />
        </td>
      ))}
    </tr>
  );
};
