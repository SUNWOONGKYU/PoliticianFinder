/** @type {import('next').NextConfig} */
const nextConfig = {
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

export default nextConfig;
