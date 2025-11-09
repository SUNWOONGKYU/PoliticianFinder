/**
 * Project Grid Task ID: P1BI3
 * 작업명: 인증 보안 설정
 * 생성시간: 2025-10-31
 * 생성자: Claude-Sonnet-4.5
 * 의존성: 없음
 * 설명: 비밀번호 강도 검증, Rate Limiting, CSRF 토큰 등 인증과 관련된 보안 유틸리티 함수들을 제공합니다.
 */

import { headers } from 'next/headers';

// ============================================================================
// 비밀번호 강도 검증
// ============================================================================

/**
 * 비밀번호 강도 레벨
 */
export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
}

/**
 * 비밀번호 검증 결과
 */
export interface PasswordValidationResult {
  isValid: boolean;
  strength: PasswordStrength;
  errors: string[];
  suggestions: string[];
}

/**
 * 비밀번호 강도 검증 (signup.html 기준: 8자 이상, 영문+숫자)
 * @param password 비밀번호
 * @returns 검증 결과
 */
export function validatePasswordStrength(
  password: string
): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let strength = PasswordStrength.WEAK;

  // 1. 길이 검증 (최소 8자)
  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
  }

  // 2. 최대 길이 검증 (최대 128자)
  if (password.length > 128) {
    errors.push('비밀번호는 최대 128자까지 가능합니다.');
  }

  // 3. 영문 포함 여부
  const hasLetter = /[a-zA-Z]/.test(password);
  if (!hasLetter) {
    errors.push('비밀번호에 영문자가 포함되어야 합니다.');
  }

  // 4. 숫자 포함 여부
  const hasNumber = /\d/.test(password);
  if (!hasNumber) {
    errors.push('비밀번호에 숫자가 포함되어야 합니다.');
  }

  // 5. 특수문자 포함 여부 (선택, 권장)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // 6. 대문자 포함 여부 (선택, 권장)
  const hasUpperCase = /[A-Z]/.test(password);

  // 7. 소문자 포함 여부
  const hasLowerCase = /[a-z]/.test(password);

  // 8. 연속된 문자 검증 (예: aaa, 111)
  const hasRepeatingChars = /(.)\1{2,}/.test(password);
  if (hasRepeatingChars) {
    suggestions.push('동일한 문자가 3번 이상 반복되지 않도록 하세요.');
  }

  // 9. 일반적인 패턴 검증 (예: 123456, password)
  const commonPasswords = [
    'password',
    '12345678',
    '11111111',
    'qwerty',
    'abc12345',
    'password1',
    'password123',
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('너무 흔한 비밀번호입니다. 다른 비밀번호를 사용하세요.');
  }

  // 10. 비밀번호 강도 계산
  let strengthScore = 0;
  if (password.length >= 8) strengthScore++;
  if (password.length >= 12) strengthScore++;
  if (hasLetter) strengthScore++;
  if (hasNumber) strengthScore++;
  if (hasSpecial) strengthScore++;
  if (hasUpperCase) strengthScore++;
  if (hasLowerCase) strengthScore++;
  if (!hasRepeatingChars) strengthScore++;

  if (strengthScore <= 3) {
    strength = PasswordStrength.WEAK;
    suggestions.push('비밀번호가 약합니다. 특수문자와 대문자를 추가하세요.');
  } else if (strengthScore <= 5) {
    strength = PasswordStrength.MEDIUM;
    suggestions.push('비밀번호 강도가 보통입니다. 길이를 늘리거나 특수문자를 추가하세요.');
  } else {
    strength = PasswordStrength.STRONG;
  }

  // 11. 추가 제안사항
  if (!hasSpecial) {
    suggestions.push('특수문자를 포함하면 더 안전합니다.');
  }
  if (!hasUpperCase) {
    suggestions.push('대문자를 포함하면 더 안전합니다.');
  }
  if (password.length < 12) {
    suggestions.push('12자 이상으로 설정하면 더 안전합니다.');
  }

  return {
    isValid: errors.length === 0,
    strength,
    errors,
    suggestions,
  };
}

