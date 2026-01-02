/**
 * Project Grid Task ID: P1O1
 * Next.js configuration with WebAssembly support
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // WebAssembly 지원 (subset-font 라이브러리용)
  webpack: (config, { isServer }) => {
    // WebAssembly 실험적 기능 활성화
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // .wasm 파일 처리
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    return config;
  },
};

export default nextConfig;
