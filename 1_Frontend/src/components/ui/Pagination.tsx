/**
 * Pagination Component
 * 페이지네이션 컴포넌트
 */

import React from 'react';
import Link from 'next/link';

export interface PaginationProps {
  /** 현재 페이지 (1부터 시작) */
  currentPage: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 페이지 변경 핸들러 (클라이언트 사이드) */
  onPageChange?: (page: number) => void;
  /** URL 생성 함수 (서버 사이드 렌더링용) */
  getPageUrl?: (page: number) => string;
  /** 표시할 페이지 버튼 수 (홀수 권장) */
  siblingCount?: number;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 추가 클래스 */
  className?: string;
  /** 이전/다음 텍스트 표시 */
  showText?: boolean;
}

const sizeStyles = {
  sm: 'min-h-[36px] min-w-[36px] text-sm',
  md: 'min-h-[44px] min-w-[44px] text-base',
  lg: 'min-h-[48px] min-w-[48px] text-lg',
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  getPageUrl,
  siblingCount = 1,
  size = 'md',
  className = '',
  showText = false,
}: PaginationProps) {
  // 페이지가 1개 이하면 표시하지 않음
  if (totalPages <= 1) return null;

  // 페이지 번호 배열 생성
  const generatePages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];

    // 항상 첫 페이지 표시
    pages.push(1);

    // 시작 범위
    const rangeStart = Math.max(2, currentPage - siblingCount);
    // 끝 범위
    const rangeEnd = Math.min(totalPages - 1, currentPage + siblingCount);

    // 첫 페이지와 범위 시작 사이에 간격이 있으면 ellipsis
    if (rangeStart > 2) {
      pages.push('ellipsis');
    }

    // 중간 페이지들
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    // 범위 끝과 마지막 페이지 사이에 간격이 있으면 ellipsis
    if (rangeEnd < totalPages - 1) {
      pages.push('ellipsis');
    }

    // 항상 마지막 페이지 표시 (1페이지가 아닌 경우)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePages();

  const buttonBaseClass = `
    ${sizeStyles[size]}
    flex items-center justify-center
    rounded-lg
    font-medium
    transition-colors
    touch-manipulation
  `;

  const activeClass = 'bg-primary-600 text-white';
  const inactiveClass = 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600';
  const disabledClass = 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600 cursor-not-allowed';

  const renderPageButton = (page: number | 'ellipsis', index: number) => {
    if (page === 'ellipsis') {
      return (
        <span
          key={`ellipsis-${index}`}
          className={`${buttonBaseClass} ${inactiveClass} cursor-default`}
          aria-hidden="true"
        >
          ...
        </span>
      );
    }

    const isActive = page === currentPage;
    const buttonClass = `${buttonBaseClass} ${isActive ? activeClass : inactiveClass}`;

    // URL 기반 (서버 사이드)
    if (getPageUrl) {
      return (
        <Link
          key={page}
          href={getPageUrl(page)}
          className={buttonClass}
          aria-label={`${page}페이지로 이동`}
          aria-current={isActive ? 'page' : undefined}
        >
          {page}
        </Link>
      );
    }

    // onClick 기반 (클라이언트 사이드)
    return (
      <button
        key={page}
        onClick={() => onPageChange?.(page)}
        className={buttonClass}
        aria-label={`${page}페이지로 이동`}
        aria-current={isActive ? 'page' : undefined}
      >
        {page}
      </button>
    );
  };

  const renderNavButton = (
    direction: 'prev' | 'next',
    disabled: boolean
  ) => {
    const isPrev = direction === 'prev';
    const targetPage = isPrev ? currentPage - 1 : currentPage + 1;
    const label = isPrev ? '이전' : '다음';
    const icon = isPrev ? '←' : '→';

    const buttonClass = `${buttonBaseClass} ${disabled ? disabledClass : inactiveClass} px-3`;

    if (disabled) {
      return (
        <span className={buttonClass} aria-disabled="true">
          {showText ? (isPrev ? `${icon} ${label}` : `${label} ${icon}`) : icon}
        </span>
      );
    }

    // URL 기반
    if (getPageUrl) {
      return (
        <Link
          href={getPageUrl(targetPage)}
          className={buttonClass}
          aria-label={`${label} 페이지`}
        >
          {showText ? (isPrev ? `${icon} ${label}` : `${label} ${icon}`) : icon}
        </Link>
      );
    }

    // onClick 기반
    return (
      <button
        onClick={() => onPageChange?.(targetPage)}
        className={buttonClass}
        aria-label={`${label} 페이지`}
      >
        {showText ? (isPrev ? `${icon} ${label}` : `${label} ${icon}`) : icon}
      </button>
    );
  };

  return (
    <nav
      className={`flex items-center justify-center gap-1 sm:gap-2 ${className}`}
      aria-label="페이지 네비게이션"
    >
      {/* 이전 버튼 */}
      {renderNavButton('prev', currentPage === 1)}

      {/* 페이지 번호들 */}
      <div className="flex items-center gap-1">
        {pages.map((page, index) => renderPageButton(page, index))}
      </div>

      {/* 다음 버튼 */}
      {renderNavButton('next', currentPage === totalPages)}
    </nav>
  );
}

// 페이지 정보 컴포넌트 (예: "1-10 / 100개")
export function PaginationInfo({
  currentPage,
  pageSize,
  totalItems,
  className = '',
}: {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  className?: string;
}) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      <span className="font-medium">{start}-{end}</span>
      {' / '}
      <span className="font-medium">{totalItems.toLocaleString()}</span>개
    </p>
  );
}
