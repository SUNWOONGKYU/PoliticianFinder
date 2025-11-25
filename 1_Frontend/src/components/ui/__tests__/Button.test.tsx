// Task: P3M1 - Phase 3 Mobile Optimization Testing
/**
 * Button Component Comprehensive Tests
 * 작업일: 2025-11-25
 * 설명: 모바일 최적화된 Button 컴포넌트 포괄적 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button Component - Phase 3 Mobile Optimization', () => {
  describe('Rendering', () => {
    it('should render button with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary-600');
      expect(button).toHaveClass('text-base');
    });

    it('should render button with custom className', () => {
      render(<Button className="custom-class">Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toHaveClass('custom-class');
    });

    it('should render disabled button', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('Variants - All 5 Types', () => {
    it('should render primary variant (default)', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button', { name: /primary/i });
      expect(button).toHaveClass('bg-primary-600');
      expect(button).toHaveClass('hover:bg-primary-700');
      expect(button).toHaveClass('text-white');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button', { name: /secondary/i });
      expect(button).toHaveClass('bg-secondary-600');
      expect(button).toHaveClass('hover:bg-secondary-700');
      expect(button).toHaveClass('text-white');
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button', { name: /outline/i });
      expect(button).toHaveClass('border-2');
      expect(button).toHaveClass('border-primary-600');
      expect(button).toHaveClass('text-primary-700');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button', { name: /ghost/i });
      expect(button).toHaveClass('text-primary-700');
      expect(button).toHaveClass('hover:bg-primary-50');
    });

    it('should render danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button', { name: /danger/i });
      expect(button).toHaveClass('bg-red-600');
      expect(button).toHaveClass('hover:bg-red-700');
    });
  });

  describe('Sizes - All 3 Sizes', () => {
    it('should render small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button', { name: /small/i });
      expect(button).toHaveClass('text-sm');
      expect(button).toHaveClass('min-h-[32px]');
    });

    it('should render medium size (default)', () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole('button', { name: /medium/i });
      expect(button).toHaveClass('text-base');
      expect(button).toHaveClass('min-h-[40px]');
    });

    it('should render large size with WCAG touch target', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button', { name: /large/i });
      expect(button).toHaveClass('text-lg');
      expect(button).toHaveClass('min-h-touch'); // 44px for accessibility
    });
  });

  describe('Loading State', () => {
    it('should show spinner when loading', () => {
      const { container } = render(<Button loading>Loading</Button>);
      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should disable button when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should hide icon when loading', () => {
      const { container } = render(
        <Button loading icon={<span data-testid="icon">Icon</span>}>
          Loading
        </Button>
      );
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });

    it('should use white spinner for primary variant', () => {
      const { container } = render(<Button loading variant="primary">Loading</Button>);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('text-white');
    });

    it('should use primary spinner for outline variant', () => {
      const { container } = render(<Button loading variant="outline">Loading</Button>);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('text-primary-500');
    });
  });

  describe('Icons - Left and Right', () => {
    it('should render left icon', () => {
      render(
        <Button icon={<span data-testid="left-icon">←</span>}>
          With Icon
        </Button>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render right icon', () => {
      render(
        <Button iconRight={<span data-testid="right-icon">→</span>}>
          With Icon
        </Button>
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should render both left and right icons', () => {
      render(
        <Button
          icon={<span data-testid="left-icon">←</span>}
          iconRight={<span data-testid="right-icon">→</span>}
        >
          Both Icons
        </Button>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Full Width', () => {
    it('should render full width button', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button', { name: /full width/i });
      expect(button).toHaveClass('w-full');
    });

    it('should not be full width by default', () => {
      render(<Button>Normal Width</Button>);
      const button = screen.getByRole('button', { name: /normal width/i });
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('Interactions', () => {
    it('should call onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);

      const button = screen.getByRole('button', { name: /disabled/i });
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} loading>Loading</Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle type attribute correctly', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('Accessibility', () => {
    it('should have focus ring styles', () => {
      render(<Button>Accessible</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-offset-2');
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Custom label">Icon</Button>);
      const button = screen.getByLabelText(/custom label/i);
      expect(button).toBeInTheDocument();
    });

    it('should support ref forwarding', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);

      const button = screen.getByRole('button', { name: /keyboard/i });
      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    it('should have proper ARIA states when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Edge Cases', () => {
    it('should combine multiple classes correctly', () => {
      render(
        <Button variant="danger" size="lg" className="extra-class">
          Multi
        </Button>
      );
      const button = screen.getByRole('button', { name: /multi/i });
      expect(button).toHaveClass('bg-red-600');
      expect(button).toHaveClass('text-lg');
      expect(button).toHaveClass('extra-class');
    });

    it('should spread additional props', () => {
      render(<Button data-testid="custom-button" title="tooltip">Button</Button>);
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('title', 'tooltip');
    });

    it('should handle children as string', () => {
      render(<Button>String child</Button>);
      expect(screen.getByText('String child')).toBeInTheDocument();
    });

    it('should handle children as JSX', () => {
      render(
        <Button>
          <span>JSX child</span>
        </Button>
      );
      expect(screen.getByText('JSX child')).toBeInTheDocument();
    });
  });

  describe('Mobile Touch Targets (WCAG)', () => {
    it('should have minimum touch target for large size', () => {
      render(<Button size="lg">Touch Target</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-touch'); // 44px minimum
    });

    it('should have inline-flex for proper alignment', () => {
      render(<Button>Flex Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
    });
  });

  describe('Responsive Behavior', () => {
    it('should have proper gap between elements', () => {
      render(
        <Button icon={<span>Icon</span>}>
          Text
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('gap-2');
    });

    it('should have shadow on primary and secondary', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('shadow-sm');

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('shadow-sm');
    });
  });
});
