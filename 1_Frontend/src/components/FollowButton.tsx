// P3BA36: 팔로우 버튼 컴포넌트
// 회원 간 팔로우/언팔로우 기능 제공

'use client';

import { useState, useEffect } from 'react';

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
  className?: string;
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing = false,
  onFollowChange,
  size = 'md',
  variant = 'default',
  className = '',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // 초기 팔로우 상태 확인
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const response = await fetch(`/api/users/${targetUserId}/follow`);
        const result = await response.json();
        if (result.success) {
          setIsFollowing(result.data.is_following);
        }
      } catch (error) {
        console.error('Failed to check follow status:', error);
      }
    };

    checkFollowStatus();
  }, [targetUserId]);

  const handleFollowToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const newFollowState = !isFollowing;
        setIsFollowing(newFollowState);
        onFollowChange?.(newFollowState);
      } else {
        // 로그인 필요 시 로그인 페이지로 이동
        if (response.status === 401) {
          alert('로그인이 필요합니다.');
          window.location.href = '/auth/login';
          return;
        }
        // 자기 자신 팔로우 시도
        if (result.error?.includes('자기 자신')) {
          alert('자기 자신은 팔로우할 수 없습니다.');
          return;
        }
        console.error('Follow toggle failed:', result.error);
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 사이즈별 클래스
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  // 버튼 상태별 스타일
  const getButtonStyle = () => {
    if (isLoading) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed';
    }

    if (isFollowing) {
      // 팔로잉 상태 (호버 시 언팔로우 표시)
      if (isHovering) {
        return 'bg-red-500 text-white hover:bg-red-600';
      }
      return 'bg-gray-200 text-gray-700 hover:bg-red-500 hover:text-white';
    }

    // 팔로우 버튼 - emerald 색상 통일
    return 'bg-emerald-600 text-white hover:bg-emerald-700';
  };

  const getButtonText = () => {
    if (isLoading) {
      return (
        <span className="flex items-center gap-1">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </span>
      );
    }

    if (isFollowing) {
      return isHovering ? '언팔로우' : '팔로잉';
    }

    return '팔로우';
  };

  return (
    <button
      onClick={handleFollowToggle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        ${getButtonStyle()}
        rounded-full font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-emerald-300
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {getButtonText()}
    </button>
  );
}
