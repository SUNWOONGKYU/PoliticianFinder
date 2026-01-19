import { NextRequest } from 'next/server';

/**
 * @file P1BI3 - 인증 보안 설정
 * @description 비밀번호 강도 검증, Rate Limiting, CSRF 토큰 관련 함수
 */

// 1. 비밀번호 강도 검증 (보안 강화: 12자 + 복잡도)
export function isPasswordStrong(password: string): { isValid: boolean; errors: string[]; suggestions: string[] } {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // 최소 12자
  if (password.length < 12) {
    errors.push('비밀번호는 최소 12자 이상이어야 합니다.');
    suggestions.push('비밀번호를 12자 이상으로 설정해 주세요.');
  }

  // 최대 128자
  if (password.length > 128) {
    errors.push('비밀번호는 최대 128자까지 가능합니다.');
    suggestions.push('비밀번호를 128자 이하로 설정해 주세요.');
  }

  // 대문자 포함
  if (!/[A-Z]/.test(password)) {
    errors.push('비밀번호는 최소 1개 이상의 대문자를 포함해야 합니다.');
    suggestions.push('대문자(A-Z)를 추가해 주세요.');
  }

  // 소문자 포함
  if (!/[a-z]/.test(password)) {
    errors.push('비밀번호는 최소 1개 이상의 소문자를 포함해야 합니다.');
    suggestions.push('소문자(a-z)를 추가해 주세요.');
  }

  // 숫자 포함
  if (!/[0-9]/.test(password)) {
    errors.push('비밀번호는 최소 1개 이상의 숫자를 포함해야 합니다.');
    suggestions.push('숫자(0-9)를 추가해 주세요.');
  }

  // 특수문자 포함
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('비밀번호는 최소 1개 이상의 특수문자를 포함해야 합니다.');
    suggestions.push('특수문자(!@#$%^&* 등)를 추가해 주세요.');
  }

  // 일반적으로 취약한 패턴 검사
  const commonPatterns = [
    /^123456/,
    /^password/i,
    /^qwerty/i,
    /^admin/i,
    /^letmein/i,
    /^welcome/i,
    /^monkey/i,
    /^dragon/i,
    /^master/i,
    /^sunshine/i
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('너무 흔한 비밀번호 패턴입니다. 더 복잡한 비밀번호를 사용해 주세요.');
      suggestions.push('예측 가능한 패턴을 피하고 고유한 비밀번호를 만들어 주세요.');
      break;
    }
  }

  return { isValid: errors.length === 0, errors, suggestions };
}

export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[]; suggestions: string[] } {
    return isPasswordStrong(password);
}

// 2. Rate Limiting 규칙
export const RATE_LIMIT_RULES = {
  default: { limit: 10, windowMs: 60000 },
  login: { limit: 100, windowMs: 60000 },
  passwordReset: { limit: 5, windowMs: 5 * 60 * 1000 },
  signup: { limit: 100, windowMs: 60000 },
};

const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

export function checkRateLimit(
  key: string,
  rule: { limit: number; windowMs: number }
): { allowed: boolean; message: string; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  const windowStart = now - rule.windowMs;

  if (!record || record.timestamp < windowStart) {
    rateLimitStore.set(key, { count: 1, timestamp: now });
    return { allowed: true, message: '', resetTime: now + rule.windowMs };
  }

  if (record.count >= rule.limit) {
    return {
      allowed: false,
      message: 'Too many requests. Please try again later.',
      resetTime: record.timestamp + rule.windowMs,
    };
  }

  record.count++;
  return { allowed: true, message: '', resetTime: record.timestamp + rule.windowMs };
}

export function extractIpAddress(req: NextRequest): string {
    return req.ip || '127.0.0.1';
}

export function generateRateLimitKey(ip: string, action: string): string {
    return `rl_${action}_${ip}`;
}


// 3. CSRF 토큰 (개념 증명용)
export function generateCsrfToken(): string {
  return 'mock-csrf-token-' + Math.random().toString(36).substring(2);
}

export function verifyCsrfToken(token: string): boolean {
  return token.startsWith('mock-csrf-token-');
}

// 4. 기타 유효성 검증 함수
export function validateEmail(email: string): boolean {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

export function validateNickname(nickname: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (nickname.length < 2 || nickname.length > 20) {
        errors.push('닉네임은 2자 이상 20자 이하로 입력해 주세요.');
    }
    return { isValid: errors.length === 0, errors };
}

export function validatePasswordMatch(password: string, confirm: string): boolean {
    return password === confirm;
}

// 5. 상수
export const SESSION_EXPIRY = {
    rememberMe: 60 * 60 * 24 * 30, // 30일
    accessToken: 60 * 60, // 1시간
};
