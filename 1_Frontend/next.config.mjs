import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
// Build cache invalidation: 2025-12-18T15:50:00
const nextConfig = {
  // Force rebuild
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  // 이미지 최적화
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.brandfetch.io' },
      { protocol: 'https', hostname: 'cdn.simpleicons.org' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'www.assembly.go.kr' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
    // WebP 자동 변환
    formats: ['image/avif', 'image/webp'],
    // 이미지 캐싱 (1년)
    minimumCacheTTL: 31536000,
    // 디바이스 사이즈
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // 압축 활성화
  compress: true,

  // 빌드 최적화
  swcMinify: true,

  // 서버 전용 패키지 (클라이언트 번들에서 제외)
  serverExternalPackages: [
    'puppeteer',
    '@anthropic-ai/sdk',
    'openai',
    '@google/generative-ai',
    'nodemailer',
    'pg',
    'sharp',
  ],

  // 실험적 기능
  experimental: {
    // 번들 최적화
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@supabase/supabase-js',
    ],
  },

  // 헤더 설정 (캐싱)
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

// Sentry 설정
const sentryWebpackPluginOptions = {
  // 소스맵 업로드 비활성화 (프로덕션 배포 시 활성화)
  silent: true,

  // 조직 및 프로젝트 (환경변수에서 가져옴)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Sentry CLI로 소스맵 업로드 (SENTRY_AUTH_TOKEN 필요)
  // 배포 시 자동 업로드를 원하면 true로 변경
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,

  // 소스맵 숨기기 (보안)
  hideSourceMaps: true,

  // 번들 크기 분석 비활성화
  widenClientFileUpload: true,
};

// Sentry DSN이 있을 때만 Sentry 래핑
const config = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;

export default config;
