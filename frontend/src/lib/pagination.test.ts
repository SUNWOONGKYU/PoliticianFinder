import {
  getPaginationMeta,
  validatePaginationParams,
  getRange,
  getOffset,
  createPaginationResult,
  parsePaginationParams,
  buildPaginationQuery,
  isValidPage,
  getPageNumbers,
  PAGINATION_DEFAULTS
} from './pagination'

describe('Pagination Utilities', () => {
  describe('getPaginationMeta', () => {
    it('should calculate pagination metadata correctly', () => {
      const meta = getPaginationMeta(2, 10, 25)

      expect(meta).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true
      })
    })

    it('should handle first page correctly', () => {
      const meta = getPaginationMeta(1, 10, 25)

      expect(meta.hasPrev).toBe(false)
      expect(meta.hasNext).toBe(true)
    })

    it('should handle last page correctly', () => {
      const meta = getPaginationMeta(3, 10, 25)

      expect(meta.hasPrev).toBe(true)
      expect(meta.hasNext).toBe(false)
    })

    it('should handle single page correctly', () => {
      const meta = getPaginationMeta(1, 10, 5)

      expect(meta.totalPages).toBe(1)
      expect(meta.hasPrev).toBe(false)
      expect(meta.hasNext).toBe(false)
    })

    it('should handle empty results', () => {
      const meta = getPaginationMeta(1, 10, 0)

      expect(meta.totalPages).toBe(0)
      expect(meta.hasPrev).toBe(false)
      expect(meta.hasNext).toBe(false)
    })
  })

  describe('validatePaginationParams', () => {
    it('should return default values for undefined params', () => {
      const params = validatePaginationParams()

      expect(params).toEqual({
        page: 1,
        limit: 10
      })
    })

    it('should enforce minimum page number', () => {
      const params = validatePaginationParams(-1, 10)

      expect(params.page).toBe(1)
    })

    it('should enforce minimum limit', () => {
      const params = validatePaginationParams(1, 0)

      expect(params.limit).toBe(1)
    })

    it('should enforce maximum limit', () => {
      const params = validatePaginationParams(1, 200)

      expect(params.limit).toBe(100)
    })

    it('should accept valid parameters', () => {
      const params = validatePaginationParams(5, 20)

      expect(params).toEqual({
        page: 5,
        limit: 20
      })
    })
  })

  describe('getRange', () => {
    it('should calculate range for first page', () => {
      const [start, end] = getRange(1, 10)

      expect(start).toBe(0)
      expect(end).toBe(9)
    })

    it('should calculate range for middle page', () => {
      const [start, end] = getRange(3, 10)

      expect(start).toBe(20)
      expect(end).toBe(29)
    })

    it('should handle different page sizes', () => {
      const [start, end] = getRange(2, 25)

      expect(start).toBe(25)
      expect(end).toBe(49)
    })
  })

  describe('getOffset', () => {
    it('should calculate offset correctly', () => {
      expect(getOffset(1, 10)).toBe(0)
      expect(getOffset(2, 10)).toBe(10)
      expect(getOffset(5, 20)).toBe(80)
    })
  })

  describe('createPaginationResult', () => {
    it('should create pagination result with metadata', () => {
      const data = [1, 2, 3, 4, 5]
      const result = createPaginationResult(data, 2, 5, 15)

      expect(result.data).toEqual(data)
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 15,
        totalPages: 3,
        hasNext: true,
        hasPrev: true
      })
    })
  })

  describe('parsePaginationParams', () => {
    it('should parse from URLSearchParams', () => {
      const searchParams = new URLSearchParams('page=3&limit=20')
      const params = parsePaginationParams(searchParams)

      expect(params).toEqual({
        page: 3,
        limit: 20
      })
    })

    it('should parse from plain object', () => {
      const params = parsePaginationParams({
        page: '2',
        limit: '15'
      })

      expect(params).toEqual({
        page: 2,
        limit: 15
      })
    })

    it('should handle missing parameters', () => {
      const params = parsePaginationParams({})

      expect(params).toEqual({
        page: 1,
        limit: 10
      })
    })

    it('should handle invalid parameters', () => {
      const params = parsePaginationParams({
        page: 'abc',
        limit: 'xyz'
      })

      expect(params).toEqual({
        page: 1,
        limit: 10
      })
    })
  })

  describe('buildPaginationQuery', () => {
    it('should build query string from params', () => {
      const query = buildPaginationQuery({ page: 2, limit: 20 })

      expect(query).toBe('page=2&limit=20')
    })
  })

  describe('isValidPage', () => {
    it('should validate page numbers correctly', () => {
      expect(isValidPage(1, 5)).toBe(true)
      expect(isValidPage(3, 5)).toBe(true)
      expect(isValidPage(5, 5)).toBe(true)
      expect(isValidPage(0, 5)).toBe(false)
      expect(isValidPage(6, 5)).toBe(false)
      expect(isValidPage(1.5, 5)).toBe(false)
    })
  })

  describe('getPageNumbers', () => {
    it('should return all pages when total is less than max visible', () => {
      const pages = getPageNumbers(2, 3, 5)

      expect(pages).toEqual([1, 2, 3])
    })

    it('should return limited pages when total exceeds max visible', () => {
      const pages = getPageNumbers(5, 10, 5)

      expect(pages).toEqual([3, 4, 5, 6, 7])
    })

    it('should handle start boundary', () => {
      const pages = getPageNumbers(2, 10, 5)

      expect(pages).toEqual([1, 2, 3, 4, 5])
    })

    it('should handle end boundary', () => {
      const pages = getPageNumbers(9, 10, 5)

      expect(pages).toEqual([6, 7, 8, 9, 10])
    })

    it('should handle single page', () => {
      const pages = getPageNumbers(1, 1, 5)

      expect(pages).toEqual([1])
    })
  })
})