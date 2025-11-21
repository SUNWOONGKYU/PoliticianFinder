/**
 * Project Grid Task ID: P1F1
 * 작업명: 전역 레이아웃 (Header, Footer, Navigation)
 * 생성시간: 2025-11-03
 * 생성자: ui-designer (1차 실행)
 * 의존성: P1BI1
 * 설명: 모든 페이지에 공통적으로 적용되는 최상위 레이아웃입니다.
 *      Blue 테마 기반 헤더, 모바일 메뉴, 푸터를 포함합니다.
 *      프로토타입: 0-2_UIUX_Design/prototypes/html/base-template.html
 */

import './globals.css';
import dynamic from 'next/dynamic';
import Footer from './components/footer';

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
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-50" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
// Force rebuild 2025년 11월 22일 토 오전  6:58:42
