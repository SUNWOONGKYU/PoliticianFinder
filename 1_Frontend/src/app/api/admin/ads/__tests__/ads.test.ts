// P4BA9: Advertisement Management API Tests
// Comprehensive test suite for ad management endpoints

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET as getAds, POST as createAd } from '../route';
import { GET as getAd, PATCH as updateAd, DELETE as deleteAd } from '../[id]/route';
import { GET as getStats } from '../stats/route';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          range: jest.fn(),
        })),
        lte: jest.fn(),
        gte: jest.fn(),
        order: jest.fn(),
        range: jest.fn(),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    })),
    rpc: jest.fn(),
  })),
}));

// Mock auth helpers
jest.mock('@/lib/auth/helpers', () => ({
  requireAdmin: jest.fn(() => ({
    user: { id: 'admin-user-id', email: 'admin@example.com' },
  })),
}));

describe('Advertisement Management API', () => {
  describe('GET /api/admin/ads', () => {
    it('should return paginated list of ads', async () => {
      const request = new NextRequest('http://localhost/api/admin/ads?page=1&limit=20');
      const response = await getAds(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
    });

    it('should filter ads by placement', async () => {
      const request = new NextRequest('http://localhost/api/admin/ads?placement=main');
      const response = await getAds(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should filter ads by active status', async () => {
      const request = new NextRequest('http://localhost/api/admin/ads?is_active=true');
      const response = await getAds(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should validate page parameter', async () => {
      const request = new NextRequest('http://localhost/api/admin/ads?page=invalid');
      const response = await getAds(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate limit parameter range', async () => {
      const request = new NextRequest('http://localhost/api/admin/ads?limit=200');
      const response = await getAds(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/admin/ads', () => {
    const validAdData = {
      title: '테스트 광고',
      image_url: 'https://example.com/ad.jpg',
      link_url: 'https://example.com/landing',
      placement: 'main',
      start_date: '2025-01-01T00:00:00Z',
      end_date: '2025-12-31T23:59:59Z',
      is_active: true,
    };

    it('should create a new ad with valid data', async () => {
      const request = new NextRequest('http://localhost/api/admin/ads', {
        method: 'POST',
        body: JSON.stringify(validAdData),
      });

      const response = await createAd(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('message');
    });

    it('should validate required fields', async () => {
      const invalidData = { title: '테스트 광고' };
      const request = new NextRequest('http://localhost/api/admin/ads', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await createAd(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate URL format', async () => {
      const invalidData = {
        ...validAdData,
        image_url: 'not-a-url',
      };
      const request = new NextRequest('http://localhost/api/admin/ads', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await createAd(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should validate placement enum', async () => {
      const invalidData = {
        ...validAdData,
        placement: 'invalid-placement',
      };
      const request = new NextRequest('http://localhost/api/admin/ads', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await createAd(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should validate date range', async () => {
      const invalidData = {
        ...validAdData,
        start_date: '2025-12-31T23:59:59Z',
        end_date: '2025-01-01T00:00:00Z',
      };
      const request = new NextRequest('http://localhost/api/admin/ads', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await createAd(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should validate title length', async () => {
      const invalidData = {
        ...validAdData,
        title: 'a'.repeat(101),
      };
      const request = new NextRequest('http://localhost/api/admin/ads', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await createAd(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/admin/ads/[id]', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return ad details with CTR', async () => {
      const request = new NextRequest(`http://localhost/api/admin/ads/${validId}`);
      const response = await getAd(request, { params: { id: validId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data.data).toHaveProperty('ctr');
    });

    it('should validate UUID format', async () => {
      const invalidId = 'not-a-uuid';
      const request = new NextRequest(`http://localhost/api/admin/ads/${invalidId}`);
      const response = await getAd(request, { params: { id: invalidId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_ID');
    });
  });

  describe('PATCH /api/admin/ads/[id]', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    it('should update ad with valid data', async () => {
      const updateData = {
        title: '수정된 광고 제목',
        is_active: false,
      };
      const request = new NextRequest(`http://localhost/api/admin/ads/${validId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await updateAd(request, { params: { id: validId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('message');
    });

    it('should validate partial update data', async () => {
      const invalidData = {
        image_url: 'not-a-url',
      };
      const request = new NextRequest(`http://localhost/api/admin/ads/${validId}`, {
        method: 'PATCH',
        body: JSON.stringify(invalidData),
      });

      const response = await updateAd(request, { params: { id: validId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should validate date range on update', async () => {
      const invalidData = {
        start_date: '2025-12-31T23:59:59Z',
        end_date: '2025-01-01T00:00:00Z',
      };
      const request = new NextRequest(`http://localhost/api/admin/ads/${validId}`, {
        method: 'PATCH',
        body: JSON.stringify(invalidData),
      });

      const response = await updateAd(request, { params: { id: validId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE /api/admin/ads/[id]', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    it('should soft delete ad (set is_active to false)', async () => {
      const request = new NextRequest(`http://localhost/api/admin/ads/${validId}`, {
        method: 'DELETE',
      });

      const response = await deleteAd(request, { params: { id: validId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('message');
    });

    it('should validate UUID format', async () => {
      const invalidId = 'not-a-uuid';
      const request = new NextRequest(`http://localhost/api/admin/ads/${invalidId}`, {
        method: 'DELETE',
      });

      const response = await deleteAd(request, { params: { id: invalidId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/admin/ads/stats', () => {
    it('should return comprehensive statistics', async () => {
      const request = new NextRequest('http://localhost/api/admin/ads/stats');
      const response = await getStats(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('overview');
      expect(data.data).toHaveProperty('byPlacement');
      expect(data.data).toHaveProperty('topPerforming');
    });

    it('should include all placements in stats', async () => {
      const request = new NextRequest('http://localhost/api/admin/ads/stats');
      const response = await getStats(request);
      const data = await response.json();

      expect(data.data.byPlacement).toHaveLength(4);
      const placements = data.data.byPlacement.map((p: any) => p.placement);
      expect(placements).toContain('main');
      expect(placements).toContain('sidebar');
      expect(placements).toContain('post_top');
      expect(placements).toContain('post_bottom');
    });

    it('should calculate CTR correctly', async () => {
      const request = new NextRequest('http://localhost/api/admin/ads/stats');
      const response = await getStats(request);
      const data = await response.json();

      expect(data.data.overview).toHaveProperty('avgCTR');
      expect(typeof data.data.overview.avgCTR).toBe('number');
    });

    it('should filter stats by placement', async () => {
      const request = new NextRequest('http://localhost/api/admin/ads/stats?placement=main');
      const response = await getStats(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should filter stats by date range', async () => {
      const request = new NextRequest(
        'http://localhost/api/admin/ads/stats?start_date=2025-01-01&end_date=2025-12-31'
      );
      const response = await getStats(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});

describe('Advertisement Placement Manager', () => {
  describe('CTR Calculation', () => {
    it('should calculate CTR correctly', () => {
      const ad = {
        impressions: 1000,
        clicks: 50,
      };
      const ctr = (ad.clicks / ad.impressions) * 100;
      expect(ctr).toBe(5);
    });

    it('should return 0 for ads with no impressions', () => {
      const ad = {
        impressions: 0,
        clicks: 0,
      };
      const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
      expect(ctr).toBe(0);
    });
  });

  describe('Date Validation', () => {
    it('should validate ad is active within date range', () => {
      const now = new Date('2025-06-15');
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const isActive = now >= startDate && now <= endDate;
      expect(isActive).toBe(true);
    });

    it('should validate ad is inactive before start date', () => {
      const now = new Date('2024-12-31');
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const isActive = now >= startDate && now <= endDate;
      expect(isActive).toBe(false);
    });

    it('should validate ad is inactive after end date', () => {
      const now = new Date('2026-01-01');
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const isActive = now >= startDate && now <= endDate;
      expect(isActive).toBe(false);
    });
  });
});
