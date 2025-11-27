/**
 * Project Grid Task ID: P1F1, P5M9
 * 작업명: 전역 레이아웃 (Header, Footer, Navigation) + 다크모드 지원
 * 생성시간: 2025-11-03
 * 수정시간: 2025-11-27 (성능 최적화: Next.js Font 사용)
 * 생성자: ui-designer (1차 실행), Claude Code (다크모드, 성능 최적화)
 * 의존성: P1BI1
 * 설명: 모든 페이지에 공통적으로 적용되는 최상위 레이아웃입니다.
 *      Blue 테마 기반 헤더, 모바일 메뉴, 푸터를 포함합니다.
 *      다크모드 지원 (ThemeProvider 적용)
 *      성능 최적화: Next.js Font로 폰트 로딩 최적화
 *      프로토타입: 0-2_UIUX_Design/prototypes/html/base-template.html
 */

import './globals.css';
import dynamic from 'next/dynamic';
import Footer from './components/footer';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ScrollToTop from '@/components/ui/ScrollToTop';

// Header를 클라이언트 전용으로 로드 (Hydration 에러 방지)
const Header = dynamic(() => import('./components/header'), { ssr: false });

export const metadata = {
  title: 'PoliticianFinder - 훌륭한 정치인 찾기',
  description: 'AI 기반 정치인 평가 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 폰트 최적화: preconnect로 연결 사전 설정 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* 다크모드 깜빡임 방지 스크립트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('politicianfinder-theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-gray-50 dark:bg-slate-900 transition-colors duration-300 overflow-x-hidden" style={{ fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <ThemeProvider defaultTheme="system">
          <div className="min-h-screen flex flex-col overflow-x-hidden">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          {/* 전역 스크롤 Top 버튼 */}
          <ScrollToTop showAfter={400} bottomOffset={24} />
        </ThemeProvider>
      </body>
    </html>
  );
}
// Force rebuild 2025년 11월 22일 토 오전  6:58:42
