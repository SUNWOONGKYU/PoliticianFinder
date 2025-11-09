/**
 * Project Grid Task ID: P1T2
 * 작업명: 인증 API 단위 테스트
 * 생성시간: 2025-11-03
 * 생성자: Claude Code
 * 의존성: P1BA1, P1BA2, P1BA3, P1BA4, P1BI1, P1BI2, P1D1
 * 설명: 회원가입, 로그인, Google OAuth, 비밀번호 재설정 API의 단위 테스트
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// 테스트 설정
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase 테스트 클라이언트
const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key'
);

// ============================================================================
// 회원가입 API 테스트 (P1BA1)
// ============================================================================

describe('회원가입 API (POST /api/auth/signup)', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!@#';
  const testNickname = `test-user-${Date.now()}`;

  it('정상적인 회원가입 요청', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        password_confirm: testPassword,
        nickname: testNickname,
        terms_agreed: true,
        privacy_agreed: true,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testEmail);
  });

  it('이메일 형식 검증 - 유효하지 않은 이메일', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid-email',
        password: testPassword,
        password_confirm: testPassword,
        nickname: testNickname,
        terms_agreed: true,
        privacy_agreed: true,
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('비밀번호 검증 - 길이 미달', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `test-${Date.now()}-short@example.com`,
        password: 'Short1!',
        password_confirm: 'Short1!',
        nickname: testNickname,
        terms_agreed: true,
        privacy_agreed: true,
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('비밀번호 불일치 검증', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `test-${Date.now()}-mismatch@example.com`,
        password: testPassword,
        password_confirm: 'DifferentPassword123!@#',
        nickname: testNickname,
        terms_agreed: true,
        privacy_agreed: true,
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('일치하지 않습니다');
  });

  it('필수 약관 동의 검증', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `test-${Date.now()}-terms@example.com`,
        password: testPassword,
        password_confirm: testPassword,
        nickname: testNickname,
        terms_agreed: false, // Not agreed
        privacy_agreed: true,
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});

// ============================================================================
// 로그인 API 테스트 (P1BA2)
// ============================================================================

describe('로그인 API (POST /api/auth/login)', () => {
  const testEmail = `login-test-${Date.now()}@example.com`;
  const testPassword = 'LoginTest123!@#';
  const testNickname = `login-user-${Date.now()}`;

  beforeAll(async () => {
    // 테스트 계정 생성
    await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        password_confirm: testPassword,
        nickname: testNickname,
        terms_agreed: true,
        privacy_agreed: true,
      }),
    });

    // 계정 생성 후 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('정상적인 로그인 요청', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        remember_me: false,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.session).toBeDefined();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testEmail);
  });

  it('잘못된 비밀번호 거부', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword123!@#',
        remember_me: false,
      }),
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('존재하지 않는 이메일 거부', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `nonexistent-${Date.now()}@example.com`,
        password: testPassword,
        remember_me: false,
      }),
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('Remember Me 옵션 처리', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        remember_me: true,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    // Set-Cookie 헤더에서 maxAge 확인 가능
    expect(data.session).toBeDefined();
  });

  it('이메일 형식 검증', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid-email',
        password: testPassword,
        remember_me: false,
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});

// ============================================================================
// 비밀번호 재설정 API 테스트 (P1BA4)
// ============================================================================

describe('비밀번호 재설정 API (POST /api/auth/reset-password)', () => {
  const resetTestEmail = `reset-test-${Date.now()}@example.com`;
  const resetPassword = 'ResetTest123!@#';
  const resetNickname = `reset-user-${Date.now()}`;

  beforeAll(async () => {
    // 테스트 계정 생성
    await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: resetTestEmail,
        password: resetPassword,
        password_confirm: resetPassword,
        nickname: resetNickname,
        terms_agreed: true,
        privacy_agreed: true,
      }),
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('비밀번호 재설정 이메일 전송', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: resetTestEmail,
        action: 'send_reset_email',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('이메일');
  });

  it('존재하지 않는 이메일로 재설정 요청', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `nonexistent-${Date.now()}@example.com`,
        action: 'send_reset_email',
      }),
    });

    // Supabase는 보안상 항상 성공으로 응답할 수 있음
    expect(response.status).toBe(200);
  });

  it('비밀번호 재설정 토큰 검증', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'invalid-token-format',
        password: 'NewPassword123!@#',
        action: 'reset_password',
      }),
    });

    // 유효하지 않은 토큰이므로 실패해야 함
    expect([400, 401, 422]).toContain(response.status);
  });

  it('새 비밀번호 요구사항 검증', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'valid-format-but-invalid-token-12345',
        password: 'weak', // 요구사항 미달
        action: 'reset_password',
      }),
    });

    expect([400, 401, 422]).toContain(response.status);
  });
});

// ============================================================================
// Google OAuth API 테스트 (P1BA3)
// ============================================================================

describe('Google OAuth API (POST /api/auth/google)', () => {
  it('Google OAuth 엔드포인트 접근 가능성', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'test-code',
      }),
    });

    // 엔드포인트가 존재하고 응답하는지 확인
    expect([200, 400, 401, 403]).toContain(response.status);
  });

  it('Google OAuth 콜백 엔드포인트 접근 가능성', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/google/callback?code=test-code`, {
      method: 'GET',
    });

    // 엔드포인트가 존재하고 응답하는지 확인 (리다이렉트 또는 에러)
    expect([200, 302, 400, 401]).toContain(response.status);
  });
});

// ============================================================================
// API 에러 처리 테스트
// ============================================================================

describe('API 에러 처리', () => {
  it('필수 필드 누락 시 400 에러', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        // password 필드 누락
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('잘못된 JSON 형식', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{invalid json}',
    });

    expect([400, 500]).toContain(response.status);
  });

  it('지원하지 않는 HTTP 메서드', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'GET', // POST 대신 GET
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect([405, 405]).toContain(response.status);
  });
});

// ============================================================================
// 통합 시나리오 테스트
// ============================================================================

describe('인증 흐름 통합 테스트', () => {
  const integrationEmail = `integration-${Date.now()}@example.com`;
  const integrationPassword = 'Integration123!@#';
  const integrationNickname = `integration-${Date.now()}`;

  it('전체 인증 흐름: 회원가입 → 로그인', async () => {
    // 1단계: 회원가입
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: integrationEmail,
        password: integrationPassword,
        password_confirm: integrationPassword,
        nickname: integrationNickname,
        terms_agreed: true,
        privacy_agreed: true,
      }),
    });

    expect(signupResponse.status).toBe(200);
    const signupData = await signupResponse.json();
    expect(signupData.success).toBe(true);
    expect(signupData.user.email).toBe(integrationEmail);

    // 2단계: 로그인
    await new Promise(resolve => setTimeout(resolve, 500));

    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: integrationEmail,
        password: integrationPassword,
        remember_me: false,
      }),
    });

    expect(loginResponse.status).toBe(200);
    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);
    expect(loginData.user.email).toBe(integrationEmail);
  });

  it('동시 다중 회원가입 요청 처리', async () => {
    const promises = [];

    for (let i = 0; i < 3; i++) {
      const promise = fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `concurrent-${Date.now()}-${i}@example.com`,
          password: 'Concurrent123!@#',
          password_confirm: 'Concurrent123!@#',
          nickname: `concurrent-${i}`,
          terms_agreed: true,
          privacy_agreed: true,
        }),
      });
      promises.push(promise);
    }

    const responses = await Promise.all(promises);
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
