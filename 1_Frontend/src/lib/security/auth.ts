import { NextRequest } from 'next/server';

/**
 * @file P1BI3 - 인증 보안 설정
 * @description 비밀번호 강도 검증, Rate Limiting, CSRF 토큰 관련 함수
 */

// 1. 비밀번호 강도 검증
export function isPasswordStrong(password: string): { isValid: boolean; errors: string[]; suggestions: string[] } {
  const errors: string[] = [];
  const suggestions: string[] = [];

  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
    suggestions.push('비밀번호를 8자 이상으로 설정해 주세요.');
  }
  // TODO: 더 복잡한 비밀번호 강도 규칙 추가 (대소문자, 숫자, 특수문자 등)
  // 예: if (!/[A-Z]/.test(password)) errors.push('대문자를 포함해야 합니다.');

  return { isValid: errors.length === 0, errors, suggestions };
}

export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[]; suggestions: string[] } {
    return isPasswordStrong(password);
}

// 2. Rate Limiting 규칙
export const RATE_LIMIT_RULES = {
  default: { limit: 10, windowMs: 60000 },
  login: { limit: 5, windowMs: 5 * 60 * 1000 },
  passwordReset: { limit: 5, windowMs: 5 * 60 * 1000 },
  signup: { limit: 5, windowMs: 5 * 60 * 1000 },
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
