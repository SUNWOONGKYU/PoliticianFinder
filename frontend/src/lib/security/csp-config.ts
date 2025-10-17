/**
 * Content Security Policy (CSP) Configuration
 * 작업 ID: P3S1
 * 작성일: 2025-01-17
 *
 * OWASP CSP Cheat Sheet 기반 구현
 * https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
 */

/**
 * CSP 지시자 타입 정의
 */
interface CspDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'media-src': string[];
  'object-src': string[];
  'frame-src': string[];
  'frame-ancestors': string[];
  'base-uri': string[];
  'form-action': string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
  'report-uri'?: string;
  'report-to'?: string;
}

/**
 * 환경별 CSP 설정
 */
const CSP_POLICIES: Record<'development' | 'production', Partial<CspDirectives>> = {
  development: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-eval'", // Next.js 개발 모드 필요
      "'unsafe-inline'", // 개발 편의를 위해 허용
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Tailwind CSS 인라인 스타일
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'http://localhost:*'
    ],
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net'
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'http://localhost:*',
      'ws://localhost:*'
    ],
    'media-src': ["'self'", 'blob:', 'data:'],
    'object-src': ["'none'"],
    'frame-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  },

  production: {
    'default-src': ["'none'"],
    'script-src': [
      "'self'",
      "'strict-dynamic'", // nonce 기반 동적 스크립트 로딩
      "'unsafe-inline'", // strict-dynamic 폴백
      'https://cdn.jsdelivr.net',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Tailwind CSS 필요
      'https://fonts.googleapis.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https://*.supabase.co',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com'
    ],
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com'
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://www.google-analytics.com',
      'https://vitals.vercel-insights.com'
    ],
    'media-src': ["'self'", 'https://*.supabase.co'],
    'object-src': ["'none'"],
    'frame-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': true,
    'block-all-mixed-content': true,
    'report-uri': '/api/security/csp-report',
    'report-to': 'csp-endpoint'
  }
};

/**
 * Nonce 생성 함수
 * 각 요청마다 고유한 nonce 생성
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
}

/**
 * CSP 헤더 문자열 생성
 */
export function generateCspHeader(
  env: 'development' | 'production' = 'production',
  nonce?: string
): string {
  const directives = CSP_POLICIES[env];
  const parts: string[] = [];

  for (const [key, value] of Object.entries(directives)) {
    if (value === undefined) continue;

    if (typeof value === 'boolean') {
      if (value) {
        parts.push(key);
      }
    } else if (typeof value === 'string') {
      parts.push(`${key} ${value}`);
    } else if (Array.isArray(value)) {
      let sources = [...value];

      // Nonce 추가 (script-src에만)
      if (key === 'script-src' && nonce) {
        sources = sources.map(src =>
          src === "'strict-dynamic'" ? `'nonce-${nonce}'` : src
        );
      }

      parts.push(`${key} ${sources.join(' ')}`);
    }
  }

  return parts.join('; ');
}

/**
 * CSP 보고서 엔드포인트 설정
 */
export function getCspReportTo(): string {
  return JSON.stringify({
    group: 'csp-endpoint',
    max_age: 86400,
    endpoints: [
      {
        url: '/api/security/csp-report'
      }
    ]
  });
}

/**
 * Next.js 미들웨어용 CSP 헤더 설정
 */
export function setCspHeaders(headers: Headers, nonce?: string) {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const cspHeader = generateCspHeader(env, nonce);

  // CSP 헤더 설정
  headers.set('Content-Security-Policy', cspHeader);

  // Report-To 헤더 설정 (프로덕션만)
  if (env === 'production') {
    headers.set('Report-To', getCspReportTo());
  }

  // 추가 보안 헤더
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // HSTS (프로덕션만)
  if (env === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
}

/**
 * CSP 위반 보고서 파싱
 */
export interface CspReport {
  'csp-report': {
    'document-uri': string;
    'referrer'?: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    'disposition': string;
    'blocked-uri'?: string;
    'line-number'?: number;
    'column-number'?: number;
    'source-file'?: string;
    'status-code'?: number;
    'script-sample'?: string;
  };
}

/**
 * CSP 위반 로깅
 */
export function logCspViolation(report: CspReport) {
  const violation = report['csp-report'];

  console.error('CSP Violation:', {
    directive: violation['violated-directive'],
    blockedUri: violation['blocked-uri'],
    documentUri: violation['document-uri'],
    sourceFile: violation['source-file'],
    lineNumber: violation['line-number'],
    columnNumber: violation['column-number'],
    sample: violation['script-sample']
  });

  // 프로덕션에서는 모니터링 서비스로 전송
  if (process.env.NODE_ENV === 'production') {
    // Sentry, LogRocket 등으로 전송
    // sendToMonitoring(violation);
  }
}

/**
 * 인라인 스크립트 해시 생성 (빌드 시 사용)
 */
export function generateScriptHash(scriptContent: string): string {
  if (typeof crypto === 'undefined') {
    throw new Error('Crypto API not available');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(scriptContent);

  return crypto.subtle.digest('SHA-256', data).then(hash => {
    const hashArray = Array.from(new Uint8Array(hash));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));
    return `'sha256-${hashBase64}'`;
  }) as any;
}

/**
 * CSP 메타 태그 생성 (클라이언트 사이드)
 */
export function createCspMetaTag(nonce?: string): HTMLMetaElement {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = generateCspHeader(
    process.env.NODE_ENV === 'production' ? 'production' : 'development',
    nonce
  );
  return meta;
}

export default {
  generateNonce,
  generateCspHeader,
  getCspReportTo,
  setCspHeaders,
  logCspViolation,
  generateScriptHash,
  createCspMetaTag
};