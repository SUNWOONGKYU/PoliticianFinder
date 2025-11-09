/**
 * Project Grid Task ID: P4BA12
 * 작업명: 시스템 설정 API - 캐시 관리자
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5 (api-designer)
 * 의존성: P2D1 (Database 스키마)
 * 설명: 시스템 설정 캐시 관리 유틸리티 (인메모리 캐시)
 */

/**
 * 캐시 항목 인터페이스
 */
interface CacheItem<T = any> {
  value: T;
  expiresAt: number;
}

/**
 * 캐시 관리자 클래스
 * 설정값을 메모리에 캐싱하여 DB 조회 횟수 감소
 */
export class CacheManager {
  private cache: Map<string, CacheItem>;
  private defaultTTL: number; // 기본 TTL (밀리초)

  /**
   * 생성자
   * @param defaultTTL 기본 TTL (초 단위, 기본: 300초 = 5분)
   */
  constructor(defaultTTL: number = 300) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL * 1000; // 초를 밀리초로 변환
  }

  /**
   * 캐시에 값 저장
   * @param key 캐시 키
   * @param value 저장할 값
   * @param ttl TTL (초 단위, 선택사항)
   */
  set<T = any>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ? ttl * 1000 : this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * 캐시에서 값 조회
   * @param key 캐시 키
   * @returns 캐시된 값 또는 null
   */
  get<T = any>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // 만료 확인
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * 캐시에 키가 존재하는지 확인
   * @param key 캐시 키
   * @returns 존재 여부
   */
  has(key: string): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    // 만료 확인
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 캐시에서 항목 삭제
   * @param key 캐시 키
   * @returns 삭제 성공 여부
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 전체 캐시 초기화
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 만료된 항목들 정리
   * @returns 삭제된 항목 수
   */
  cleanup(): number {
    const now = Date.now();
    let count = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * 캐시 크기 조회
   * @returns 캐시된 항목 수
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 캐시의 모든 키 조회
   * @returns 키 배열
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 특정 패턴과 일치하는 키들 삭제
   * @param pattern 삭제할 키 패턴 (예: 'points.*')
   * @returns 삭제된 항목 수
   */
  deletePattern(pattern: string): number {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * 캐시 통계 조회
   * @returns 캐시 통계
   */
  getStats(): {
    size: number;
    keys: string[];
    oldestExpiration: number | null;
    newestExpiration: number | null;
  } {
    const keys = Array.from(this.cache.keys());
    const expirations = Array.from(this.cache.values()).map(item => item.expiresAt);

    return {
      size: this.cache.size,
      keys,
      oldestExpiration: expirations.length > 0 ? Math.min(...expirations) : null,
      newestExpiration: expirations.length > 0 ? Math.max(...expirations) : null,
    };
  }

  /**
   * 값이 만료되기까지 남은 시간 조회 (밀리초)
   * @param key 캐시 키
   * @returns 남은 시간 (밀리초) 또는 null
   */
  getTTL(key: string): number | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    const remaining = item.expiresAt - Date.now();
    return remaining > 0 ? remaining : null;
  }

  /**
   * 캐시 항목의 만료 시간 연장
   * @param key 캐시 키
   * @param additionalTTL 추가 TTL (초 단위)
   * @returns 성공 여부
   */
  extend(key: string, additionalTTL: number): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    item.expiresAt += additionalTTL * 1000;
    return true;
  }
}

/**
 * 싱글톤 캐시 관리자 인스턴스
 * 애플리케이션 전역에서 하나의 캐시 인스턴스 공유
 */
let globalCacheInstance: CacheManager | null = null;

/**
 * 전역 캐시 관리자 인스턴스 가져오기
 * @param defaultTTL 기본 TTL (초 단위, 선택사항)
 * @returns 캐시 관리자 인스턴스
 */
export function getGlobalCache(defaultTTL?: number): CacheManager {
  if (!globalCacheInstance) {
    globalCacheInstance = new CacheManager(defaultTTL);
  }
  return globalCacheInstance;
}

/**
 * 전역 캐시 관리자 인스턴스 재설정
 * @param defaultTTL 기본 TTL (초 단위, 선택사항)
 * @returns 새로운 캐시 관리자 인스턴스
 */
export function resetGlobalCache(defaultTTL?: number): CacheManager {
  globalCacheInstance = new CacheManager(defaultTTL);
  return globalCacheInstance;
}

/**
 * 정기적인 캐시 정리 스케줄러
 * @param cache 캐시 관리자 인스턴스
 * @param intervalMinutes 정리 주기 (분 단위, 기본: 10분)
 * @returns 인터벌 ID
 */
export function scheduleCacheCleanup(
  cache: CacheManager,
  intervalMinutes: number = 10
): NodeJS.Timeout {
  return setInterval(() => {
    const deleted = cache.cleanup();
    if (deleted > 0) {
      console.log(`[CacheManager] Cleaned up ${deleted} expired items`);
    }
  }, intervalMinutes * 60 * 1000);
}
