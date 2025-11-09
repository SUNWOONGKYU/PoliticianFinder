// Task: P4BA1 - 선관위 크롤링 스크립트

import { CrawlError, CrawlErrorCode, CrawlerOptions } from './types';

/**
 * 기본 크롤러 옵션
 */
export const DEFAULT_CRAWLER_OPTIONS: Required<CrawlerOptions> = {
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 2000,
  headless: true,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  waitTime: 2000,
};

/**
 * 재시도 로직을 적용하여 함수 실행
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_CRAWLER_OPTIONS.maxRetries,
    retryDelay = DEFAULT_CRAWLER_OPTIONS.retryDelay,
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        onRetry?.(lastError, attempt + 1);
        await sleep(retryDelay * (attempt + 1)); // Exponential backoff
      }
    }
  }

  throw lastError!;
}

/**
 * 지정된 시간만큼 대기
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 문자열에서 공백 정리
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * HTML 엔티티 디코드
 */
export function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };

  return text.replace(/&[#\w]+;/g, match => entities[match] || match);
}

/**
 * 전화번호 포맷 정리
 */
export function formatPhoneNumber(phone: string): string {
  // 숫자만 추출
  const digits = phone.replace(/\D/g, '');

  // 서울 지역번호 (02)
  if (digits.startsWith('02')) {
    if (digits.length === 9) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    } else if (digits.length === 10) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
  }

  // 기타 지역번호 (031, 032 등)
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  return phone;
}

/**
 * 이메일 유효성 검증
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * URL 유효성 검증
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 약력 문자열 파싱
 */
export function parseCareer(careerText: string): Array<{ period: string; description: string }> {
  const careers: Array<{ period: string; description: string }> = [];

  // 줄바꿈으로 분리
  const lines = careerText
    .split(/[\n\r]+/)
    .map(line => cleanText(line))
    .filter(line => line.length > 0);

  for (const line of lines) {
    // 기간 패턴: "2020~2024", "2020-2024", "2020.01~2024.12" 등
    const periodPattern = /(\d{4}[\.\-~]\d{2,4}(?:[\.\-~]\d{2})?)/;
    const match = line.match(periodPattern);

    if (match) {
      const period = match[1];
      const description = line.replace(periodPattern, '').trim();

      if (description) {
        careers.push({ period, description });
      }
    } else {
      // 기간이 명시되지 않은 경우
      careers.push({ period: '', description: line });
    }
  }

  return careers;
}

/**
 * 크롤링 에러 생성
 */
export function createCrawlError(
  code: CrawlErrorCode,
  message: string,
  originalError?: Error
): CrawlError {
  return {
    code,
    message,
    stack: originalError?.stack,
    retryable: isRetryableError(code),
  };
}

/**
 * 재시도 가능한 에러인지 확인
 */
export function isRetryableError(code: CrawlErrorCode): boolean {
  return [
    CrawlErrorCode.NETWORK_ERROR,
    CrawlErrorCode.TIMEOUT,
    CrawlErrorCode.RATE_LIMIT,
  ].includes(code);
}

/**
 * 타임아웃 적용
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * 배열을 청크로 분리
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 랜덤 지연 시간 생성 (봇 감지 회피)
 */
export function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 데이터 검증
 */
export function validatePoliticianData(data: any): boolean {
  return !!(
    data &&
    typeof data.name === 'string' &&
    data.name.trim().length > 0 &&
    typeof data.party === 'string' &&
    typeof data.district === 'string'
  );
}

/**
 * 안전한 텍스트 추출 (null/undefined 처리)
 */
export function safeText(element: any, defaultValue = ''): string {
  try {
    if (!element) return defaultValue;
    const text = typeof element === 'string' ? element : element.textContent || element.innerText || '';
    return cleanText(text) || defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * 날짜 문자열 파싱
 */
export function parseDate(dateStr: string): Date | null {
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * 로그 헬퍼 (개발 모드에서만 출력)
 */
export function log(message: string, ...args: any[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Crawler] ${message}`, ...args);
  }
}

/**
 * 에러 로그 헬퍼
 */
export function logError(message: string, error?: Error): void {
  console.error(`[Crawler Error] ${message}`, error);
}
