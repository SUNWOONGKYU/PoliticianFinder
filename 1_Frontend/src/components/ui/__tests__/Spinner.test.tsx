// Task: P5T1
/**
 * Spinner Component Unit Tests
 * 작업일: 2025-11-10
 * 설명: Spinner 컴포넌트 단위 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Spinner } from '../Spinner';

describe('Spinner Component', () => {
  describe('Rendering', () => {
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
  });

  describe('Visual Styling', () => {
    it('should have correct SVG attributes', () => {
      const { container } = render(<Spinner />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should have circle with correct opacity', () => {
      const { container } = render(<Spinner />);
      const circle = container.querySelector('circle');
      expect(circle).toHaveClass('opacity-25');
    });

    it('should have path with correct opacity', () => {
      const { container } = render(<Spinner />);
      const path = container.querySelector('path');
      expect(path).toHaveClass('opacity-75');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple spinners', () => {
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

    it('should work within containers', () => {
      const { container } = render(
        <div data-testid="container">
          <Spinner />
        </div>
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('animate-spin');
    });

    it('should render without crashing', () => {
      expect(() => render(<Spinner />)).not.toThrow();
    });
  });
});
