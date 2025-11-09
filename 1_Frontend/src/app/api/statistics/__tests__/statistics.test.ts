// P3BA4: Tests for Statistics APIs
// Test coverage for all statistics endpoints

import { NextRequest } from 'next/server';
import { GET as getOverview } from '../overview/route';
import { GET as getCommunity } from '../community/route';
import { GET as getPoliticiansStats } from '../politicians-stats/route';
import { GET as getPayments } from '../payments/route';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        count: 0,
        data: [],
        error: null,
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      })),
    })),
  })),
}));

describe('Statistics API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/statistics/overview', () => {
    it('should return overview statistics', async () => {
      const req = new NextRequest('http://localhost:3000/api/statistics/overview');
      const response = await getOverview(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('total');
      expect(data.data).toHaveProperty('politicians');
      expect(data.data).toHaveProperty('community');
      expect(data.data).toHaveProperty('engagement');
    });

    it('should include cache headers', async () => {
      const req = new NextRequest('http://localhost:3000/api/statistics/overview');
      const response = await getOverview(req);

      expect(response.headers.get('Cache-Control')).toBeTruthy();
    });
  });

  describe('GET /api/statistics/community', () => {
    it('should return community statistics', async () => {
      const req = new NextRequest('http://localhost:3000/api/statistics/community');
      const response = await getCommunity(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('users');
      expect(data.data).toHaveProperty('posts');
      expect(data.data).toHaveProperty('comments');
      expect(data.data).toHaveProperty('activity');
    });

    it('should accept period parameter', async () => {
      const req = new NextRequest('http://localhost:3000/api/statistics/community?period=60');
      const response = await getCommunity(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.activity.period).toBe(60);
    });
  });

  describe('GET /api/statistics/politicians-stats', () => {
    it('should return politicians statistics', async () => {
      const req = new NextRequest('http://localhost:3000/api/statistics/politicians-stats');
      const response = await getPoliticiansStats(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('summary');
      expect(data.data).toHaveProperty('distribution');
      expect(data.data).toHaveProperty('averages');
      expect(data.data).toHaveProperty('rankings');
    });
  });

  describe('GET /api/statistics/payments', () => {
    it('should return payment statistics', async () => {
      const req = new NextRequest('http://localhost:3000/api/statistics/payments');
      const response = await getPayments(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalRevenue');
      expect(data.data).toHaveProperty('totalTransactions');
      expect(data.data).toHaveProperty('averageAmount');
    });
  });
});
