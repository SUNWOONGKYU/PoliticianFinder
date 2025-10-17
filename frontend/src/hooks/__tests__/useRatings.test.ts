import { renderHook, waitFor } from '@testing-library/react'
import { useRatings, scoreToStars, ratingToText, categoryToKorean } from '../useRatings'

global.fetch = jest.fn()

describe('useRatings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('createRating', () => {
    it('should create rating successfully', async () => {
      const mockRating = { id: 1, politician_id: 1, score: 4.5, category: 'overall' }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockRating }),
      })

      const { result } = renderHook(() => useRatings())

      const rating = await result.current.createRating({
        politician_id: 1,
        score: 4.5,
        category: 'overall',
        comment: 'Great politician',
      })

      expect(rating).toEqual(mockRating)
      expect(result.current.error).toBeNull()
    })

    it('should handle create rating error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Failed to create rating' }),
      })

      const { result } = renderHook(() => useRatings())

      const rating = await result.current.createRating({
        politician_id: 1,
        score: 4.5,
        category: 'overall',
      })

      expect(rating).toBeNull()
      expect(result.current.error).toBeTruthy()
    })
  })

  describe('getRatings', () => {
    it('should fetch ratings with pagination', async () => {
      const mockResponse = {
        data: [{ id: 1, score: 4.5 }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse }),
      })

      const { result } = renderHook(() => useRatings())

      const ratings = await result.current.getRatings(1, 1, 10)

      expect(ratings).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ratings?politician_id=1&page=1&limit=10'),
        expect.any(Object)
      )
    })
  })

  describe('updateRating', () => {
    it('should update rating successfully', async () => {
      const mockUpdated = { id: 1, score: 5.0, category: 'policy' }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUpdated }),
      })

      const { result } = renderHook(() => useRatings())

      const updated = await result.current.updateRating(1, { score: 5.0 })

      expect(updated).toEqual(mockUpdated)
    })
  })

  describe('deleteRating', () => {
    it('should delete rating successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const { result } = renderHook(() => useRatings())

      const deleted = await result.current.deleteRating(1)

      expect(deleted).toBe(true)
    })
  })

  describe('getRatingStats', () => {
    it('should fetch rating statistics', async () => {
      const mockStats = {
        average: 4.2,
        total: 150,
        distribution: { 5: 50, 4: 40, 3: 30, 2: 20, 1: 10 },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockStats }),
      })

      const { result } = renderHook(() => useRatings())

      const stats = await result.current.getRatingStats(1)

      expect(stats).toEqual(mockStats)
    })
  })

  describe('loading state', () => {
    it('should set loading state during API call', async () => {
      let resolvePromise: any
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      ;(global.fetch as jest.Mock).mockReturnValueOnce(promise)

      const { result } = renderHook(() => useRatings())

      const createPromise = result.current.createRating({
        politician_id: 1,
        score: 4.5,
        category: 'overall',
      })

      expect(result.current.loading).toBe(true)

      resolvePromise({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      })

      await createPromise

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })
})

describe('Utility functions', () => {
  describe('scoreToStars', () => {
    it('should convert score to stars correctly', () => {
      expect(scoreToStars(5)).toBe('★★★★★')
      expect(scoreToStars(4.5)).toBe('★★★★☆')
      expect(scoreToStars(4)).toBe('★★★★☆')
      expect(scoreToStars(3.5)).toBe('★★★☆☆☆')
      expect(scoreToStars(0)).toBe('☆☆☆☆☆')
    })
  })

  describe('ratingToText', () => {
    it('should convert rating to Korean text', () => {
      expect(ratingToText(5)).toBe('매우 좋음')
      expect(ratingToText(4.5)).toBe('매우 좋음')
      expect(ratingToText(3.5)).toBe('좋음')
      expect(ratingToText(2.5)).toBe('보통')
      expect(ratingToText(1.5)).toBe('나쁨')
      expect(ratingToText(0.5)).toBe('매우 나쁨')
      expect(ratingToText(0)).toBe('평가 없음')
    })
  })

  describe('categoryToKorean', () => {
    it('should convert category to Korean', () => {
      expect(categoryToKorean('overall')).toBe('전체')
      expect(categoryToKorean('policy')).toBe('정책')
      expect(categoryToKorean('integrity')).toBe('청렴도')
      expect(categoryToKorean('communication')).toBe('소통')
      expect(categoryToKorean('unknown')).toBe('unknown')
    })
  })
})
