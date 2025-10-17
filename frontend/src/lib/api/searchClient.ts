/**
 * 검색 클라이언트
 * 프론트엔드에서 검색 API를 호출하기 위한 유틸리티
 */

import { Politician, PaginatedResponse } from '@/types/database'

export interface SearchOptions {
  q?: string           // 검색어
  party?: string[]     // 정당 필터
  region?: string[]    // 지역 필터
  position?: string[]  // 직급 필터
  page?: number        // 페이지 번호
  limit?: number       // 페이지당 항목 수
  sort?: string        // 정렬 필드
  order?: 'asc' | 'desc' // 정렬 방향
}

export interface AutocompleteOptions {
  q: string           // 검색어 (필수)
  type?: 'politician' | 'party' | 'region' // 자동완성 타입
}

export interface AutocompleteSuggestion {
  id: string
  name: string
  label: string
  party?: string
  region?: string
}

export interface AutocompleteResponse {
  suggestions: AutocompleteSuggestion[]
  cached?: boolean
  message?: string
}

/**
 * 정치인 검색 API 호출
 * @param options 검색 옵션
 * @returns 검색 결과
 */
export async function searchPoliticians(
  options: SearchOptions
): Promise<PaginatedResponse<Politician>> {
  const params = new URLSearchParams()

  // 검색어
  if (options.q) {
    params.append('q', options.q)
  }

  // 정당 필터 (쉼표 구분)
  if (options.party && options.party.length > 0) {
    params.append('party', options.party.join(','))
  }

  // 지역 필터 (쉼표 구분)
  if (options.region && options.region.length > 0) {
    params.append('region', options.region.join(','))
  }

  // 직급 필터 (쉼표 구분)
  if (options.position && options.position.length > 0) {
    params.append('position', options.position.join(','))
  }

  // 페이지네이션
  if (options.page) {
    params.append('page', options.page.toString())
  }
  if (options.limit) {
    params.append('limit', options.limit.toString())
  }

  // 정렬
  if (options.sort) {
    params.append('sort', options.sort)
  }
  if (options.order) {
    params.append('order', options.order)
  }

  const response = await fetch(`/api/politicians/search?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // 캐시 설정
    next: {
      revalidate: 60 // 1분간 캐시
    }
  })

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 자동완성 API 호출
 * @param options 자동완성 옵션
 * @returns 자동완성 결과
 */
export async function getAutocompleteSuggestions(
  options: AutocompleteOptions
): Promise<AutocompleteResponse> {
  const params = new URLSearchParams()

  params.append('q', options.q)
  if (options.type) {
    params.append('type', options.type)
  }

  const response = await fetch(`/api/autocomplete?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // 캐시 설정
    next: {
      revalidate: 60 // 1분간 캐시
    }
  })

  if (!response.ok) {
    return { suggestions: [] }
  }

  return response.json()
}

/**
 * 정치인 목록 API 호출
 * @param options 목록 옵션
 * @returns 정치인 목록
 */
export async function getPoliticians(
  options: Partial<SearchOptions> = {}
): Promise<PaginatedResponse<Politician>> {
  const params = new URLSearchParams()

  // 검색 파라미터 (P2B1 명세)
  if (options.q) {
    params.append('search', options.q)
  }
  if (options.party && options.party.length > 0) {
    params.append('party', options.party.join(','))
  }
  if (options.region && options.region.length > 0) {
    params.append('region', options.region.join(','))
  }
  if (options.position && options.position.length > 0) {
    params.append('position', options.position.join(','))
  }

  // 페이지네이션
  params.append('page', (options.page || 1).toString())
  params.append('limit', (options.limit || 10).toString())

  // 정렬
  if (options.sort) {
    params.append('sort', options.sort)
  }
  if (options.order) {
    params.append('order', options.order)
  }

  const response = await fetch(`/api/politicians?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    next: {
      revalidate: 30 // 30초간 캐시
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch politicians: ${response.statusText}`)
  }

  const data = await response.json()

  // 응답 형식 변환 (P2B1 형식을 표준 PaginatedResponse로)
  return {
    data: data.data || [],
    pagination: data.pagination
  }
}

/**
 * 검색 URL 빌더
 * URL의 쿼리 파라미터에서 검색 옵션 추출
 */
export function parseSearchParams(searchParams: URLSearchParams): SearchOptions {
  const options: SearchOptions = {}

  // 검색어
  const q = searchParams.get('q')
  if (q) options.q = q

  // 정당 필터
  const party = searchParams.get('party')
  if (party) options.party = party.split(',')

  // 지역 필터
  const region = searchParams.get('region')
  if (region) options.region = region.split(',')

  // 직급 필터
  const position = searchParams.get('position')
  if (position) options.position = position.split(',')

  // 페이지네이션
  const page = searchParams.get('page')
  if (page) options.page = parseInt(page)

  const limit = searchParams.get('limit')
  if (limit) options.limit = parseInt(limit)

  // 정렬
  const sort = searchParams.get('sort')
  if (sort) options.sort = sort

  const order = searchParams.get('order')
  if (order === 'asc' || order === 'desc') options.order = order

  return options
}

/**
 * 검색 옵션을 URL 쿼리 문자열로 변환
 */
export function buildSearchQuery(options: SearchOptions): string {
  const params = new URLSearchParams()

  if (options.q) params.append('q', options.q)
  if (options.party?.length) params.append('party', options.party.join(','))
  if (options.region?.length) params.append('region', options.region.join(','))
  if (options.position?.length) params.append('position', options.position.join(','))
  if (options.page) params.append('page', options.page.toString())
  if (options.limit) params.append('limit', options.limit.toString())
  if (options.sort) params.append('sort', options.sort)
  if (options.order) params.append('order', options.order)

  return params.toString()
}