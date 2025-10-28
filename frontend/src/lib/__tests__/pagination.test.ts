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
  PAGINATION_DEFAULTS,
  PAGE_SIZE_OPTIONS
} from '../pagination'

describe('Pagination utilities', () => {
  describe('getPaginationMeta', () => {
    it('should calculate correct metadata for first page', () => {
      const meta = getPaginationMeta(1, 10, 100)

      expect(meta).toEqual({
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false
      })
    })

    it('should calculate correct metadata for middle page', () => {
      const meta = getPaginationMeta(5, 10, 100)

      expect(meta).toEqual({
        page: 5,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: true
      })
    })

    it('should calculate correct metadata for last page', () => {
      const meta = getPaginationMeta(10, 10, 100)

      expect(meta).toEqual({
        page: 10,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: false,
        hasPrev: true
      })
    })

    it('should handle partial last page', () => {
      const meta = getPaginationMeta(3, 10, 25)

      expect(meta).toEqual({
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: false,
        hasPrev: true
      })
    })

    it('should handle empty results', () => {
      const meta = getPaginationMeta(1, 10, 0)

      expect(meta).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      })
    })
  })

  describe('validatePaginationParams', () => {
    it('should return default values when no params provided', () => {
      const params = validatePaginationParams()

      expect(params).toEqual({
        page: 1,
        limit: 10
      })
    })

    it('should validate and return correct params', () => {
      const params = validatePaginationParams(5, 20)

      expect(params).toEqual({
        page: 5,
        limit: 20
      })
    })

    it('should enforce minimum page number', () => {
      const params = validatePaginationParams(-5, 10)

      expect(params.page).toBe(1)
    })

    it('should enforce maximum limit', () => {
      const params = validatePaginationParams(1, 200)

      expect(params.limit).toBe(100)
    })

    it('should enforce minimum limit', () => {
      const params = validatePaginationParams(1, 0)

      expect(params.limit).toBe(1)
    })

    it('should handle undefined values', () => {
      const params = validatePaginationParams(undefined, undefined)

      expect(params).toEqual({
        page: 1,
        limit: 10
      })
    })
  })

  describe('getRange', () => {
    it('should calculate correct range for first page', () => {
      const [start, end] = getRange(1, 10)

      expect(start).toBe(0)
      expect(end).toBe(9)
    })

    it('should calculate correct range for second page', () => {
      const [start, end] = getRange(2, 10)

      expect(start).toBe(10)
      expect(end).toBe(19)
    })

    it('should calculate correct range for custom page size', () => {
      const [start, end] = getRange(3, 25)

      expect(start).toBe(50)
      expect(end).toBe(74)
    })
  })

  describe('getOffset', () => {
    it('should calculate correct offset for first page', () => {
      expect(getOffset(1, 10)).toBe(0)
    })

    it('should calculate correct offset for second page', () => {
      expect(getOffset(2, 10)).toBe(10)
    })

    it('should calculate correct offset for custom page size', () => {
      expect(getOffset(5, 25)).toBe(100)
    })
  })

  describe('createPaginationResult', () => {
    it('should create correct pagination result', () => {
      const data = ['item1', 'item2', 'item3']
      const result = createPaginationResult(data, 1, 10, 30)

      expect(result).toEqual({
        data,
        pagination: {
          page: 1,
          limit: 10,
          total: 30,
          totalPages: 3,
          hasNext: true,
          hasPrev: false
        }
      })
    })

    it('should handle empty data', () => {
      const result = createPaginationResult([], 1, 10, 0)

      expect(result.data).toEqual([])
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.totalPages).toBe(0)
    })
  })

  describe('parsePaginationParams', () => {
    it('should parse URLSearchParams correctly', () => {
      const searchParams = new URLSearchParams('page=3&limit=25')
      const params = parsePaginationParams(searchParams)

      expect(params).toEqual({
        page: 3,
        limit: 25
      })
    })

    it('should parse Record correctly', () => {
      const searchParams = { page: '5', limit: '50' }
      const params = parsePaginationParams(searchParams)

      expect(params).toEqual({
        page: 5,
        limit: 50
      })
    })

    it('should handle missing params', () => {
      const searchParams = new URLSearchParams()
      const params = parsePaginationParams(searchParams)

      expect(params).toEqual({
        page: 1,
        limit: 10
      })
    })

    it('should handle invalid numbers', () => {
      const searchParams = new URLSearchParams('page=abc&limit=xyz')
      const params = parsePaginationParams(searchParams)

      expect(params).toEqual({
        page: 1,
        limit: 10
      })
    })
  })

  describe('buildPaginationQuery', () => {
    it('should build correct query string', () => {
      const query = buildPaginationQuery({ page: 3, limit: 25 })

      expect(query).toBe('page=3&limit=25')
    })

    it('should handle default values', () => {
      const query = buildPaginationQuery({ page: 1, limit: 10 })

      expect(query).toBe('page=1&limit=10')
    })
  })

  describe('isValidPage', () => {
    it('should return true for valid page numbers', () => {
      expect(isValidPage(1, 10)).toBe(true)
      expect(isValidPage(5, 10)).toBe(true)
      expect(isValidPage(10, 10)).toBe(true)
    })

    it('should return false for invalid page numbers', () => {
      expect(isValidPage(0, 10)).toBe(false)
      expect(isValidPage(-1, 10)).toBe(false)
      expect(isValidPage(11, 10)).toBe(false)
    })

    it('should return false for non-integer page numbers', () => {
      expect(isValidPage(1.5, 10)).toBe(false)
      expect(isValidPage(NaN, 10)).toBe(false)
    })
  })

  describe('getPageNumbers', () => {
    it('should return all pages when total is less than maxVisible', () => {
      const pages = getPageNumbers(1, 3, 5)

      expect(pages).toEqual([1, 2, 3])
    })

    it('should return correct pages for first page', () => {
      const pages = getPageNumbers(1, 10, 5)

      expect(pages).toEqual([1, 2, 3, 4, 5])
    })

    it('should return correct pages for middle page', () => {
      const pages = getPageNumbers(5, 10, 5)

      expect(pages).toEqual([3, 4, 5, 6, 7])
    })

    it('should return correct pages for last page', () => {
      const pages = getPageNumbers(10, 10, 5)

      expect(pages).toEqual([6, 7, 8, 9, 10])
    })

    it('should handle edge case near the end', () => {
      const pages = getPageNumbers(9, 10, 5)

      expect(pages).toEqual([6, 7, 8, 9, 10])
    })

    it('should use default maxVisible of 5', () => {
      const pages = getPageNumbers(5, 10)

      expect(pages).toHaveLength(5)
    })
  })

  describe('Constants', () => {
    it('should have correct default values', () => {
      expect(PAGINATION_DEFAULTS.PAGE).toBe(1)
      expect(PAGINATION_DEFAULTS.LIMIT).toBe(10)
      expect(PAGINATION_DEFAULTS.MAX_LIMIT).toBe(100)
      expect(PAGINATION_DEFAULTS.MIN_LIMIT).toBe(1)
    })

    it('should have correct page size options', () => {
      expect(PAGE_SIZE_OPTIONS).toEqual([10, 20, 50, 100])
    })
  })
})
