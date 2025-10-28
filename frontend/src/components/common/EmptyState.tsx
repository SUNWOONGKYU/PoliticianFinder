'use client';

import React from 'react';
import { Search, AlertCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * EmptyState 컴포넌트 Props
 */
export interface EmptyStateProps {
  type?: 'search' | 'error' | 'empty';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * EmptyState 컴포넌트
 * 빈 상태나 에러 상태를 표시
 *
 * @features
 * - 다양한 상태 타입 (검색 결과 없음, 에러, 빈 목록)
 * - 커스텀 메시지
 * - 선택적 액션 버튼
 */
export function EmptyState({
  type = 'empty',
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'search':
        return <Search className="w-16 h-16 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-16 h-16 text-red-400" />;
      case 'empty':
      default:
        return <Inbox className="w-16 h-16 text-gray-400" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'search':
        return '검색 결과가 없습니다';
      case 'error':
        return '오류가 발생했습니다';
      case 'empty':
      default:
        return '데이터가 없습니다';
    }
  };

  const getDefaultDescription = () => {
    switch (type) {
      case 'search':
        return '다른 검색어를 시도하거나 필터를 조정해보세요.';
      case 'error':
        return '문제가 지속되면 관리자에게 문의해주세요.';
      case 'empty':
      default:
        return '아직 등록된 데이터가 없습니다.';
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px] px-4 text-center',
        className
      )}
    >
      <div className="mb-4">{getIcon()}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title || getDefaultTitle()}
      </h3>
      <p className="text-gray-600 max-w-md mb-6">
        {description || getDefaultDescription()}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