/**
 * 비밀번호 확인 검증
 * @param password 비밀번호
 * @param passwordConfirm 비밀번호 확인
 * @returns 일치 여부
 */
export function validatePasswordMatch(
  password: string,
  passwordConfirm: string
): boolean {
  return password === passwordConfirm;
}

// ============================================================================
// Rate Limiting 규칙
// ============================================================================

/**
 * Rate Limiting 규칙 정의
 */
export const RATE_LIMIT_RULES = {
  // 로그인: 5분에 5회
  login: {
    windowMs: 5 * 60 * 1000,
    maxAttempts: 5,
    message: '로그인 시도가 너무 많습니다. 5분 후 다시 시도해 주세요.',
  },
  // 회원가입: 10분에 3회
  signup: {
    windowMs: 10 * 60 * 1000,
    maxAttempts: 3,
    message: '회원가입 시도가 너무 많습니다. 10분 후 다시 시도해 주세요.',
  },
  // 비밀번호 재설정: 10분에 3회
  passwordReset: {
    windowMs: 10 * 60 * 1000,
    maxAttempts: 3,
    message: '비밀번호 재설정 요청이 너무 많습니다. 10분 후 다시 시도해 주세요.',
  },
  // 이메일 인증 재전송: 5분에 2회
  emailVerification: {
    windowMs: 5 * 60 * 1000,
    maxAttempts: 2,
    message: '이메일 인증 재전송 요청이 너무 많습니다. 5분 후 다시 시도해 주세요.',
  },
  // 일반 API: 1분에 60회
  api: {
    windowMs: 1 * 60 * 1000,
    maxAttempts: 60,
    message: 'API 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  },
};

/**
 * Rate Limiting 저장소 타입
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Rate Limiting 저장소 (메모리 기반, 프로덕션에서는 Redis 사용 권장)
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate Limiting 체크
 * @param key 식별 키 (IP + endpoint)
 * @param rule Rate Limiting 규칙
 * @returns Rate Limit 초과 여부 및 정보
 */
export function checkRateLimit(
  key: string,
  rule: (typeof RATE_LIMIT_RULES)[keyof typeof RATE_LIMIT_RULES]
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // 새로운 윈도우 시작
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + rule.windowMs,
    });

    return {
      allowed: true,
      remaining: rule.maxAttempts - 1,
      resetTime: now + rule.windowMs,
    };
  }

  if (entry.count >= rule.maxAttempts) {
    // Rate Limit 초과
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      message: rule.message,
    };
  }

  // 카운트 증가
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: rule.maxAttempts - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate Limiting 키 생성
 * @param identifier 식별자 (IP, 사용자 ID 등)
 * @param endpoint 엔드포인트
 * @returns Rate Limiting 키
 */
export function generateRateLimitKey(
  identifier: string,
  endpoint: string
): string {
  return `${identifier}:${endpoint}`;
}

// ============================================================================
// CSRF 토큰
// ============================================================================

/**
 * CSRF 토큰 생성
 * @returns CSRF 토큰
 */
export function generateCsrfToken(): string {
  // 랜덤 바이트 생성 (32바이트 = 64자 hex)
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);

  // Hex 문자열로 변환
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * CSRF 토큰 검증
 * @param token 요청에서 받은 토큰
 * @param expectedToken 저장된 토큰 (세션 또는 쿠키)
 * @returns 검증 결과
 */
export function verifyCsrfToken(
  token: string | null,
  expectedToken: string | null
): boolean {
  if (!token || !expectedToken) {
    return false;
  }

  // 상수 시간 비교 (타이밍 공격 방지)
  if (token.length !== expectedToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }

  return result === 0;
}

/**
 * 요청에서 CSRF 토큰 추출
 * @param request Next.js 요청 객체
 * @returns CSRF 토큰 또는 null
 */
