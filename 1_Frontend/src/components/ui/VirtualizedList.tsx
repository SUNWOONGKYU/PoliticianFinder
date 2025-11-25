/**
 * Task ID: P5MI3
 * 작업명: MI3 - 무한 스크롤 성능 최적화 (가상화 리스트)
 * 작업일: 2025-11-25
 * 설명: 대용량 리스트 성능 최적화를 위한 가상화 컴포넌트
 *       - Window/Container 스크롤 지원
 *       - 동적 아이템 높이 지원
 *       - 무한 스크롤 통합
 *       - 메모리 효율 최적화
 */

'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from 'react';

export interface VirtualizedListProps<T> {
  /**
   * 렌더링할 아이템 배열
   */
  items: T[];

  /**
   * 각 아이템 렌더링 함수
   */
  renderItem: (item: T, index: number) => React.ReactNode;

  /**
   * 아이템 고유 키 추출 함수
   */
  keyExtractor: (item: T, index: number) => string;

  /**
   * 예상 아이템 높이 (동적 높이 사용 시 초기값)
   */
  estimatedItemHeight: number;

  /**
   * 버퍼 아이템 수 (위/아래 각각)
   */
  overscanCount?: number;

  /**
   * 무한 스크롤: 더 불러오기 핸들러
   */
  onLoadMore?: () => void;

  /**
   * 무한 스크롤: 더 불러올 데이터 있음
   */
  hasMore?: boolean;

  /**
   * 로딩 상태
   */
  loading?: boolean;

  /**
   * 스크롤 임계점 (끝에서 몇 px 전에 로드)
   */
  loadMoreThreshold?: number;

  /**
   * 컨테이너 스타일
   */
  className?: string;

  /**
   * 컨테이너 높이 (미지정 시 window 스크롤)
   */
  height?: number | string;

  /**
   * 빈 상태 렌더링
   */
  emptyState?: React.ReactNode;

  /**
   * 로딩 인디케이터 커스텀
   */
  loadingIndicator?: React.ReactNode;
}

interface ItemMeasurement {
  offset: number;
  height: number;
}

