/**
 * XSS 방지를 위한 HTML 이스케이프 및 새니타이징 유틸리티
 * 사용자 입력을 안전하게 렌더링하기 위해 HTML 특수문자를 이스케이프합니다.
 * DOMPurify를 사용한 강력한 XSS 방어 기능 포함
 * Updated: 2026-01-19 - DOMPurify 통합
 */

import DOMPurify from 'dompurify';

// HTML 특수문자 매핑
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * HTML 특수문자를 이스케이프하여 XSS 공격 방지
 * @param text 이스케이프할 텍스트
 * @returns 이스케이프된 안전한 텍스트
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text.replace(/[&<>"'`=/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * 텍스트의 줄바꿈을 <br> 태그로 변환 (안전하게)
 * HTML은 이스케이프하고 줄바꿈만 <br>로 변환
 * @param text 변환할 텍스트
 * @returns 안전하게 변환된 HTML 문자열
 */
export function textToSafeHtml(text: string): string {
  if (!text) return '';
  // 먼저 HTML 이스케이프 후 줄바꿈 변환
  return escapeHtml(text).replace(/\n/g, '<br>');
}

/**
 * 텍스트를 React 컴포넌트 배열로 변환 (줄바꿈 지원)
 * dangerouslySetInnerHTML 없이 안전하게 줄바꿈 렌더링
 * @param text 변환할 텍스트
 * @returns React 노드 배열
 */
export function textToNodes(text: string): (string | JSX.Element)[] {
  if (!text) return [];

  const lines = text.split('\n');
  const nodes: (string | JSX.Element)[] = [];

  lines.forEach((line, index) => {
    if (index > 0) {
      // React.createElement 대신 JSX를 사용할 수 없으므로
      // 이 함수는 컴포넌트에서 직접 사용하거나 별도 처리 필요
      nodes.push(line);
    } else {
      nodes.push(line);
    }
  });

  return nodes;
}

/**
 * URL을 안전하게 검증
 * javascript:, data: 등의 위험한 프로토콜 차단
 * @param url 검증할 URL
 * @returns 안전한 URL이면 원본, 아니면 '#'
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '#';

  const trimmedUrl = url.trim().toLowerCase();

  // 위험한 프로토콜 차단
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:'
  ];

  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return '#';
    }
  }

  // http://, https://, 상대 경로, / 로 시작하는 경로만 허용
  if (
    trimmedUrl.startsWith('http://') ||
    trimmedUrl.startsWith('https://') ||
    trimmedUrl.startsWith('/') ||
    !trimmedUrl.includes(':')
  ) {
    return url;
  }

  return '#';
}

/**
 * 사용자 입력에서 위험한 HTML 태그 제거
 * 완전한 sanitization이 필요하면 sanitizeHtmlWithDOMPurify 사용 권장
 * @param html HTML 문자열
 * @returns 태그가 제거된 텍스트
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  // 모든 HTML 태그 제거
  return html.replace(/<[^>]*>/g, '');
}

// ============================================================================
// DOMPurify 기반 강력한 XSS 방어 (2026-01-19 추가)
// ============================================================================

/**
 * DOMPurify를 사용하여 HTML을 새니타이징 (XSS 공격 방지)
 * 모든 위험한 태그와 속성을 제거합니다.
 *
 * @param dirty - 새니타이징할 HTML 문자열
 * @returns 새니타이징된 안전한 HTML 문자열
 *
 * @example
 * ```ts
 * const userInput = '<script>alert("XSS")</script><p>Safe text</p>';
 * const safe = sanitizeHtmlWithDOMPurify(userInput);
 * // Returns: '<p>Safe text</p>'
 * ```
 */
export function sanitizeHtmlWithDOMPurify(dirty: string): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
      'a', 'img'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'alt', 'src', 'width', 'height'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * 일반 텍스트를 새니타이징 (모든 HTML 태그 제거)
 * 사용자 이름, 댓글 등 순수 텍스트만 허용해야 하는 경우 사용
 *
 * @param dirty - 새니타이징할 문자열
 * @returns HTML 태그가 제거된 순수 텍스트
 */
export function sanitizeTextWithDOMPurify(dirty: string): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

/**
 * 사용자 입력을 검증하고 새니타이징
 * 폼 입력, 댓글, 게시글 제목 등에 사용
 *
 * @param input - 사용자 입력 문자열
 * @param options - 새니타이징 옵션
 * @returns 새니타이징된 문자열
 */
export function sanitizeInput(
  input: string,
  options: {
    allowHtml?: boolean;
    maxLength?: number;
    trim?: boolean;
  } = {}
): string {
  if (!input) return '';

  const {
    allowHtml = false,
    maxLength,
    trim = true
  } = options;

  let sanitized = input;

  // 공백 제거
  if (trim) {
    sanitized = sanitized.trim();
  }

  // 길이 제한
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // HTML 허용 여부에 따라 새니타이징
  if (allowHtml) {
    sanitized = sanitizeHtmlWithDOMPurify(sanitized);
  } else {
    sanitized = sanitizeTextWithDOMPurify(sanitized);
  }

  return sanitized;
}

/**
 * 객체의 모든 문자열 값을 새니타이징
 * API 요청 데이터 검증 시 사용
 *
 * @param obj - 객체
 * @param allowHtml - HTML 허용 여부
 * @returns 새니타이징된 객체
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  allowHtml = false
): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = allowHtml
        ? sanitizeHtmlWithDOMPurify(value)
        : sanitizeTextWithDOMPurify(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string'
          ? (allowHtml ? sanitizeHtmlWithDOMPurify(item) : sanitizeTextWithDOMPurify(item))
          : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, allowHtml);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
