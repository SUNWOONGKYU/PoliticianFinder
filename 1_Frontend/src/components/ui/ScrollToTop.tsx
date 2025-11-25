/**
 * Project Grid Task ID: MI6
 * 작업명: 스크롤 Top 버튼 구현
 * 생성시간: 2025-11-25
 * 생성자: Claude Code
 * 설명: 스크롤 시 나타나는 상단 이동 버튼 (다크모드 지원)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface ScrollToTopProps {
  /** 버튼이 나타나는 스크롤 위치 (px) */
  showAfter?: number;
  /** 버튼 위치 (right 또는 left) */
  position?: 'right' | 'left';
  /** 하단 여백 (px) */
  bottomOffset?: number;
  /** 추가 클래스명 */
  className?: string;
}

export default function ScrollToTop({
  showAfter = 400,
  position = 'right',
  bottomOffset = 24,
  className = ''
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // 스크롤 위치 감지
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollTop > showAfter);

      // 스크롤 중 표시
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 초기 상태 설정

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [showAfter]);

  // 상단으로 스크롤
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // 키보드 접근성
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToTop();
    }
  }, [scrollToTop]);

  if (!isVisible) return null;

  const positionClass = position === 'right' ? 'right-6' : 'left-6';

  return (
    <button
      onClick={scrollToTop}
      onKeyDown={handleKeyDown}
      className={`
        fixed ${positionClass} z-30
        w-12 h-12 min-w-touch min-h-touch
        bg-white dark:bg-gray-800
        text-gray-600 dark:text-gray-300
        border-2 border-gray-200 dark:border-gray-600
        rounded-full shadow-lg
        hover:bg-gray-100 dark:hover:bg-gray-700
        hover:shadow-xl hover:scale-110
        active:scale-95
        transition-all duration-300
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${isScrolling ? 'opacity-100' : 'opacity-70 hover:opacity-100'}
        ${className}
      `}
      style={{ bottom: `${bottomOffset}px` }}
      aria-label="페이지 상단으로 이동"
      title="맨 위로"
      role="button"
      tabIndex={0}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
}

/**
 * 사용 예시:
 *
 * // 기본 사용
 * <ScrollToTop />
 *
 * // 커스텀 옵션
 * <ScrollToTop
 *   showAfter={300}
 *   position="left"
 *   bottomOffset={80}
 * />
 *
 * // 레이아웃에 추가 (layout.tsx)
 * import ScrollToTop from '@/components/ui/ScrollToTop';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <ScrollToTop />
 *       </body>
 *     </html>
 *   );
 * }
 */
