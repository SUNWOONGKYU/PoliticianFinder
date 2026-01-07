/**
 * PWA: Web App Manifest
 * 작업일: 2026-01-03
 * 설명: Next.js App Router의 동적 Web App Manifest 생성
 *       모바일에서 홈 화면에 추가 시 네이티브 앱처럼 작동
 */

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PoliticianFinder - 훌륭한 정치인 찾기',
    short_name: 'PoliticianFinder',
    description: 'AI 기반 정치인 평가 플랫폼. 객관적인 데이터로 정치인의 활동, 공약 이행률, 청렴도를 분석합니다.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f97316', // Primary orange color
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'ko',
    categories: ['news', 'politics', 'social'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    // 스크린샷 및 바로가기는 해당 파일 생성 후 활성화
    shortcuts: [
      {
        name: '정치인 검색',
        short_name: '검색',
        description: '정치인을 검색합니다',
        url: '/politicians',
      },
      {
        name: '커뮤니티',
        short_name: '커뮤니티',
        description: '커뮤니티 게시판',
        url: '/community',
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
