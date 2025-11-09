/**
 * Project Grid Task ID: P4BA13
 * 작업명: 관리자 액션 로그 API - 테스트
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5
 * 설명: 관리자 액션 로그 API 단위 테스트
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { GET as GET_STATS, POST as POST_STATS } from '../stats/route';

// Mock modules
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { role: 'admin' },
            error: null,
          })),
          range: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-id',
              admin_id: 'admin-id',
              action_type: 'user_ban',
              result: 'success',
            },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

jest.mock('@/lib/auth/helpers', () => ({
  requireAuth: jest.fn(() => ({
    user: { id: 'admin-id', email: 'admin@test.com' },
  })),
}));

describe('Admin Action Logs API', () => {
  describe('GET /api/admin/action-logs', () => {
    it('should return action logs with pagination', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/action-logs?page=1&limit=20'
      );

      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('pagination');
      expect(json.pagination).toMatchObject({
        page: 1,
        limit: 20,
      });
    });

    it('should filter by adminId', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/action-logs?adminId=123e4567-e89b-12d3-a456-426614174000'
      );

      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('should filter by actionType', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/action-logs?actionType=user_ban'
      );

      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('should filter by date range', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/action-logs?startDate=2025-01-01&endDate=2025-12-31'
      );

      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('should validate limit parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/action-logs?limit=200'
      );

      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/admin/action-logs', () => {
    it('should track a new action', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/action-logs',
        {
          method: 'POST',
          body: JSON.stringify({
            actionType: 'user_ban',
            targetType: 'user',
            targetId: '123e4567-e89b-12d3-a456-426614174000',
            result: 'success',
            durationMs: 150,
            metadata: { reason: 'Spam' },
          }),
        }
      );

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data).toMatchObject({
        action_type: 'user_ban',
        result: 'success',
      });
    });

    it('should require actionType', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/action-logs',
        {
          method: 'POST',
          body: JSON.stringify({
            targetType: 'user',
          }),
        }
      );

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('should default result to success', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/action-logs',
        {
          method: 'POST',
          body: JSON.stringify({
            actionType: 'post_delete',
          }),
        }
      );

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
    });
  });

  describe('GET /api/admin/action-logs/stats', () => {
    it('should return statistics grouped by action_type', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/action-logs/stats?groupBy=action_type'
      );

      const response = await GET_STATS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty('totalActions');
      expect(json.data).toHaveProperty('byActionType');
    });

    it('should return statistics grouped by admin', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/action-logs/stats?groupBy=admin'
      );

      const response = await GET_STATS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty('byAdmin');
    });

    it('should return statistics grouped by date', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/action-logs/stats?groupBy=date'
      );

      const response = await GET_STATS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty('byDate');
    });

    it('should filter statistics by date range', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/action-logs/stats?startDate=2025-01-01&endDate=2025-12-31&groupBy=date'
      );

      const response = await GET_STATS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.filters).toMatchObject({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      });
    });
  });

  describe('POST /api/admin/action-logs/stats (Custom Stats)', () => {
    it('should return custom statistics with multiple filters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/action-logs/stats',
        {
          method: 'POST',
          body: JSON.stringify({
            adminIds: [
              '123e4567-e89b-12d3-a456-426614174000',
              '223e4567-e89b-12d3-a456-426614174001',
            ],
            actionTypes: ['user_ban', 'post_delete'],
            groupBy: 'action_type',
            includeFailures: false,
          }),
        }
      );

      const response = await POST_STATS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty('totalActions');
      expect(json.data).toHaveProperty('byActionType');
    });

    it('should filter out failures when includeFailures is false', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/action-logs/stats',
        {
          method: 'POST',
          body: JSON.stringify({
            groupBy: 'action_type',
            includeFailures: false,
          }),
        }
      );

      const response = await POST_STATS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });
});

describe('ActivityTracker Integration', () => {
  it('should track user ban action', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/action-logs',
      {
        method: 'POST',
        body: JSON.stringify({
          actionType: 'user_ban',
          targetType: 'user',
          targetId: '123e4567-e89b-12d3-a456-426614174000',
          metadata: { reason: 'Violation of terms' },
        }),
      }
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
  });

  it('should track post delete action', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/action-logs',
      {
        method: 'POST',
        body: JSON.stringify({
          actionType: 'post_delete',
          targetType: 'post',
          targetId: '223e4567-e89b-12d3-a456-426614174001',
          metadata: { reason: 'Inappropriate content' },
        }),
      }
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
  });

  it('should track action with duration', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/action-logs',
      {
        method: 'POST',
        body: JSON.stringify({
          actionType: 'ad_create',
          targetType: 'ad',
          targetId: '323e4567-e89b-12d3-a456-426614174002',
          durationMs: 250,
          metadata: { ad_type: 'banner' },
        }),
      }
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
  });

  it('should track failed action', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/action-logs',
      {
        method: 'POST',
        body: JSON.stringify({
          actionType: 'user_ban',
          targetType: 'user',
          targetId: '423e4567-e89b-12d3-a456-426614174003',
          result: 'failure',
          metadata: { error: 'User not found' },
        }),
      }
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
  });
});
