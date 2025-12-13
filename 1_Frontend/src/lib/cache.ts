/**
 * API 응답 캐싱 유틸리티
 * 클라이언트 사이드 캐싱으로 반복 요청 감소
 * Created: 2025-12-13
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ClientCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5분

  /**
   * 캐시에서 데이터 가져오기
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    // 만료 체크
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 캐시에 데이터 저장
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + (ttl || this.defaultTTL),
    });
  }

  /**
   * 특정 키 삭제
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 패턴에 맞는 키 모두 삭제
   */
  invalidate(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 전체 캐시 클리어
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 캐시 상태 확인
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 싱글톤 인스턴스
export const clientCache = new ClientCache();

/**
 * 캐시된 fetch 함수
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit & { cacheTTL?: number; forceRefresh?: boolean }
): Promise<T> {
  const { cacheTTL, forceRefresh, ...fetchOptions } = options || {};
  const cacheKey = `fetch:${url}:${JSON.stringify(fetchOptions)}`;

  // forceRefresh가 아니면 캐시 확인
  if (!forceRefresh) {
    const cached = clientCache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // 실제 fetch 수행
  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // GET 요청만 캐싱 (POST, PUT, DELETE는 캐싱하지 않음)
  if (!fetchOptions?.method || fetchOptions.method === 'GET') {
    clientCache.set(cacheKey, data, cacheTTL);
  }

  return data;
}

/**
 * SWR 스타일 캐시 훅을 위한 캐시 키 생성
 */
export function createCacheKey(base: string, params?: Record<string, unknown>): string {
  if (!params) return base;
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${base}?${sortedParams}`;
}

/**
 * 캐시 TTL 상수 (밀리초)
 */
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1분
  MEDIUM: 5 * 60 * 1000,     // 5분
  LONG: 30 * 60 * 1000,      // 30분
  HOUR: 60 * 60 * 1000,      // 1시간
  DAY: 24 * 60 * 60 * 1000,  // 1일
} as const;

/**
 * API 별 캐시 설정
 */
export const API_CACHE_CONFIG: Record<string, number> = {
  '/api/politicians': CACHE_TTL.MEDIUM,
  '/api/politicians/statistics': CACHE_TTL.LONG,
  '/api/community/posts': CACHE_TTL.SHORT,
  '/api/notices': CACHE_TTL.LONG,
  '/api/ads': CACHE_TTL.MEDIUM,
};
