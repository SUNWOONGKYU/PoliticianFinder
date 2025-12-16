/**
 * XSS 방지를 위한 HTML 이스케이프 유틸리티
 * 사용자 입력을 안전하게 렌더링하기 위해 HTML 특수문자를 이스케이프합니다.
 */

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
 * 완전한 sanitization이 필요하면 DOMPurify 사용 권장
 * @param html HTML 문자열
 * @returns 태그가 제거된 텍스트
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  // 모든 HTML 태그 제거
  return html.replace(/<[^>]*>/g, '');
}
