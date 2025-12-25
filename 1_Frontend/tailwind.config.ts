/**
 * Project Grid Task ID: P1O1
 * 작업명: 프로젝트 초기화
 * 생성시간: 2025-11-01
 * 생성자: Gemini
 * 의존성: 없음
 * 설명: Tailwind CSS의 설정을 정의합니다. 프로젝트의 커스텀 테마(색상, 폰트 등)를 포함합니다.
 */
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Safelist for dynamically generated classes (party gradients in compare page)
  safelist: [
    'from-blue-400', 'to-blue-600',
    'from-red-400', 'to-red-600',
    'from-yellow-400', 'to-yellow-600',
    'from-gray-400', 'to-gray-600',
    'bg-gradient-to-br',
  ],
  darkMode: 'class',  // 클래스 기반 다크모드 활성화
  theme: {
    // 모바일 최적화: 커스텀 breakpoints
    screens: {
      'xs': '320px',    // 소형 모바일 (iPhone SE)
      'sm': '480px',    // 대형 모바일
      'md': '768px',    // 태블릿
      'lg': '1024px',   // 데스크탑
      'xl': '1280px',   // 대형 데스크탑
      '2xl': '1536px',  // 초대형 화면
    },
    extend: {
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      minHeight: {
        'touch': '44px',  // WCAG 터치 타겟 최소 크기
      },
      minWidth: {
        'touch': '44px',  // WCAG 터치 타겟 최소 크기
      },
      // 모바일 최적화: 터치 및 Safe Area spacing
      spacing: {
        'touch': '44px',      // 터치 타겟 크기
        'touch-lg': '48px',   // 큰 터치 타겟
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      fontSize: {
        // Display (히어로 섹션, 랜딩)
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],  // 72px
        'display-xl': ['3.75rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],  // 60px
        'display-lg': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],     // 48px

        // Heading (섹션 제목)
        'heading-xl': ['2.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],  // 36px
        'heading-lg': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }], // 30px
        'heading-md': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],                             // 24px
        'heading-sm': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],                            // 20px

        // Body (본문)
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],  // 18px
        'body-md': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],      // 16px
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],  // 14px

        // Label (레이블, 캡션)
        'label-lg': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],    // 14px
        'label-md': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],     // 12px
        'label-sm': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500' }],   // 11px
      },
      colors: {
        // 주황색 메인 컬러
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // 주황색 메인
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // 보라색 세컨더리 컬러
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',  // 보라색
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // 에메랄드 그린 악센트 컬러 - AI 평가 점수 강조 (WCAG AA 대비 충족)
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',  // 밝은 에메랄드 (WCAG AA 대비 충족)
          600: '#059669',  // 기본 사용 색상
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',  // 어두운 에메랄드 (다크모드용)
        },
        // 관리자 대시보드 전용 색상
        admin: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      // 커스텀 애니메이션
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'slide-in-up': 'slide-in-up 0.3s ease-out',
        'slide-in-down': 'slide-in-down 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'bounce-in': 'bounce-in 0.5s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
