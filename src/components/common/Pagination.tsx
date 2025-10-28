'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Pagination 컴포넌트 Props
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  showPageNumbers?: boolean;
  maxPageButtons?: number;
}

/**
 * Pagination 컴포넌트
 * 페이지 네비게이션 제공
 *
 * @features
 * - 이전/다음 페이지 이동
 * - 첫/마지막 페이지 이동
 * - 페이지 번호 직접 선택
 * - 현재 위치 정보 표시
 * - 반응형 디자인
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className,
  showPageNumbers = true,
  maxPageButtons = 5,
}: PaginationProps) {
  // 페이지 범위 계산
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // 페이지 버튼 생성
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= maxPageButtons) {
      // 전체 페이지가 maxPageButtons 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 많은 페이지가 있을 때는 현재 페이지 주변만 표시
      const halfButtons = Math.floor(maxPageButtons / 2);
      let startPage = Math.max(1, currentPage - halfButtons);
      let endPage = Math.min(totalPages, currentPage + halfButtons);

      // 시작이나 끝에 가까울 때 조정
      if (currentPage <= halfButtons) {
        endPage = maxPageButtons;
      } else if (currentPage >= totalPages - halfButtons) {
        startPage = totalPages - maxPageButtons + 1;
      }

      // 첫 페이지
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }

      // 중간 페이지들
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // 마지막 페이지
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', className)}>
      {/* 페이지 정보 */}
      <div className="text-sm text-gray-700">
        <span className="font-medium">{startItem}</span>
        {' - '}
        <span className="font-medium">{endItem}</span>
        {' / '}
        <span className="font-medium">{totalItems.toLocaleString()}</span>
        {' 결과'}
      </div>

      {/* 페이지 네비게이션 */}
      <div className="flex items-center gap-1">
        {/* 첫 페이지 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="hidden sm:flex"
          aria-label="첫 페이지"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* 이전 페이지 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="이전 페이지"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* 페이지 번호 버튼 */}
        {showPageNumbers && (
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-gray-500"
                  >
                    ...
                  </span>
                );
              }

              const pageNumber = page as number;
              const isActive = pageNumber === currentPage;

              return (
                <Button
                  key={pageNumber}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  className={cn(
                    'min-w-[2.5rem]',
                    isActive && 'bg-blue-600 hover:bg-blue-700'
                  )}
                  aria-label={`페이지 ${pageNumber}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>
        )}

        {/* 다음 페이지 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="다음 페이지"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* 마지막 페이지 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden sm:flex"
          aria-label="마지막 페이지"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
