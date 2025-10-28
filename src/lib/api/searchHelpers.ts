/**
 * 검색 헬퍼 함수들
 * SQL Injection 방지 및 검색 최적화 유틸리티
 */

/**
 * SQL Injection 방지를 위한 특수문자 이스케이프
 * @param query 검색어
 * @returns 이스케이프된 검색어
 */
export function escapeSearchQuery(query: string): string {
  // PostgreSQL ILIKE 패턴에서 특수문자 이스케이프
  return query
    .replace(/\\/g, '\\\\') // 백슬래시
    .replace(/%/g, '\\%')    // 퍼센트
    .replace(/_/g, '\\_')    // 언더스코어
    .replace(/'/g, "''")     // 작은따옴표
}

/**
 * 검색어 검증 및 정제
 * @param query 원본 검색어
 * @param minLength 최소 길이 (기본값: 2)
 * @param maxLength 최대 길이 (기본값: 100)
 * @returns 정제된 검색어
 */
export function sanitizeSearchQuery(
  query: string,
  minLength: number = 2,
  maxLength: number = 100
): string {
  // 공백 제거
  let sanitized = query.trim()

  // 길이 제한
  if (sanitized.length < minLength) {
    return ''
  }

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  // 연속된 공백을 하나로
  sanitized = sanitized.replace(/\s+/g, ' ')

  return sanitized
}

/**
 * 다중 값 파라미터 파싱 (쉼표 구분)
 * @param value 쉼표로 구분된 문자열
 * @param maxItems 최대 항목 수
 * @returns 파싱된 배열
 */
export function parseMultipleValues(
  value: string | null,
  maxItems: number = 10
): string[] {
  if (!value) return []

  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .slice(0, maxItems)
}

/**
 * 페이지네이션 파라미터 검증
 * @param page 페이지 번호
 * @param limit 페이지당 항목 수
 * @returns 검증된 페이지네이션 값
 */
export function validatePagination(
  page: string | null,
  limit: string | null
): { page: number; limit: number } {
  const parsedPage = parseInt(page || '1')
  const parsedLimit = parseInt(limit || '10')

  return {
    page: isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
    limit: isNaN(parsedLimit) || parsedLimit < 1
      ? 10
      : Math.min(parsedLimit, 100) // 최대 100개
  }
}

/**
 * 정렬 파라미터 검증
 * @param sort 정렬 필드
 * @param order 정렬 방향
 * @param allowedFields 허용된 정렬 필드
 * @returns 검증된 정렬 옵션
 */
export function validateSortOptions(
  sort: string | null,
  order: string | null,
  allowedFields: string[] = ['name', 'party', 'region', 'position', 'created_at']
): { field: string; ascending: boolean } {
  const field = allowedFields.includes(sort || '') ? sort! : 'name'
  const ascending = order?.toLowerCase() !== 'desc'

  return { field, ascending }
}

/**
 * 검색 하이라이트용 텍스트 처리
 * @param text 원본 텍스트
 * @param query 검색어
 * @returns 하이라이트 마크업이 포함된 텍스트
 */
export function highlightSearchTerm(text: string, query: string): string {
  if (!query || query.length < 2) return text

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')

  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * 자동완성 디바운스 타이머
 * 너무 빈번한 API 호출 방지
 */
export class DebounceTimer {
  private timer: NodeJS.Timeout | null = null
  private delay: number

  constructor(delay: number = 300) {
    this.delay = delay
  }

  debounce(callback: () => void): void {
    if (this.timer) {
      clearTimeout(this.timer)
    }

    this.timer = setTimeout(() => {
      callback()
      this.timer = null
    }, this.delay)
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}

/**
 * 검색 캐시 관리
 * 동일한 검색어에 대한 중복 요청 방지
 */
export class SearchCache {
  private cache: Map<string, { data: any; timestamp: number }>
  private ttl: number

  constructor(ttl: number = 60000) { // 기본 1분
    this.cache = new Map()
    this.ttl = ttl
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  set(key: string, data: any): void {
    // 캐시 크기 제한 (최대 50개)
    if (this.cache.size >= 50) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clear(): void {
    this.cache.clear()
  }
}