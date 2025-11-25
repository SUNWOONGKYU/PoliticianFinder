/**
 * Task ID: P5M9
 * 작업명: M9 - 다크모드 구현
 * 작업일: 2025-11-25
 * 설명: 다크모드 상태 관리를 위한 Context 및 Provider
 *       - 시스템 설정 감지
 *       - localStorage 영속성
 *       - 부드러운 전환 효과
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  /**
   * 현재 설정된 테마 ('light' | 'dark' | 'system')
   */
  theme: Theme;

  /**
   * 실제 적용된 테마 ('light' | 'dark')
   * system 설정일 경우 시스템 설정에 따라 결정됨
   */
  resolvedTheme: 'light' | 'dark';

  /**
   * 테마 변경 함수
   */
  setTheme: (theme: Theme) => void;

  /**
   * 다크모드 토글 함수
   */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'politicianfinder-theme';

/**
 * 시스템 다크모드 설정 감지
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * localStorage에서 저장된 테마 가져오기
 */
function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return null;
}

/**
 * 실제 적용할 테마 결정
 */
function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  /**
   * 기본 테마 (기본값: 'system')
   */
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // 초기 테마 설정 (클라이언트에서만 실행)
  useEffect(() => {
    const stored = getStoredTheme();
    const initialTheme = stored || defaultTheme;
    setThemeState(initialTheme);
    setResolvedTheme(resolveTheme(initialTheme));
    setMounted(true);
  }, [defaultTheme]);

  // 테마 변경 시 DOM 클래스 업데이트
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);

    // 부드러운 전환을 위한 transition 클래스 추가
    root.classList.add('theme-transition');

    // 테마 클래스 적용
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 전환 완료 후 transition 클래스 제거
    const timeout = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);

    return () => clearTimeout(timeout);
  }, [theme, mounted]);

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        setResolvedTheme(getSystemTheme());

        // DOM 클래스 업데이트
        const root = document.documentElement;
        if (getSystemTheme() === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // 테마 설정 함수
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, []);

  // 테마 토글 함수
  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  // SSR 중에는 기본 테마로 렌더링
  const value: ThemeContextType = {
    theme,
    resolvedTheme: mounted ? resolvedTheme : 'light',
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * 테마 컨텍스트 사용 훅
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { ThemeContext };
