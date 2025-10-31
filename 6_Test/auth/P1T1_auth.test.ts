/** P1T1: 인증 API 테스트 */
import { describe, it, expect } from 'vitest';

describe('Auth API Tests', () => {
  it('should signup successfully', async () => {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }),
    });
    expect(response.status).toBe(201);
  });

  it('should login successfully', async () => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    expect(response.status).toBe(200);
  });
});
