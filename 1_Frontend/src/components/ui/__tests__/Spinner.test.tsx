// Task: P3M1 - Phase 3 Mobile Optimization Testing
/**
 * Spinner System Comprehensive Tests
 * 작업일: 2025-11-25
 * 설명: 모바일 최적화된 Spinner/Loading 시스템 포괄적 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Spinner,
  LoadingPage,
  LoadingSection,
  Skeleton,
  PoliticianCardSkeleton,
  PostCardSkeleton,
  TableRowSkeleton,
} from '../Spinner';

describe('Spinner Component - Phase 3 Mobile Optimization', () => {
  describe('Basic Rendering', () => {
    it('should render spinner element as SVG', () => {
      const { container } = render(<Spinner />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply base animation classes', () => {
      const { container } = render(<Spinner />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('animate-spin');
    });

    it('should render circle and path elements', () => {
      const { container } = render(<Spinner />);
      const circle = container.querySelector('circle');
      const path = container.querySelector('path');
      expect(circle).toBeInTheDocument();
      expect(path).toBeInTheDocument();
    });

    it('should have proper aria attributes', () => {
      const { container } = render(<Spinner />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('role', 'status');
      expect(svg).toHaveAttribute('aria-label', '로딩 중');
    });
  });

  describe('Sizes - All 5 Sizes', () => {
    it('should render xs size (16px - inline)', () => {
      const { container } = render(<Spinner size="xs" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-4');
      expect(svg).toHaveClass('w-4');
    });

    it('should render sm size (20px - button)', () => {
      const { container } = render(<Spinner size="sm" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-5');
      expect(svg).toHaveClass('w-5');
    });

    it('should render md size (32px - default)', () => {
      const { container } = render(<Spinner size="md" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-8');
      expect(svg).toHaveClass('w-8');
    });

    it('should render lg size (48px - page)', () => {
      const { container } = render(<Spinner size="lg" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-12');
      expect(svg).toHaveClass('w-12');
    });

    it('should render xl size (64px - initial)', () => {
      const { container } = render(<Spinner size="xl" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-16');
      expect(svg).toHaveClass('w-16');
    });
  });

  describe('Variants - All 4 Colors', () => {
    it('should render primary variant (default)', () => {
      const { container } = render(<Spinner variant="primary" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-primary-500');
    });

    it('should render secondary variant', () => {
      const { container } = render(<Spinner variant="secondary" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-secondary-500');
    });

    it('should render white variant', () => {
      const { container } = render(<Spinner variant="white" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-white');
    });

    it('should render gray variant', () => {
      const { container } = render(<Spinner variant="gray" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-gray-500');
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      const { container } = render(<Spinner className="custom-class" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('custom-class');
    });

    it('should combine size, variant, and custom class', () => {
      const { container } = render(
        <Spinner size="lg" variant="secondary" className="extra" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-12');
      expect(svg).toHaveClass('w-12');
      expect(svg).toHaveClass('text-secondary-500');
      expect(svg).toHaveClass('extra');
    });
  });
});

describe('LoadingPage Component', () => {
  describe('Rendering', () => {
    it('should render with default message', () => {
      render(<LoadingPage />);
      expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<LoadingPage message="데이터를 불러오는 중..." />);
      expect(screen.getByText('데이터를 불러오는 중...')).toBeInTheDocument();
    });

    it('should render large spinner by default', () => {
      const { container } = render(<LoadingPage />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-12'); // lg size
    });

    it('should accept custom spinner size', () => {
      const { container } = render(<LoadingPage size="xl" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-16'); // xl size
    });

    it('should have proper layout classes', () => {
      const { container } = render(<LoadingPage />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('flex-col');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-center');
    });

    it('should have minimum height', () => {
      const { container } = render(<LoadingPage />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('min-h-[400px]');
    });
  });
});

describe('LoadingSection Component', () => {
  describe('Rendering', () => {
    it('should render with default message', () => {
      render(<LoadingSection />);
      expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<LoadingSection message="섹션 로딩 중..." />);
      expect(screen.getByText('섹션 로딩 중...')).toBeInTheDocument();
    });

    it('should render medium spinner', () => {
      const { container } = render(<LoadingSection />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-8'); // md size
    });

    it('should have default height', () => {
      const { container } = render(<LoadingSection />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('h-64');
    });

    it('should accept custom height', () => {
      const { container } = render(<LoadingSection height="h-96" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('h-96');
    });
  });
});

describe('Skeleton Component', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.querySelector('div');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).toHaveClass('bg-gray-200');
    });

    it('should have default width and height', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveClass('w-full');
      expect(skeleton).toHaveClass('h-4');
    });

    it('should accept custom width', () => {
      const { container } = render(<Skeleton width="w-32" />);
      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveClass('w-32');
    });

    it('should accept custom height', () => {
      const { container } = render(<Skeleton height="h-8" />);
      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveClass('h-8');
    });

    it('should render as circle when specified', () => {
      const { container } = render(<Skeleton circle />);
      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('should render with rounded corners by default', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveClass('rounded');
    });

    it('should have proper ARIA attributes', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveAttribute('role', 'status');
      expect(skeleton).toHaveAttribute('aria-label', '로딩 중');
    });
  });
});

describe('PoliticianCardSkeleton Component', () => {
  describe('Rendering', () => {
    it('should render politician card skeleton structure', () => {
      const { container } = render(<PoliticianCardSkeleton />);
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should have card wrapper with proper styling', () => {
      const { container } = render(<PoliticianCardSkeleton />);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('shadow-md');
    });

    it('should render profile image placeholder (circle)', () => {
      const { container } = render(<PoliticianCardSkeleton />);
      const skeletons = container.querySelectorAll('.rounded-full');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render multiple skeleton elements', () => {
      const { container } = render(<PoliticianCardSkeleton />);
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons.length).toBeGreaterThanOrEqual(5); // Image + name + info lines + score badges
    });
  });
});

describe('PostCardSkeleton Component', () => {
  describe('Rendering', () => {
    it('should render post card skeleton structure', () => {
      const { container } = render(<PostCardSkeleton />);
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should have card wrapper with proper styling', () => {
      const { container } = render(<PostCardSkeleton />);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('border');
    });

    it('should render title skeleton', () => {
      const { container } = render(<PostCardSkeleton />);
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons.length).toBeGreaterThanOrEqual(1);
    });

    it('should render content preview skeletons', () => {
      const { container } = render(<PostCardSkeleton />);
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons.length).toBeGreaterThanOrEqual(3); // Title + content lines
    });

    it('should render metadata skeletons', () => {
      const { container } = render(<PostCardSkeleton />);
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons.length).toBeGreaterThanOrEqual(6); // Title + content + metadata
    });
  });
});

describe('TableRowSkeleton Component', () => {
  describe('Rendering', () => {
    it('should render table row with default 5 columns', () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRowSkeleton />
          </tbody>
        </table>
      );
      const cells = container.querySelectorAll('td');
      expect(cells).toHaveLength(5);
    });

    it('should render custom number of columns', () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRowSkeleton columns={3} />
          </tbody>
        </table>
      );
      const cells = container.querySelectorAll('td');
      expect(cells).toHaveLength(3);
    });

    it('should have proper table row styling', () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRowSkeleton />
          </tbody>
        </table>
      );
      const row = container.querySelector('tr');
      expect(row).toHaveClass('border-b');
      expect(row).toHaveClass('border-gray-200');
    });

    it('should render skeleton in each cell', () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRowSkeleton columns={3} />
          </tbody>
        </table>
      );
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons).toHaveLength(3);
    });
  });
});

describe('Edge Cases and Integration', () => {
  describe('Multiple Components', () => {
    it('should render multiple spinners', () => {
      const { container } = render(
        <>
          <Spinner />
          <Spinner />
          <Spinner />
        </>
      );
      const svgs = container.querySelectorAll('svg');
      expect(svgs).toHaveLength(3);
    });

    it('should render multiple skeleton types together', () => {
      const { container } = render(
        <>
          <PoliticianCardSkeleton />
          <PostCardSkeleton />
        </>
      );
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons.length).toBeGreaterThan(10);
    });
  });

  describe('Container Compatibility', () => {
    it('should work within containers', () => {
      const { container } = render(
        <div data-testid="container">
          <Spinner />
          <LoadingSection />
          <Skeleton />
        </div>
      );
      expect(screen.getByTestId('container')).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render without crashing', () => {
      expect(() => render(<Spinner />)).not.toThrow();
      expect(() => render(<LoadingPage />)).not.toThrow();
      expect(() => render(<LoadingSection />)).not.toThrow();
      expect(() => render(<Skeleton />)).not.toThrow();
      expect(() => render(<PoliticianCardSkeleton />)).not.toThrow();
      expect(() => render(<PostCardSkeleton />)).not.toThrow();
      expect(() => render(<TableRowSkeleton />)).not.toThrow();
    });
  });
});
