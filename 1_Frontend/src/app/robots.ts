/**
 * SEO: Robots.txt Generator
 * 작업일: 2026-01-03
 * 설명: Next.js App Router의 동적 robots.txt 생성
 */

import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://politicianfinder.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // API 엔드포인트 제외
          '/mypage/',        // 마이페이지 제외 (로그인 필요)
          '/notifications/', // 알림 페이지 제외 (개인정보)
          '/auth/',          // 인증 페이지 제외
          '/_next/',         // Next.js 내부 파일 제외
          '/admin/',         // 관리자 페이지 제외
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/mypage/', '/notifications/', '/auth/', '/admin/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