export async function extractCsrfToken(
  request: Request
): Promise<string | null> {
  // 1. 헤더에서 추출 (X-CSRF-Token)
  const headerToken = request.headers.get('X-CSRF-Token');
  if (headerToken) {
    return headerToken;
  }

  // 2. Body에서 추출 (JSON)
  try {
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const body = await request.clone().json();
      if (body._csrf) {
        return body._csrf;
      }
    }
  } catch {
    // JSON 파싱 실패 시 무시
  }

  return null;
}

// ============================================================================
// 입력 검증 및 새니타이제이션
// ============================================================================

/**
 * 이메일 형식 검증
 * @param email 이메일
 * @returns 유효 여부
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 닉네임 검증 (signup.html 기준: 2-10자)
 * @param nickname 닉네임
 * @returns 검증 결과
 */
export function validateNickname(nickname: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 1. 길이 검증 (2-10자)
  if (nickname.length < 2) {
    errors.push('닉네임은 최소 2자 이상이어야 합니다.');
  }
  if (nickname.length > 10) {
    errors.push('닉네임은 최대 10자까지 가능합니다.');
  }

  // 2. 허용되지 않는 문자 검증 (특수문자 제한)
  const invalidChars = /[<>'"\\\/]/;
  if (invalidChars.test(nickname)) {
    errors.push('닉네임에 사용할 수 없는 문자가 포함되어 있습니다.');
  }

  // 3. 공백만으로 이루어진 닉네임 방지
  if (nickname.trim().length === 0) {
    errors.push('닉네임은 공백만으로 이루어질 수 없습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * XSS 공격 방지를 위한 HTML 새니타이제이션
 * @param input 입력 문자열
 * @returns 새니타이즈된 문자열
 */
export function sanitizeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * SQL 인젝션 방지를 위한 입력 검증
 * @param input 입력 문자열
 * @returns SQL 키워드 포함 여부
 */
export function containsSqlKeywords(input: string): boolean {
  const sqlKeywords = [
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'DROP',
    'CREATE',
    'ALTER',
    'EXEC',
    'UNION',
    '--',
    ';',
  ];

  const upperInput = input.toUpperCase();
  return sqlKeywords.some((keyword) => upperInput.includes(keyword));
}

// ============================================================================
// 세션 보안
// ============================================================================

/**
 * 세션 만료 시간 (초)
 */
export const SESSION_EXPIRY = {
  accessToken: 3600, // 1시간
  refreshToken: 604800, // 7일
  rememberMe: 2592000, // 30일
};

/**
 * 세션 토큰 생성 (랜덤 문자열)
 * @returns 세션 토큰
 */
export function generateSessionToken(): string {
  return generateCsrfToken(); // 동일한 랜덤 생성 로직 사용
}

/**
 * IP 주소 추출
 * @param request Next.js 요청 객체
 * @returns IP 주소
 */
export function extractIpAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

// ============================================================================
// 완료
// ============================================================================
// P1BI3: 인증 보안 설정 완료
//
// 구현된 기능:
// - 비밀번호 강도 검증 (signup.html 기준: 8자 이상, 영문+숫자)
// - 비밀번호 강도 레벨 (weak, medium, strong)
// - Rate Limiting 규칙 (로그인, 회원가입, 비밀번호 재설정, 이메일 인증)
// - CSRF 토큰 생성 및 검증
// - 입력 검증 (이메일, 닉네임)
// - XSS 방지 (HTML 새니타이제이션)
// - SQL 인젝션 방지 (키워드 검증)
// - 세션 보안 (토큰 생성, IP 추출)
//
// Rate Limiting 규칙:
// - 로그인: 5분에 5회
// - 회원가입: 10분에 3회
// - 비밀번호 재설정: 10분에 3회
// - 이메일 인증 재전송: 5분에 2회
// - 일반 API: 1분에 60회
