/**
 * Web App Manifest
 * P4F2: Lighthouse 90+ PWA Optimization
 *
 * Provides metadata for Progressive Web App functionality
 */

import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '정치인 찾기 - PoliticianFinder',
    short_name: '정치인 찾기',
    description: '대한민국 정치인 정보 검색 플랫폼',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['politics', 'news', 'government'],
    lang: 'ko',
    dir: 'ltr',
  }
}
