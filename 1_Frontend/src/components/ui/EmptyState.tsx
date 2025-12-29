/**
 * EmptyState Component
 * 데이터가 없을 때 표시되는 빈 상태 컴포넌트
 */

import React from 'react';
import Link from 'next/link';

export interface EmptyStateProps {
  /** 아이콘 (이모지 또는 React 노드) */
  icon?: React.ReactNode;
  /** 제목 */
  title: string;
  /** 설명 */
  description?: string;
  /** 액션 버튼 */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 추가 클래스 */
  className?: string;
}

const sizeStyles = {
  sm: {
    container: 'py-8',
    icon: 'text-3xl',
    title: 'text-base',
    description: 'text-sm',
    button: 'px-3 py-1.5 text-sm',
  },
  md: {
    container: 'py-12',
    icon: 'text-5xl',
    title: 'text-lg',
    description: 'text-base',
    button: 'px-4 py-2 text-base',
  },
  lg: {
    container: 'py-16',
    icon: 'text-6xl',
    title: 'text-xl',
    description: 'text-lg',
    button: 'px-6 py-3 text-lg',
  },
};

export default function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const styles = sizeStyles[size];

  const ActionButton = () => {
    const buttonClassName = `${styles.button} bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center min-h-[44px]`;

    if (action?.href) {
      return (
        <Link href={action.href} className={buttonClassName}>
          {action.label}
        </Link>
      );
    }

    if (action?.onClick) {
      return (
        <button onClick={action.onClick} className={buttonClassName}>
          {action.label}
        </button>
      );
    }

    return null;
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${styles.container} ${className}`}
    >
      {/* 아이콘 */}
      <div className={`${styles.icon} mb-4`} aria-hidden="true">
        {icon}
      </div>

      {/* 제목 */}
      <h3 className={`${styles.title} font-semibold text-gray-900 dark:text-gray-100 mb-2`}>
        {title}
      </h3>

      {/* 설명 */}
      {description && (
        <p className={`${styles.description} text-gray-500 dark:text-gray-400 mb-6 max-w-md`}>
          {description}
        </p>
      )}

      {/* 액션 버튼 */}
      {action && <ActionButton />}
    </div>
  );
}

// 프리셋 Empty States
export const EmptyStatePresets = {
  /** 검색 결과 없음 */
  NoSearchResults: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="🔍"
      title="검색 결과가 없습니다"
      description="다른 검색어로 다시 시도해보세요."
      {...props}
    />
  ),

  /** 게시글 없음 */
  NoPosts: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="📝"
      title="게시글이 없습니다"
      description="첫 번째 게시글을 작성해보세요!"
      action={{ label: '글 작성하기', href: '/community/posts/create' }}
      {...props}
    />
  ),

  /** 댓글 없음 */
  NoComments: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="💬"
      title="댓글이 없습니다"
      description="첫 번째 댓글을 남겨보세요."
      size="sm"
      {...props}
    />
  ),

  /** 즐겨찾기 없음 */
  NoFavorites: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="⭐"
      title="즐겨찾기가 없습니다"
      description="관심있는 정치인을 즐겨찾기에 추가해보세요."
      action={{ label: '정치인 찾기', href: '/politicians' }}
      {...props}
    />
  ),

  /** 알림 없음 */
  NoNotifications: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="🔔"
      title="알림이 없습니다"
      description="새로운 알림이 오면 여기에 표시됩니다."
      size="sm"
      {...props}
    />
  ),

  /** 데이터 없음 (일반) */
  NoData: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="📭"
      title="데이터가 없습니다"
      description="표시할 데이터가 없습니다."
      {...props}
    />
  ),

  /** 정치인 없음 */
  NoPoliticians: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="🏛️"
      title="정치인을 찾을 수 없습니다"
      description="검색 조건을 변경해보세요."
      {...props}
    />
  ),

  /** 팔로잉 없음 */
  NoFollowing: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="👥"
      title="팔로잉이 없습니다"
      description="다른 사용자를 팔로우해보세요."
      {...props}
    />
  ),

  /** 팔로워 없음 */
  NoFollowers: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="👤"
      title="팔로워가 없습니다"
      description="활발한 활동으로 팔로워를 늘려보세요."
      {...props}
    />
  ),

  /** 에러 상태 */
  Error: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="❌"
      title="문제가 발생했습니다"
      description="잠시 후 다시 시도해주세요."
      action={{ label: '새로고침', onClick: () => window.location.reload() }}
      {...props}
    />
  ),
};
