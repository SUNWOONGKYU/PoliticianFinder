import { NextRequest } from 'next/server'
import { GET, OPTIONS } from '../route'
import { createServiceClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(),
}))

describe('Politicians Search API Route', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createServiceClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('GET', () => {
    it('should return search results with pagination', async () => {
      const mockData = [
        { id: 1, name: 'Test Politician 1', party: 'Party A' },
        { id: 2, name: 'Test Politician 2', party: 'Party B' },
      ]

      mockSupabase.range.mockResolvedValueOnce({
        data: mockData,
        error: null,
        count: 2,
      })

      const request = new NextRequest('http://localhost:3000/api/politicians/search?q=test')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockData)
      expect(data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      })
    })

    it('should apply search query filter', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      const request = new NextRequest('http://localhost:3000/api/politicians/search?q=김철수')
      await GET(request)

      expect(mockSupabase.ilike).toHaveBeenCalledWith('name', expect.stringContaining('김철수'))
    })

    it('should apply party filter', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      const request = new NextRequest('http://localhost:3000/api/politicians/search?party=민주당,국민의힘')
      await GET(request)

      expect(mockSupabase.in).toHaveBeenCalledWith('party', ['민주당', '국민의힘'])
    })

    it('should apply region filter', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      const request = new NextRequest('http://localhost:3000/api/politicians/search?region=서울,경기')
      await GET(request)

      expect(mockSupabase.in).toHaveBeenCalledWith('region', ['서울', '경기'])
    })

    it('should apply sorting', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      const request = new NextRequest('http://localhost:3000/api/politicians/search?sort=name&order=desc')
      await GET(request)

      expect(mockSupabase.order).toHaveBeenCalledWith('name', { ascending: false })
    })

    it('should handle pagination correctly', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 25,
      })

      const request = new NextRequest('http://localhost:3000/api/politicians/search?page=2&limit=10')
      await GET(request)

      expect(mockSupabase.range).toHaveBeenCalledWith(10, 19)
    })

    it('should sanitize and validate input', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      const request = new NextRequest('http://localhost:3000/api/politicians/search?q=x')
      const response = await GET(request)
      const data = await response.json()

      // Query too short, should return empty results
      expect(data.filters.query).toBe('')
    })

    it('should handle database errors', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
        count: 0,
      })

      const request = new NextRequest('http://localhost:3000/api/politicians/search?q=test')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Search failed')
    })

    it('should include cache headers in response', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      const request = new NextRequest('http://localhost:3000/api/politicians/search?q=test')
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toContain('max-age=600')
    })

    it('should handle multiple filters simultaneously', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/politicians/search?q=test&party=민주당&region=서울&position=국회의원'
      )
      await GET(request)

      expect(mockSupabase.ilike).toHaveBeenCalled()
      expect(mockSupabase.in).toHaveBeenCalledTimes(3)
    })
  })

  describe('OPTIONS', () => {
    it('should return CORS headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/politicians/search')
      const response = await OPTIONS(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    })
  })
})
