/**
 * Project Grid Task ID: MI5
 * 작업명: Pull to Refresh 구현
 * 생성시간: 2025-11-25
 * 생성자: Claude Code
 * 설명: 모바일에서 당겨서 새로고침 기능을 제공하는 컴포넌트
 */

'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';

interface PullToRefreshProps {
  /** 새로고침 시 실행할 비동기 함수 */
  onRefresh: () => Promise<void>;
  /** 감싸질 자식 컴포넌트 */
  children: ReactNode;
  /** 당기기 시작 임계값 (px) */
  pullThreshold?: number;
  /** 최대 당김 거리 (px) */
  maxPullDistance?: number;
  /** 새로고침 중 텍스트 */
  refreshingText?: string;
  /** 당기는 중 텍스트 */
  pullingText?: string;
  /** 놓으면 새로고침 텍스트 */
  releaseText?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 추가 클래스명 */
  className?: string;
}

export default function PullToRefresh({
  onRefresh,
  children,
  pullThreshold = 80,
  maxPullDistance = 120,
  refreshingText = '새로고침 중...',
  pullingText = '당겨서 새로고침',
  releaseText = '놓으면 새로고침',
  disabled = false,
  className = ''
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  // 터치 시작
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;

    // 스크롤이 맨 위에 있을 때만 작동
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 0) return;

    startYRef.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing]);

  // 터치 이동
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;

    currentYRef.current = e.touches[0].clientY;
    const diff = currentYRef.current - startYRef.current;

    if (diff > 0) {
      // 저항감 적용 (당길수록 점점 어려워짐)
      const resistance = Math.min(diff * 0.5, maxPullDistance);
      setPullDistance(resistance);

      // 기본 스크롤 방지
      if (resistance > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, disabled, isRefreshing, maxPullDistance]);

  // 터치 종료
  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;

    setIsPulling(false);

    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(pullThreshold);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, disabled, pullDistance, pullThreshold, isRefreshing, onRefresh]);

  // 이벤트 리스너 등록
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // 진행률 계산 (0~1)
  const progress = Math.min(pullDistance / pullThreshold, 1);
  const shouldRelease = pullDistance >= pullThreshold;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pull indicator */}
      <div
        className={`absolute left-0 right-0 flex flex-col items-center justify-end overflow-hidden transition-opacity duration-200 ${
          pullDistance > 0 || isRefreshing ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          height: `${pullDistance}px`,
          top: 0,
          transform: 'translateY(-100%)',
          zIndex: 10
        }}
      >
        <div className="pb-3 flex flex-col items-center">
          {/* Spinner/Arrow */}
          <div
            className={`mb-2 transition-transform duration-200 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: !isRefreshing ? `rotate(${shouldRelease ? 180 : progress * 180}deg)` : undefined
            }}
          >
            {isRefreshing ? (
              <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24">
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
            ) : (
              <svg
                className="w-6 h-6 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            )}
          </div>

          {/* Text */}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isRefreshing
              ? refreshingText
              : shouldRelease
              ? releaseText
              : pullingText}
          </span>
        </div>
      </div>

      {/* Content with transform */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * 사용 예시:
 *
 * const [data, setData] = useState([]);
 *
 * const handleRefresh = async () => {
 *   const newData = await fetchData();
 *   setData(newData);
 * };
 *
 * <PullToRefresh onRefresh={handleRefresh}>
 *   <div className="min-h-screen">
 *     {data.map(item => <Item key={item.id} {...item} />)}
 *   </div>
 * </PullToRefresh>
 */