function VirtualizedListInner<T>({
  items,
  renderItem,
  keyExtractor,
  estimatedItemHeight,
  overscanCount = 3,
  onLoadMore,
  hasMore = false,
  loading = false,
  loadMoreThreshold = 200,
  className = '',
  height,
  emptyState,
  loadingIndicator,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measurementCache = useRef<Map<string, number>>(new Map());
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const loadMoreTriggered = useRef(false);

  // 아이템 높이 측정값 캐시
  const measurements = useMemo<ItemMeasurement[]>(() => {
    const result: ItemMeasurement[] = [];
    let offset = 0;

    for (let i = 0; i < items.length; i++) {
      const key = keyExtractor(items[i], i);
      const cachedHeight = measurementCache.current.get(key);
      const itemHeight = cachedHeight ?? estimatedItemHeight;

      result.push({ offset, height: itemHeight });
      offset += itemHeight;
    }

    return result;
  }, [items, keyExtractor, estimatedItemHeight]);

  // 전체 콘텐츠 높이
  const totalHeight = useMemo(() => {
    if (measurements.length === 0) return 0;
    const last = measurements[measurements.length - 1];
    return last.offset + last.height;
  }, [measurements]);

  // 보이는 범위 계산
  const visibleRange = useMemo(() => {
    if (measurements.length === 0) {
      return { start: 0, end: 0 };
    }

    // Binary search for start index
    let startIndex = 0;
    let endIndex = measurements.length - 1;

    while (startIndex < endIndex) {
      const mid = Math.floor((startIndex + endIndex) / 2);
      if (measurements[mid].offset + measurements[mid].height < scrollTop) {
        startIndex = mid + 1;
      } else {
        endIndex = mid;
      }
    }

    const start = Math.max(0, startIndex - overscanCount);

    // Find end index
    const viewEnd = scrollTop + containerHeight;
    let end = startIndex;
    while (end < measurements.length && measurements[end].offset < viewEnd) {
      end++;
    }
    end = Math.min(measurements.length, end + overscanCount);

    return { start, end };
  }, [measurements, scrollTop, containerHeight, overscanCount]);

  // 스크롤 핸들러
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement | Window;
    let currentScrollTop: number;
    let currentViewHeight: number;
    let scrollHeight: number;

    if (target === window) {
      currentScrollTop = window.scrollY;
      currentViewHeight = window.innerHeight;
      scrollHeight = document.documentElement.scrollHeight;
    } else {
      const element = target as HTMLElement;
      currentScrollTop = element.scrollTop;
      currentViewHeight = element.clientHeight;
      scrollHeight = element.scrollHeight;
    }

    setScrollTop(currentScrollTop);
    setContainerHeight(currentViewHeight);

    // 무한 스크롤 트리거
    if (
      onLoadMore &&
      hasMore &&
      !loading &&
      !loadMoreTriggered.current &&
      scrollHeight - currentScrollTop - currentViewHeight < loadMoreThreshold
    ) {
      loadMoreTriggered.current = true;
      onLoadMore();
    }
  }, [onLoadMore, hasMore, loading, loadMoreThreshold]);

  // 로딩 상태 변경 시 트리거 리셋
  useEffect(() => {
    if (!loading) {
      loadMoreTriggered.current = false;
    }
  }, [loading]);

  // 스크롤 이벤트 등록
  useEffect(() => {
    const scrollTarget = height ? containerRef.current : window;
    if (!scrollTarget) return;

    // 초기 컨테이너 높이 설정
    if (height) {
      setContainerHeight(containerRef.current?.clientHeight || 0);
    } else {
      setContainerHeight(window.innerHeight);
    }

    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', () => {
      if (height) {
        setContainerHeight(containerRef.current?.clientHeight || 0);
      } else {
        setContainerHeight(window.innerHeight);
      }
    });

    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll);
    };
  }, [height, handleScroll]);

  // 아이템 높이 측정 콜백
  const measureItem = useCallback((key: string, height: number) => {
    const cached = measurementCache.current.get(key);
    if (cached !== height) {
      measurementCache.current.set(key, height);
    }
  }, []);

  // 보이는 아이템들만 렌더링
  const visibleItems = useMemo(() => {
    const result: React.ReactNode[] = [];

    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      const item = items[i];
      const key = keyExtractor(item, i);
      const measurement = measurements[i];

      result.push(
        <VirtualizedItem
          key={key}
          itemKey={key}
          offset={measurement.offset}
          onMeasure={measureItem}
        >
          {renderItem(item, i)}
        </VirtualizedItem>
      );
    }

    return result;
  }, [items, visibleRange, keyExtractor, measurements, renderItem, measureItem]);

  // 빈 상태
  if (items.length === 0 && !loading) {
    return (
      <div className={className}>
        {emptyState || (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            데이터가 없습니다.
          </div>
        )}
      </div>
    );
  }

  const containerStyle: React.CSSProperties = height
    ? { height, overflow: 'auto' }
    : {};

  return (
    <div ref={containerRef} className={className} style={containerStyle}>
      <div
        style={{
          height: totalHeight,
          position: 'relative',
          width: '100%',
        }}
      >
        {visibleItems}
      </div>

      {/* 로딩 인디케이터 */}
      {loading && (
        <div className="py-4">
          {loadingIndicator || (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                불러오는 중...
              </span>
            </div>
          )}
        </div>
      )}

      {/* 더 불러올 데이터 없음 */}
      {!hasMore && items.length > 0 && !loading && (
        <div className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
          모든 데이터를 불러왔습니다.
        </div>
      )}
    </div>
  );
}

// 가상화 아이템 래퍼
const VirtualizedItem = memo(function VirtualizedItem({
  itemKey,
  offset,
  onMeasure,
  children,
}: {
  itemKey: string;
  offset: number;
  onMeasure: (key: string, height: number) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const height = ref.current.getBoundingClientRect().height;
      onMeasure(itemKey, height);
    }
  }, [itemKey, onMeasure, children]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: offset,
        left: 0,
        right: 0,
      }}
    >
      {children}
    </div>
  );
});

// 제네릭 컴포넌트 export
export const VirtualizedList = memo(VirtualizedListInner) as typeof VirtualizedListInner;

/**
 * 간단한 무한 스크롤 훅 (가상화 없이)
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  loading,
  threshold = 200,
  enabled = true,
}: {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  threshold?: number;
  enabled?: boolean;
}) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loading, threshold, enabled]);

  const LoadMoreTrigger = useCallback(
    () => (
      <div ref={loadMoreRef} style={{ height: 1 }} aria-hidden="true" />
    ),
    []
  );

  return { LoadMoreTrigger };
}

/**
 * 스크롤 위치 복원 훅
 */
export function useScrollRestoration(key: string) {
  const scrollPositions = useRef<Map<string, number>>(new Map());

  const saveScrollPosition = useCallback(() => {
    scrollPositions.current.set(key, window.scrollY);
  }, [key]);

  const restoreScrollPosition = useCallback(() => {
    const saved = scrollPositions.current.get(key);
    if (saved !== undefined) {
      window.scrollTo(0, saved);
    }
  }, [key]);

  useEffect(() => {
    restoreScrollPosition();

    return () => {
      saveScrollPosition();
    };
  }, [saveScrollPosition, restoreScrollPosition]);

  return { saveScrollPosition, restoreScrollPosition };
}

export default VirtualizedList;
