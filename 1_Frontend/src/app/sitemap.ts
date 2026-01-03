/**
 * SEO: Dynamic Sitemap Generator
 * 작업일: 2026-01-03
 * 설명: Next.js App Router의 동적 사이트맵 생성
 */

import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://politicianfinder.com';

export default function sitemap(): MetadataRoute.Sitemap {
  // 정적 페이지 목록
  const staticPages = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${siteUrl}/politicians`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${siteUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    },
    {
      url: `${siteUrl}/connection`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${siteUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${siteUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // TODO: 동적 정치인 페이지 추가 (DB에서 가져오기)
  // const politicians = await fetchPoliticians();
  // const politicianPages = politicians.map((p) => ({
  //   url: `${siteUrl}/politicians/${p.id}`,
  //   lastModified: p.updatedAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.8,
  // }));

  return [...staticPages];
}
