/**
 * Pagination utility functions and types
 * Provides offset-based pagination helpers for data fetching
 */

/**
 * Parameters for pagination requests
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * Result structure for paginated data
 */
export interface PaginationResult<T> {
  data: T[]
  pagination: PaginationMeta
}

/**
 * Metadata for pagination state
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Calculate pagination metadata
 * @param page Current page number
 * @param limit Items per page
 * @param total Total number of items
 * @returns Pagination metadata with calculated values
 */
export function getPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

/**
 * Validate and sanitize pagination parameters
 * @param page Page number (defaults to 1)
 * @param limit Items per page (defaults to 10, max 100)
 * @returns Validated pagination parameters
 */
export function validatePaginationParams(
  page?: number,
  limit?: number
): PaginationParams {
  const validPage = Math.max(1, page || 1)
  const validLimit = Math.min(Math.max(1, limit || 10), 100)

  return {
    page: validPage,
    limit: validLimit
  }
}

/**
 * Calculate range for database queries (zero-indexed)
 * @param page Page number (1-indexed)
 * @param limit Items per page
 * @returns Tuple of [start, end] indices for Supabase range queries
 */
export function getRange(page: number, limit: number): [number, number] {
  const start = (page - 1) * limit
  const end = start + limit - 1

  return [start, end]
}

/**
 * Calculate offset for database queries
 * @param page Page number (1-indexed)
 * @param limit Items per page
 * @returns Offset value for database query
 */
export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * Create pagination response object
 * @param data Array of data items
 * @param page Current page number
 * @param limit Items per page
 * @param total Total number of items
 * @returns Paginated result with metadata
 */
export function createPaginationResult<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginationResult<T> {
  return {
    data,
    pagination: getPaginationMeta(page, limit, total)
  }
}

/**
 * Parse pagination parameters from URL search params
 * @param searchParams URL search parameters
 * @returns Validated pagination parameters
 */
export function parsePaginationParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): PaginationParams {
  let page: number | undefined
  let limit: number | undefined

  if (searchParams instanceof URLSearchParams) {
    page = Number(searchParams.get('page')) || undefined
    limit = Number(searchParams.get('limit')) || undefined
  } else {
    const pageParam = searchParams.page
    const limitParam = searchParams.limit

    page = typeof pageParam === 'string' ? Number(pageParam) : undefined
    limit = typeof limitParam === 'string' ? Number(limitParam) : undefined
  }

  return validatePaginationParams(page, limit)
}

/**
 * Build URL search params string from pagination parameters
 * @param params Pagination parameters
 * @returns URL search params string
 */
export function buildPaginationQuery(params: PaginationParams): string {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString()
  })

  return searchParams.toString()
}

/**
 * Check if a page number is valid for given total pages
 * @param page Page number to check
 * @param totalPages Total number of pages
 * @returns True if page is valid
 */
export function isValidPage(page: number, totalPages: number): boolean {
  return page >= 1 && page <= totalPages && Number.isInteger(page)
}

/**
 * Get page numbers for pagination UI
 * @param currentPage Current page number
 * @param totalPages Total number of pages
 * @param maxVisible Maximum number of page buttons to show
 * @returns Array of page numbers to display
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, currentPage - half)
  let end = Math.min(totalPages, start + maxVisible - 1)

  // Adjust start if we're near the end
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

/**
 * Constants for pagination
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
} as const

/**
 * Common page size options for UI selectors
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const