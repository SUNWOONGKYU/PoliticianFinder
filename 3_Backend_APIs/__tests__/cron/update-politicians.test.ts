// Task: P4O1 - 크롤링 스케줄러 테스트
// Test suite for politician update cron job

import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/cron/update-politicians/route';

/**
 * Mock Supabase client
 */
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: { code: 'PGRST116' }, // No rows found
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'test-id' },
            error: null,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: { id: 'test-id' },
          error: null,
        })),
      })),
      upsert: jest.fn(() => ({
        data: { id: 'test-id' },
        error: null,
      })),
    })),
  })),
}));

/**
 * Mock crawler
 */
jest.mock('@/lib/crawlers', () => ({
  crawlNEC: jest.fn(() => ({
    success: true,
    data: [
      {
        name: '홍길동',
        party: '민주당',
        district: '서울 강남구',
        contact: {
          phone: '02-1234-5678',
          email: 'hong@example.com',
          office: '서울시 강남구',
        },
        career: ['국회의원', '변호사'],
        sourceUrl: 'https://nec.go.kr',
        crawledAt: new Date().toISOString(),
      },
    ],
    error: null,
    stats: {
      startTime: new Date(),
      endTime: new Date(),
      duration: 5000,
      itemsCollected: 1,
      itemsFailed: 0,
      retryCount: 0,
    },
  })),
}));

/**
 * Helper to create mock NextRequest
 */
function createMockRequest(
  method: string = 'GET',
  headers: Record<string, string> = {}
): NextRequest {
  const url = 'http://localhost:3000/api/cron/update-politicians';
  const request = new NextRequest(url, {
    method,
    headers: new Headers(headers),
  });
  return request;
}

describe('GET /api/cron/update-politicians', () => {
  it('should return cron job information', async () => {
    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.service).toBe('Politician Data Update Cron');
    expect(data.schedule).toContain('6');
    expect(data.endpoints).toHaveProperty('GET');
    expect(data.endpoints).toHaveProperty('POST');
    expect(data.status).toBe('active');
  });

  it('should include version information', async () => {
    const request = createMockRequest('GET');
    const response = await GET(request);
    const data = await response.json();

    expect(data.version).toBeDefined();
    expect(data.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('POST /api/cron/update-politicians', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.CRON_SECRET = 'test-secret';
  });

  describe('Authentication', () => {
    it('should reject requests without authentication', async () => {
      const request = createMockRequest('POST');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unauthorized');
    });

    it('should accept requests from Vercel Cron', async () => {
      const request = createMockRequest('POST', {
        'user-agent': 'vercel-cron/1.0',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('stats');
    });

    it('should accept requests with valid CRON_SECRET', async () => {
      const request = createMockRequest('POST', {
        'x-cron-secret': 'test-secret',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
    });

    it('should reject requests with invalid CRON_SECRET', async () => {
      const request = createMockRequest('POST', {
        'x-cron-secret': 'wrong-secret',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('Execution', () => {
    it('should execute successfully with valid credentials', async () => {
      const request = createMockRequest('POST', {
        'x-cron-secret': 'test-secret',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBeDefined();
      expect(data.message).toBeDefined();
      expect(data.stats).toBeDefined();
    });

    it('should return execution statistics', async () => {
      const request = createMockRequest('POST', {
        'x-cron-secret': 'test-secret',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.stats).toHaveProperty('startTime');
      expect(data.stats).toHaveProperty('endTime');
      expect(data.stats).toHaveProperty('duration');
      expect(data.stats).toHaveProperty('crawlSuccessful');
      expect(data.stats).toHaveProperty('itemsFound');
      expect(data.stats).toHaveProperty('itemsInserted');
      expect(data.stats).toHaveProperty('itemsUpdated');
      expect(data.stats).toHaveProperty('itemsFailed');
    });

    it('should include timing information', async () => {
      const request = createMockRequest('POST', {
        'x-cron-secret': 'test-secret',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.stats.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(data.stats.endTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(data.stats.duration).toMatch(/\d+ms/);
    });

    it('should handle crawler errors gracefully', async () => {
      // Mock crawler failure
      const { crawlNEC } = require('@/lib/crawlers');
      crawlNEC.mockImplementationOnce(() => ({
        success: false,
        data: [],
        error: { message: 'Network timeout' },
        stats: null,
      }));

      const request = createMockRequest('POST', {
        'x-cron-secret': 'test-secret',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.stats.crawlSuccessful).toBe(false);
      expect(data.stats.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment variables', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const request = createMockRequest('POST', {
        'x-cron-secret': 'test-secret',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should return errors array in stats', async () => {
      // Mock crawler error
      const { crawlNEC } = require('@/lib/crawlers');
      crawlNEC.mockImplementationOnce(() => {
        throw new Error('Crawler failed');
      });

      const request = createMockRequest('POST', {
        'x-cron-secret': 'test-secret',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.stats.errors).toBeDefined();
      expect(Array.isArray(data.stats.errors)).toBe(true);
    });
  });
});

describe('Performance', () => {
  it('should complete within timeout limit', async () => {
    const request = createMockRequest('POST', {
      'x-cron-secret': 'test-secret',
    });

    const startTime = Date.now();
    await POST(request);
    const duration = Date.now() - startTime;

    // Should complete within 60 seconds (Vercel Pro limit)
    expect(duration).toBeLessThan(60000);
  });
});

describe('Integration', () => {
  it('should handle end-to-end flow', async () => {
    const request = createMockRequest('POST', {
      'user-agent': 'vercel-cron/1.0',
    });

    const response = await POST(request);
    const data = await response.json();

    // Should complete all steps
    expect(response.status).toBe(200);
    expect(data.success).toBeDefined();
    expect(data.stats.itemsFound).toBeGreaterThanOrEqual(0);
    expect(data.stats.itemsInserted).toBeGreaterThanOrEqual(0);
    expect(data.stats.itemsUpdated).toBeGreaterThanOrEqual(0);
  });
});
