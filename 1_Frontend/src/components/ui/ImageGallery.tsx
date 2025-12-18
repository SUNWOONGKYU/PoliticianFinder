/**
 * 이미지 갤러리 컴포넌트 with 스와이프 지원
 * 모바일 터치 스와이프 및 데스크톱 네비게이션 버튼 제공
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';

/**
 * URL이 유효한 이미지 URL인지 검증 (XSS 방지)
 */
const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;

  // 허용되는 프로토콜만 허용
  const allowedProtocols = ['http://', 'https://', '/'];
  const isAllowedProtocol = allowedProtocols.some(protocol =>
    url.startsWith(protocol)
  );

  // data: URL은 이미지 mime 타입만 허용
  const isValidDataUrl = url.startsWith('data:image/');

  return isAllowedProtocol || isValidDataUrl;
};

export interface ImageGalleryProps {
  /**
   * 이미지 URL 배열
   */
  images: string[];

  /**
   * 이미지 alt 텍스트 (접근성)
   */
  alt?: string;

  /**
   * 갤러리 높이 (Tailwind 클래스)
   */
  height?: string;

  /**
   * 썸네일 표시 여부
   */
  showThumbnails?: boolean;

  /**
   * 자동 재생 여부
   */
  autoPlay?: boolean;

  /**
   * 자동 재생 간격 (ms)
   */
  autoPlayInterval?: number;

  /**
   * 추가 클래스명
   */
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  alt = '이미지',
  height = 'h-96',
  showThumbnails = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  // 최소 스와이프 거리 (px)
  const minSwipeDistance = 50;

  // 이미지가 없으면 렌더링하지 않음
  if (!images || images.length === 0) {
    return null;
  }

  // 유효한 이미지 URL만 필터링 (XSS 방지)
  const validImages = images.filter(isValidImageUrl);

  // 유효한 이미지가 없으면 렌더링하지 않음
  if (validImages.length === 0) {
    return null;
  }

  // currentIndex가 유효 범위 내인지 확인
  const safeCurrentIndex = Math.min(currentIndex, validImages.length - 1);

  // 자동 재생
  useEffect(() => {
    if (!autoPlay || validImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, validImages.length]);

  // 이전 이미지
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  }, [validImages.length]);

  // 다음 이미지
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  }, [validImages.length]);

  // 터치 시작
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  // 터치 이동
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  // 터치 종료
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // 모달 내 포커스 가능한 요소들의 ref
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 키보드 네비게이션 및 Focus Trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key === 'Tab' && isFullscreen && modalRef.current) {
        // Focus trap: 모달 내 요소들 사이에서만 탭 이동
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: 첫 요소에서 마지막으로 이동
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: 마지막 요소에서 첫 요소로 이동
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    if (isFullscreen) {
      // 모달 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      // 모달 열릴 때 닫기 버튼에 포커스
      closeButtonRef.current?.focus();

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isFullscreen, goToPrevious, goToNext]);

  // 단일 이미지인 경우 간단한 표시
  if (validImages.length === 1) {
    return (
      <div className={`relative ${height} rounded-lg overflow-hidden ${className}`}>
        <img
          src={validImages[0]}
          alt={alt}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => setIsFullscreen(true)}
        />
      </div>
    );
  }

  return (
    <>
      {/* 갤러리 컨테이너 */}
      <div className={`relative ${height} ${className}`} ref={galleryRef}>
        {/* 이미지 슬라이더 */}
        <div
          className="relative w-full h-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* 현재 이미지 */}
          <div className="w-full h-full">
            <img
              src={validImages[safeCurrentIndex]}
              alt={`${alt} ${safeCurrentIndex + 1}`}
              className="w-full h-full object-cover cursor-pointer transition-opacity duration-300"
              onClick={() => setIsFullscreen(true)}
            />
          </div>

          {/* 이미지 카운터 */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm font-medium">
            {safeCurrentIndex + 1} / {validImages.length}
          </div>

          {/* 네비게이션 버튼 - 모바일/데스크톱 모두 표시 */}
          {validImages.length > 1 && (
            <>
              {/* 이전 버튼 */}
              <button
                onClick={goToPrevious}
                className="flex absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="이전 이미지"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* 다음 버튼 */}
              <button
                onClick={goToNext}
                className="flex absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="다음 이미지"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* 스와이프 힌트 제거 - 네비게이션 버튼으로 대체됨 */}
        </div>

        {/* 썸네일 - Desktop */}
        {showThumbnails && validImages.length > 1 && (
          <div className="hidden md:flex gap-2 mt-3 overflow-x-auto pb-2">
            {validImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ${
                  index === safeCurrentIndex
                    ? 'ring-2 ring-primary-500 ring-offset-2'
                    : 'opacity-60 hover:opacity-100'
                }`}
                aria-label={`이미지 ${index + 1}로 이동`}
              >
                <img
                  src={image}
                  alt={`썸네일 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* 인디케이터 - Mobile */}
        {validImages.length > 1 && (
          <div className="md:hidden flex justify-center gap-2 mt-3">
            {validImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === safeCurrentIndex
                    ? 'bg-primary-500 w-8'
                    : 'bg-gray-300'
                }`}
                aria-label={`이미지 ${index + 1}로 이동`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 전체화면 모달 */}
      {isFullscreen && (
        <div
          ref={modalRef}
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="이미지 전체화면 보기"
        >
          {/* 닫기 버튼 - 안전영역 대응 (iPhone notch 등) */}
          <button
            ref={closeButtonRef}
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-4 w-12 h-12 flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full transition-all z-10"
            aria-label="전체화면 닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 전체화면 이미지 */}
          <div
            className="relative max-w-7xl max-h-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={validImages[safeCurrentIndex]}
              alt={`${alt} ${safeCurrentIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
            />

            {/* 전체화면 네비게이션 */}
            {validImages.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full transition-all"
                  aria-label="이전 이미지"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full transition-all"
                  aria-label="다음 이미지"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* 전체화면 카운터 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-full text-sm font-medium">
              {safeCurrentIndex + 1} / {validImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
