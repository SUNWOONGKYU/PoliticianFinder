import {
  getPoliticianDetail,
  getPoliticianRatings,
  getRatingStats,
  createRating,
  getUserRatingForPolitician
} from '../politicians'
import { supabase } from '../../supabase'

// Mock Supabase client
jest.mock('../../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}))

describe('Politicians API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPoliticianDetail', () => {
    it('should fetch and format politician detail correctly', async () => {
      const mockPolitician = {
        id: 1,
        name: '홍길동',
        party: '무소속',
        district: '서울 강남구',
        position: '국회의원',
        profile_image_url: 'https://example.com/image.jpg',
        bio: '정치인 약력',
        website_url: 'https://example.com',
        avg_rating: 4.5,
        total_ratings: 100,
        ai_score_claude: 4.2,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockRatings = [
        { score: 5 },
        { score: 5 },
        { score: 4 },
        { score: 3 },
        { score: 2 }
      ]

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPolitician, error: null })
          })
        })
      })

      ;(supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockPolitician, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: mockRatings, error: null })
          })
        })

      const result = await getPoliticianDetail(1)

      expect(result).not.toBeNull()
      expect(result?.id).toBe(1)
      expect(result?.name).toBe('홍길동')
      expect(result?.rating_distribution).toEqual({ 5: 2, 4: 1, 3: 1, 2: 1, 1: 0 })
    })

    it('should return null on error', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
          })
        })
      })

      const result = await getPoliticianDetail(999)

      expect(result).toBeNull()
    })

    it('should handle missing optional fields', async () => {
      const mockPolitician = {
        id: 1,
        name: '홍길동',
        party: null,
        district: null,
        position: null,
        profile_image_url: null,
        bio: null,
        website_url: null,
        avg_rating: null,
        total_ratings: null,
        ai_score_claude: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      ;(supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockPolitician, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          })
        })

      const result = await getPoliticianDetail(1)

      expect(result).not.toBeNull()
      expect(result?.party).toBe('무소속')
      expect(result?.region).toBe('')
      expect(result?.avg_rating).toBe(0)
    })
  })

  describe('getPoliticianRatings', () => {
    it('should fetch and format ratings with pagination', async () => {
      const mockRatings = [
        {
          id: 1,
          user_id: 'user1',
          politician_id: 1,
          score: 5,
          comment: 'Great!',
          category: 'overall',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          profiles: { username: 'testuser', avatar_url: 'https://example.com/avatar.jpg' }
        }
      ]

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({ data: mockRatings, error: null, count: 1 })
            })
          })
        })
      })

      const result = await getPoliticianRatings(1, { page: 1, limit: 10 })

      expect(result.ratings).toHaveLength(1)
      expect(result.ratings[0].score).toBe(5)
      expect(result.pagination.total).toBe(1)
      expect(result.pagination.totalPages).toBe(1)
    })

    it('should apply filters correctly', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          not: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 })
          })
        })
      })

      ;(supabase.from as jest.Mock) = mockFrom

      await getPoliticianRatings(1, {
        category: 'leadership',
        minScore: 3,
        maxScore: 5,
        hasComment: true,
        sortBy: 'rating_high'
      })

      expect(mockFrom).toHaveBeenCalledWith('ratings')
    })

    it('should handle empty results', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 })
            })
          })
        })
      })

      const result = await getPoliticianRatings(1)

      expect(result.ratings).toEqual([])
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('getRatingStats', () => {
    it('should calculate rating statistics correctly', async () => {
      const mockPolitician = {
        avg_rating: 4.5,
        total_ratings: 100
      }

      const mockRatings = [
        { score: 5, category: 'leadership' },
        { score: 5, category: 'leadership' },
        { score: 4, category: 'integrity' },
        { score: 3, category: 'overall' }
      ]

      ;(supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockPolitician, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: mockRatings, error: null })
          })
        })

      const result = await getRatingStats(1)

      expect(result).not.toBeNull()
      expect(result?.averageScore).toBe(4.5)
      expect(result?.totalRatings).toBe(100)
      expect(result?.distribution).toEqual({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 })
      expect(result?.categoryBreakdown.leadership.count).toBe(2)
      expect(result?.categoryBreakdown.leadership.average).toBe(5)
    })

    it('should return null on error', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
          })
        })
      })

      const result = await getRatingStats(999)

      expect(result).toBeNull()
    })
  })

  describe('createRating', () => {
    it('should create rating successfully', async () => {
      const mockUser = { id: 'user1' }
      const mockRating = {
        id: 1,
        user_id: 'user1',
        politician_id: 1,
        score: 5,
        comment: 'Great!',
        category: 'overall',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        profiles: { username: 'testuser', avatar_url: 'https://example.com/avatar.jpg' }
      }

      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } })

      ;(supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockRating, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [{ score: 5 }], error: null })
          })
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })

      const result = await createRating({
        politician_id: 1,
        score: 5,
        comment: 'Great!',
        category: 'overall'
      })

      expect(result).not.toBeNull()
      expect(result?.score).toBe(5)
    })

    it('should return null when user is not authenticated', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } })

      const result = await createRating({
        politician_id: 1,
        score: 5
      })

      expect(result).toBeNull()
    })

    it('should return null when user has already rated', async () => {
      const mockUser = { id: 'user1' }

      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } })
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null })
        })
      })

      const result = await createRating({
        politician_id: 1,
        score: 5
      })

      expect(result).toBeNull()
    })
  })

  describe('getUserRatingForPolitician', () => {
    it('should fetch user rating successfully', async () => {
      const mockUser = { id: 'user1' }
      const mockRating = {
        id: 1,
        user_id: 'user1',
        politician_id: 1,
        score: 5,
        comment: 'Great!',
        category: 'overall',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        profiles: { username: 'testuser', avatar_url: 'https://example.com/avatar.jpg' }
      }

      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } })
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockRating, error: null })
        })
      })

      const result = await getUserRatingForPolitician(1)

      expect(result).not.toBeNull()
      expect(result?.score).toBe(5)
    })

    it('should return null when user is not authenticated', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } })

      const result = await getUserRatingForPolitician(1)

      expect(result).toBeNull()
    })

    it('should return null when user has not rated', async () => {
      const mockUser = { id: 'user1' }

      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } })
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
        })
      })

      const result = await getUserRatingForPolitician(1)

      expect(result).toBeNull()
    })
  })
})
