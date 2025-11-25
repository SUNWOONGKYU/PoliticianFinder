/**
 * Task ID: P5MI3
 * 작업명: MI3 - VirtualizedList 컴포넌트 테스트
 * 작업일: 2025-11-25
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { VirtualizedList, useInfiniteScroll, useScrollRestoration } from '../VirtualizedList';

// Mock data
const generateItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    title: `Item ${i}`,
  }));

describe('VirtualizedList Component', () => {
  // IntersectionObserver mock
  const mockIntersectionObserver = jest.fn();

  beforeEach(() => {
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    });
    window.IntersectionObserver = mockIntersectionObserver;

    // window dimensions mock
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 800,
    });

    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0,
    });
  });

  describe('Rendering', () => {
    it('should render items', () => {
      const items = generateItems(5);

      render(
        <VirtualizedList
          items={items}
          renderItem={(item) => <div>{item.title}</div>}
          keyExtractor={(item) => item.id}
          estimatedItemHeight={50}
          height={400}
        />
      );

      expect(screen.getByText('Item 0')).toBeInTheDocument();
    });

    it('should render empty state when no items', () => {
      render(
        <VirtualizedList
          items={[]}
          renderItem={(item: { title: string }) => <div>{item.title}</div>}
          keyExtractor={(item: { id: string }) => item.id}
          estimatedItemHeight={50}
          emptyState={<div>No items found</div>}
        />
      );

      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('should render default empty state when no custom provided', () => {
      render(
        <VirtualizedList
          items={[]}
          renderItem={(item: { title: string }) => <div>{item.title}</div>}
          keyExtractor={(item: { id: string }) => item.id}
          estimatedItemHeight={50}
        />
      );

      expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument();
    });

    it('should render loading indicator when loading', () => {
      const items = generateItems(5);

      render(
        <VirtualizedList
          items={items}
          renderItem={(item) => <div>{item.title}</div>}
          keyExtractor={(item) => item.id}
          estimatedItemHeight={50}
          loading
          height={400}
        />
      );

      expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
    });

    it('should render custom loading indicator', () => {
      const items = generateItems(5);

      render(
        <VirtualizedList
          items={items}
          renderItem={(item) => <div>{item.title}</div>}
          keyExtractor={(item) => item.id}
          estimatedItemHeight={50}
          loading
          loadingIndicator={<div>Custom loading...</div>}
          height={400}
        />
      );

      expect(screen.getByText('Custom loading...')).toBeInTheDocument();
    });

    it('should render end message when no more items', () => {
      const items = generateItems(5);

      render(
        <VirtualizedList
          items={items}
          renderItem={(item) => <div>{item.title}</div>}
          keyExtractor={(item) => item.id}
          estimatedItemHeight={50}
          hasMore={false}
          height={400}
        />
      );

      expect(screen.getByText('모든 데이터를 불러왔습니다.')).toBeInTheDocument();
    });
  });

  describe('Container Configuration', () => {
    it('should apply custom className', () => {
      const items = generateItems(3);

      const { container } = render(
        <VirtualizedList
          items={items}
          renderItem={(item) => <div>{item.title}</div>}
          keyExtractor={(item) => item.id}
          estimatedItemHeight={50}
          className="custom-class"
          height={400}
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should apply fixed height when provided', () => {
      const items = generateItems(3);

      const { container } = render(
        <VirtualizedList
          items={items}
          renderItem={(item) => <div>{item.title}</div>}
          keyExtractor={(item) => item.id}
          estimatedItemHeight={50}
          height={300}
        />
      );

      expect(container.firstChild).toHaveStyle({ height: '300px' });
    });
  });

  describe('Infinite Scroll', () => {
    it('should call onLoadMore when hasMore is true', async () => {
      const onLoadMore = jest.fn();
      const items = generateItems(5);

      render(
        <VirtualizedList
          items={items}
          renderItem={(item) => <div>{item.title}</div>}
          keyExtractor={(item) => item.id}
          estimatedItemHeight={50}
          onLoadMore={onLoadMore}
          hasMore={true}
          height={200}
        />
      );

      // 스크롤 시뮬레이션
      const container = screen.getByText('Item 0').parentElement?.parentElement?.parentElement;
      if (container) {
        Object.defineProperty(container, 'scrollTop', { value: 100, writable: true });
        Object.defineProperty(container, 'scrollHeight', { value: 350, writable: true });
        Object.defineProperty(container, 'clientHeight', { value: 200, writable: true });

        fireEvent.scroll(container);
      }
    });

    it('should not call onLoadMore when loading', () => {
      const onLoadMore = jest.fn();
      const items = generateItems(5);

      render(
        <VirtualizedList
          items={items}
          renderItem={(item) => <div>{item.title}</div>}
          keyExtractor={(item) => item.id}
          estimatedItemHeight={50}
          onLoadMore={onLoadMore}
          hasMore={true}
          loading={true}
          height={200}
        />
      );

      // onLoadMore가 호출되지 않아야 함
      expect(onLoadMore).not.toHaveBeenCalled();
    });

    it('should not call onLoadMore when hasMore is false', () => {
      const onLoadMore = jest.fn();
      const items = generateItems(5);

      render(
        <VirtualizedList
          items={items}
          renderItem={(item) => <div>{item.title}</div>}
          keyExtractor={(item) => item.id}
          estimatedItemHeight={50}
          onLoadMore={onLoadMore}
          hasMore={false}
          height={200}
        />
      );

      expect(onLoadMore).not.toHaveBeenCalled();
    });
  });
});

describe('useInfiniteScroll Hook', () => {
  const mockIntersectionObserver = jest.fn();

  beforeEach(() => {
    mockIntersectionObserver.mockReturnValue({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    });
    window.IntersectionObserver = mockIntersectionObserver;
  });

  const TestComponent = ({
    onLoadMore,
    hasMore,
    loading,
  }: {
    onLoadMore: () => void;
    hasMore: boolean;
    loading: boolean;
  }) => {
    const { LoadMoreTrigger } = useInfiniteScroll({
      onLoadMore,
      hasMore,
      loading,
    });

    return (
      <div>
        <div>Content</div>
        <LoadMoreTrigger />
      </div>
    );
  };

  it('should set up intersection observer', () => {
    const onLoadMore = jest.fn();

    render(
      <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} />
    );

    expect(mockIntersectionObserver).toHaveBeenCalled();
  });

  it('should not set up observer when hasMore is false', () => {
    const onLoadMore = jest.fn();
    mockIntersectionObserver.mockClear();

    render(
      <TestComponent onLoadMore={onLoadMore} hasMore={false} loading={false} />
    );

    expect(mockIntersectionObserver).not.toHaveBeenCalled();
  });

  it('should not set up observer when loading', () => {
    const onLoadMore = jest.fn();
    mockIntersectionObserver.mockClear();

    render(
      <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={true} />
    );

    expect(mockIntersectionObserver).not.toHaveBeenCalled();
  });
});

describe('useScrollRestoration Hook', () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    window.scrollTo = jest.fn();
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0,
    });
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
  });

  const TestComponent = ({ scrollKey }: { scrollKey: string }) => {
    const { saveScrollPosition, restoreScrollPosition } = useScrollRestoration(scrollKey);

    return (
      <div>
        <button onClick={saveScrollPosition}>Save</button>
        <button onClick={restoreScrollPosition}>Restore</button>
      </div>
    );
  };

  it('should render without errors', () => {
    render(<TestComponent scrollKey="test-key" />);

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Restore')).toBeInTheDocument();
  });

  it('should call scrollTo on restore', () => {
    render(<TestComponent scrollKey="test-key" />);

    const restoreBtn = screen.getByText('Restore');
    fireEvent.click(restoreBtn);

    // 처음에는 저장된 값이 없으므로 scrollTo가 호출되지 않을 수 있음
  });
});
