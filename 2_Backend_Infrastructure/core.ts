/**
 * P1BI1: Backend Infrastructure - Core Setup
 * 작업일: 2025-11-03
 * 설명: 백엔드 코어 설정 및 미들웨어
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Supabase 클라이언트 초기화
 */
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * API 응답 포맷 인터페이스
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  timestamp: string;
}

/**
 * 성공 응답 생성
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return new NextResponse(
    JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    } as ApiResponse<T>),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * 에러 응답 생성
 */
export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: string
): NextResponse<ApiResponse> {
  return new NextResponse(
    JSON.stringify({
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * 요청 검증 미들웨어
 */
export function validateRequest(
  req: NextRequest,
  requiredFields: string[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const field of requiredFields) {
    if (!field) {
      errors[field] = `${field} is required`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * 인증 토큰 검증
 */
export async function verifyAuthToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    if (!token) {
      return {
        valid: false,
        error: 'No token provided',
      };
    }

    // Extract token from Bearer prefix if present
    const cleanToken = token.replace('Bearer ', '');

    // Verify token with Supabase
    const { data, error } = await supabaseClient.auth.getUser(cleanToken);

    if (error || !data.user) {
      return {
        valid: false,
        error: error?.message || 'Invalid token',
      };
    }

    return {
      valid: true,
      userId: data.user.id,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Token verification failed',
    };
  }
}

/**
 * CORS 헤더 설정
 */
export function setCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_API_BASE_URL || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * 요청 로깅 유틸리티
 */
export function logRequest(
  method: string,
  path: string,
  status: number,
  duration: number
): void {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] ${method} ${path} - ${status} (${duration}ms)`
  );
}

/**
 * 비밀번호 해싱 (Supabase 내장 사용)
 */
export async function hashPassword(password: string): Promise<string> {
  // Supabase will handle password hashing during auth.signUp
  // This is a placeholder for custom hashing if needed
  return password;
}

/**
 * 이메일 검증
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 비밀번호 검증
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (password.length > 128) {
    errors.push('Password must be at most 128 characters');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain numbers');
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain special characters (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Rate Limiting (Simple in-memory implementation)
 */
const requestLimits = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const limit = requestLimits.get(identifier);

  if (!limit) {
    requestLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (now > limit.resetTime) {
    requestLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (limit.count < maxRequests) {
    limit.count++;
    return true;
  }

  return false;
}

/**
 * 환경변수 검증
 */
export function validateEnvironment(): {
  valid: boolean;
  missingVars: string[];
} {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  return {
    valid: missingVars.length === 0,
    missingVars,
  };
}

/**
 * 에러 타입 정의
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Common error codes
export const ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
} as const;
