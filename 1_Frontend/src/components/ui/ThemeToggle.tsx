/**
 * Task ID: P5M9
 * 작업명: M9 - 다크모드 토글 컴포넌트
 * 작업일: 2025-11-25
 * 설명: 다크모드 전환을 위한 접근성 친화적 토글 버튼
 *       - 애니메이션 아이콘 전환
 *       - 키보드 접근성 지원
 *       - 모바일 터치 최적화
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  /**
   * 버튼 크기 ('sm' | 'md' | 'lg')
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * 추가 클래스명
   */
  className?: string;

  /**
   * 확장 메뉴 표시 여부 (system 옵션 포함)
   */
  showMenu?: boolean;
}

const sizeStyles = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

// 태양 아이콘 (라이트 모드)
const SunIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

// 달 아이콘 (다크 모드)
const MoonIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

// 시스템 아이콘
const SystemIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'md',
  className = '',
  showMenu = false,
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // 외부 클릭 감지
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // ESC 키로 메뉴 닫기
  useEffect(() => {
    if (!showMenu || !isMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showMenu, isMenuOpen]);

  // 현재 테마에 따른 아이콘 결정
  const CurrentIcon = resolvedTheme === 'dark' ? MoonIcon : SunIcon;
  const iconClass = iconSizes[size];

  // 심플 토글 버튼 (메뉴 없이)
  if (!showMenu) {
    return (
      <button
        onClick={toggleTheme}
        className={`
          ${sizeStyles[size]}
          inline-flex items-center justify-center
          rounded-full
          bg-gray-100 dark:bg-gray-800
          hover:bg-gray-200 dark:hover:bg-gray-700
          text-gray-600 dark:text-gray-300
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-900
          ${className}
        `}
        aria-label={resolvedTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        title={resolvedTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      >
        {mounted ? (
          <div className="relative">
            {/* 아이콘 전환 애니메이션 */}
            <div
              className={`transform transition-all duration-300 ${
                resolvedTheme === 'dark'
                  ? 'rotate-0 opacity-100'
                  : 'rotate-90 opacity-0 absolute inset-0'
              }`}
            >
              <MoonIcon className={iconClass} />
            </div>
            <div
              className={`transform transition-all duration-300 ${
                resolvedTheme === 'light'
                  ? 'rotate-0 opacity-100'
                  : '-rotate-90 opacity-0 absolute inset-0'
              }`}
            >
              <SunIcon className={iconClass} />
            </div>
          </div>
        ) : (
          // SSR 중 플레이스홀더
          <div className={iconClass} />
        )}
      </button>
    );
  }

  // 메뉴 포함 토글 버튼
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`
          ${sizeStyles[size]}
          inline-flex items-center justify-center
          rounded-full
          bg-gray-100 dark:bg-gray-800
          hover:bg-gray-200 dark:hover:bg-gray-700
          text-gray-600 dark:text-gray-300
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-900
          ${className}
        `}
        aria-label="테마 설정"
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
      >
        {mounted ? <CurrentIcon className={iconClass} /> : <div className={iconClass} />}
      </button>

      {/* 드롭다운 메뉴 */}
      {isMenuOpen && (
        <div
          className="
            absolute right-0 mt-2 w-36
            bg-white dark:bg-gray-800
            rounded-lg shadow-lg
            border border-gray-200 dark:border-gray-700
            py-1 z-50
            animate-in fade-in slide-in-from-top-2 duration-200
          "
          role="menu"
          aria-orientation="vertical"
        >
          {/* 라이트 모드 */}
          <button
            onClick={() => {
              setTheme('light');
              setIsMenuOpen(false);
            }}
            className={`
              w-full px-4 py-2 text-left flex items-center gap-3
              text-sm text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-700
              ${theme === 'light' ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
            `}
            role="menuitem"
          >
            <SunIcon className="w-4 h-4" />
            <span>라이트</span>
            {theme === 'light' && (
              <span className="ml-auto text-primary-500">✓</span>
            )}
          </button>

          {/* 다크 모드 */}
          <button
            onClick={() => {
              setTheme('dark');
              setIsMenuOpen(false);
            }}
            className={`
              w-full px-4 py-2 text-left flex items-center gap-3
              text-sm text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-700
              ${theme === 'dark' ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
            `}
            role="menuitem"
          >
            <MoonIcon className="w-4 h-4" />
            <span>다크</span>
            {theme === 'dark' && (
              <span className="ml-auto text-primary-500">✓</span>
            )}
          </button>

          {/* 시스템 설정 */}
          <button
            onClick={() => {
              setTheme('system');
              setIsMenuOpen(false);
            }}
            className={`
              w-full px-4 py-2 text-left flex items-center gap-3
              text-sm text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-700
              ${theme === 'system' ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
            `}
            role="menuitem"
          >
            <SystemIcon className="w-4 h-4" />
            <span>시스템</span>
            {theme === 'system' && (
              <span className="ml-auto text-primary-500">✓</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
