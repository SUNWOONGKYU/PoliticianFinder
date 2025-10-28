/**
 * XSS Protection Module
 * 작업 ID: P3S1
 * 작성일: 2025-01-17
 *
 * OWASP XSS Prevention Cheat Sheet 기반 구현
 * https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * XSS 방어 설정
 */
const XSS_CONFIG = {
  // 허용할 HTML 태그
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'h3', 'h4', 'h5', 'h6'
  ],

  // 허용할 속성
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'class'
  ],

  // 허용할 URI 스킴
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,

  // 위험한 태그 (완전 제거)
  FORBID_TAGS: [
    'script', 'style', 'iframe', 'object', 'embed',
    'form', 'input', 'button', 'select', 'textarea'
  ],

  // 위험한 속성 (완전 제거)
  FORBID_ATTR: [
    'onerror', 'onload', 'onclick', 'onmouseover',
    'onfocus', 'onblur', 'onchange', 'onsubmit'
  ]
};

/**
 * HTML 새니타이징 함수
 * 사용자 입력에서 위험한 HTML/JavaScript 제거
 */
export function sanitizeHtml(dirty: string, options?: Partial<typeof XSS_CONFIG>): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  const config = { ...XSS_CONFIG, ...options };

  // DOMPurify 설정
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: config.ALLOWED_TAGS,
    ALLOWED_ATTR: config.ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: config.ALLOWED_URI_REGEXP,
    FORBID_TAGS: config.FORBID_TAGS,
    FORBID_ATTR: config.FORBID_ATTR,
    KEEP_CONTENT: true,
    IN_PLACE: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    SAFE_FOR_TEMPLATES: true,
    SANITIZE_DOM: true,
    WHOLE_DOCUMENT: false
  });

  return clean;
}

/**
 * 텍스트 전용 새니타이징
 * 모든 HTML 태그 제거, 텍스트만 추출
 */
export function sanitizeText(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // 모든 HTML 태그 제거
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });

  return clean.trim();
}

/**
 * URL 새니타이징
 * JavaScript 프로토콜 등 위험한 URL 차단
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '#';
  }

  // 위험한 프로토콜 차단
  const BLOCKED_PROTOCOLS = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:'
  ];

  const trimmedUrl = url.trim().toLowerCase();

  for (const protocol of BLOCKED_PROTOCOLS) {
    if (trimmedUrl.startsWith(protocol)) {
      console.warn(`Blocked dangerous URL protocol: ${protocol}`);
      return '#';
    }
  }

  // 상대 경로는 그대로 반환
  if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('#')) {
    return url;
  }

  // HTTP(S) URL 검증
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return '#';
    }
    return url;
  } catch {
    // URL 파싱 실패 시 안전한 기본값 반환
    return '#';
  }
}

/**
 * JSON 새니타이징
 * JSON 문자열 내 XSS 공격 벡터 제거
 */
export function sanitizeJson<T = any>(json: string): T | null {
  try {
    const parsed = JSON.parse(json);
    return sanitizeObject(parsed);
  } catch (error) {
    console.error('Invalid JSON:', error);
    return null;
  }
}

/**
 * 객체 재귀적 새니타이징
 */
function sanitizeObject<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeText(obj) as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as any;
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // 키 이름도 새니타이징
        const safeKey = sanitizeText(key);
        sanitized[safeKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * 파일명 새니타이징
 * 파일 업로드 시 안전한 파일명 생성
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'file';
  }

  // 위험한 문자 제거
  const safe = filename
    .replace(/[^a-zA-Z0-9가-힣.\-_]/g, '_')
    .replace(/\.{2,}/g, '_')
    .replace(/^\./, '_');

  // 확장자 검증
  const parts = safe.split('.');
  if (parts.length > 1) {
    const ext = parts[parts.length - 1].toLowerCase();
    const BLOCKED_EXTENSIONS = [
      'exe', 'bat', 'cmd', 'sh', 'ps1', 'app',
      'vbs', 'js', 'jar', 'com', 'scr', 'msi'
    ];

    if (BLOCKED_EXTENSIONS.includes(ext)) {
      parts[parts.length - 1] = 'txt';
    }
  }

  return parts.join('.');
}

/**
 * SQL Injection 방어용 이스케이프
 * 주의: 가능하면 Prepared Statements 사용 권장
 */
export function escapeSql(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/"/g, '""')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x00/g, '\\x00')
    .replace(/\x1a/g, '\\x1a');
}

/**
 * 입력 길이 제한 검증
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string = 'Input'
): { valid: boolean; error?: string } {
  if (!value || typeof value !== 'string') {
    return {
      valid: false,
      error: `${fieldName} is required`
    };
  }

  const length = value.trim().length;

  if (length < min) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${min} characters`
    };
  }

  if (length > max) {
    return {
      valid: false,
      error: `${fieldName} must not exceed ${max} characters`
    };
  }

  return { valid: true };
}

/**
 * 이메일 검증 (OWASP 권장)
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // OWASP 권장 이메일 정규식
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return emailRegex.test(email) && email.length <= 254;
}

/**
 * 전화번호 검증
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // 한국 전화번호 형식
  const phoneRegex = /^01[0-9]{1}-?[0-9]{3,4}-?[0-9]{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * 안전한 정규식 검증
 * ReDoS(Regular Expression Denial of Service) 방지
 */
export function safeRegexTest(pattern: string, value: string, timeout: number = 1000): boolean {
  try {
    const startTime = Date.now();
    const regex = new RegExp(pattern);
    const result = regex.test(value);

    if (Date.now() - startTime > timeout) {
      console.warn('Regex execution took too long, possible ReDoS');
      return false;
    }

    return result;
  } catch (error) {
    console.error('Invalid regex pattern:', error);
    return false;
  }
}

/**
 * React 컴포넌트용 안전한 HTML 렌더링 헬퍼
 */
export function createSafeHtml(dirty: string) {
  return {
    __html: sanitizeHtml(dirty)
  };
}

/**
 * 보안 로깅 (민감한 정보 제거)
 */
export function secureLog(message: string, data?: any) {
  // 민감한 정보 마스킹
  const SENSITIVE_KEYS = [
    'password', 'token', 'secret', 'api_key',
    'credit_card', 'ssn', 'pin'
  ];

  const sanitizedData = data ? sanitizeObject(data) : undefined;

  if (sanitizedData && typeof sanitizedData === 'object') {
    for (const key of SENSITIVE_KEYS) {
      if (key in sanitizedData) {
        sanitizedData[key] = '***REDACTED***';
      }
    }
  }

  console.log(message, sanitizedData || '');
}

/**
 * XSS 필터 초기화 (앱 시작 시 실행)
 */
export function initializeXssProtection() {
  // DOMPurify 글로벌 설정
  if (typeof window !== 'undefined') {
    // CSP 보고 URL 설정
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      // 외부 링크에 보안 속성 추가
      if (node.tagName === 'A' && node.hasAttribute('href')) {
        const href = node.getAttribute('href') || '';
        if (href.startsWith('http') && !href.includes(window.location.hostname)) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }
    });

    console.log('XSS Protection initialized');
  }
}

export default {
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeJson,
  sanitizeFilename,
  escapeSql,
  validateLength,
  validateEmail,
  validatePhone,
  safeRegexTest,
  createSafeHtml,
  secureLog,
  initializeXssProtection
};