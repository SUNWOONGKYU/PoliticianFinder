/**
 * Project Grid Task ID: P1F1, P5M9
 * 작업명: 전역 레이아웃 (Header, Footer, Navigation) + 다크모드 지원
 * 생성시간: 2025-11-03
 * 수정시간: 2025-11-25 (다크모드 추가)
 * 수정시간: 2026-01-03 (next/font 폰트 최적화)
 * 생성자: ui-designer (1차 실행), Claude Code (다크모드, 폰트 최적화)
 * 의존성: P1BI1
 * 설명: 모든 페이지에 공통적으로 적용되는 최상위 레이아웃입니다.
 *      Blue 테마 기반 헤더, 모바일 메뉴, 푸터를 포함합니다.
 *      다크모드 지원 (ThemeProvider 적용)
 *      프로토타입: 0-2_UIUX_Design/prototypes/html/base-template.html
 */

import './globals.css';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Noto_Sans_KR } from 'next/font/google';
import Footer from './components/footer';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ScrollToTop from '@/components/ui/ScrollToTop';
import AnalyticsProvider from '@/components/providers/AnalyticsProvider';
import ProgressBarProvider from '@/components/providers/ProgressBarProvider';
import NotificationProvider from '@/components/NotificationProvider';

// 폰트 최적화: 빌드 타임에 폰트 다운로드, 자체 호스팅
const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

// Header를 클라이언트 전용으로 로드 (Hydration 에러 방지)
const Header = dynamic(() => import('./components/header'), { ssr: false });
// MobileTabBar - 모바일 하단 네비게이션
const MobileTabBar = dynamic(() => import('@/components/layout/MobileTabBar'), { ssr: false });

import type { Metadata, Viewport } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://politicianfinder.com';

// PWA: Viewport 설정
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f97316' },
    { media: '(prefers-color-scheme: dark)', color: '#1e293b' },
  ],
};

export const metadata: Metadata = {
  // 기본 메타데이터
  title: {
    default: 'PoliticianFinder - 훌륭한 정치인 찾기',
    template: '%s | PoliticianFinder',
  },
  description: 'AI 기반 정치인 평가 플랫폼. 객관적인 데이터로 정치인의 활동, 공약 이행률, 청렴도를 분석합니다.',
  keywords: ['정치인', '국회의원', 'AI 평가', '공약 이행률', '청렴도', '정치인 찾기', '정치인 평가'],
  authors: [{ name: 'PoliticianFinder Team' }],
  creator: 'PoliticianFinder',
  publisher: 'PoliticianFinder',

  // 기본 URL
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: 'PoliticianFinder',
    title: 'PoliticianFinder - 훌륭한 정치인 찾기',
    description: 'AI 기반 정치인 평가 플랫폼. 객관적인 데이터로 정치인의 활동, 공약 이행률, 청렴도를 분석합니다.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PoliticianFinder - 훌륭한 정치인 찾기',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'PoliticianFinder - 훌륭한 정치인 찾기',
    description: 'AI 기반 정치인 평가 플랫폼. 객관적인 데이터로 정치인을 분석합니다.',
    images: ['/og-image.png'],
  },

  // 로봇 설정
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // 아이콘
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },

  // 검증 (추후 설정)
  // verification: {
  //   google: 'google-site-verification-code',
  //   naver: 'naver-site-verification-code',
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning className={notoSansKr.className}>
      <head>
        {/* PWA: 모바일 웹앱 메타태그 */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PoliticianFinder" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

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
      <body className="bg-gray-50 dark:bg-slate-900 transition-colors duration-300 overflow-x-hidden">
        <ThemeProvider defaultTheme="system">
          <AnalyticsProvider>
            <NotificationProvider>
              <Suspense fallback={null}>
                <ProgressBarProvider>
                  <div className="min-h-screen flex flex-col overflow-x-hidden">
                    <Header />
                    <main className="flex-1">
                      {children}
                    </main>
                    <Footer />
                    <MobileTabBar />
                  </div>
                  {/* 전역 스크롤 Top 버튼 */}
                  <ScrollToTop showAfter={400} bottomOffset={24} />
                </ProgressBarProvider>
              </Suspense>
            </NotificationProvider>
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
// Force rebuild 2025년 11월 22일 토 오전  6:58:42
