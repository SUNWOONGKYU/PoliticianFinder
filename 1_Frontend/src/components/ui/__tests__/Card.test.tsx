// Task: P5T1
/**
 * Card Component Unit Tests
 * 작업일: 2025-11-10
 * 설명: Card 컴포넌트 및 서브 컴포넌트 단위 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render card component', () => {
      render(<Card data-testid="card">Card content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('bg-white');
    });

    it('should render with custom className', () => {
      render(<Card className="custom-card" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-card');
      expect(card).toHaveClass('rounded-xl');
    });

    it('should support ref forwarding', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Card</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render children correctly', () => {
      render(
        <Card>
          <p>Test content</p>
        </Card>
      );
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('CardHeader', () => {
    it('should render card header', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('p-6');
    });

    it('should apply custom className', () => {
      render(<CardHeader className="custom" data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom');
    });
  });

  describe('CardTitle', () => {
    it('should render as h3 element', () => {
      render(<CardTitle>Title Text</CardTitle>);
      const title = screen.getByText('Title Text');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-heading-md');
      expect(title).toHaveClass('text-gray-900');
    });

    it('should support custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('should render as p element', () => {
      render(<CardDescription>Description text</CardDescription>);
      const desc = screen.getByText('Description text');
      expect(desc.tagName).toBe('P');
      expect(desc).toHaveClass('text-body-sm');
      expect(desc).toHaveClass('text-gray-600');
    });

    it('should support custom className', () => {
      render(<CardDescription className="custom-desc">Desc</CardDescription>);
      const desc = screen.getByText('Desc');
      expect(desc).toHaveClass('custom-desc');
    });
  });

  describe('CardContent', () => {
    it('should render card content area', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('p-6');
      expect(content).toHaveClass('pt-0');
    });

    it('should apply custom className', () => {
      render(<CardContent className="custom" data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom');
    });
  });

  describe('CardFooter', () => {
    it('should render card footer', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
      expect(footer).toHaveClass('p-6');
    });

    it('should apply custom className', () => {
      render(<CardFooter className="custom" data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom');
    });
  });

  describe('Full Card Composition', () => {
    it('should render complete card structure', () => {
      render(
        <Card data-testid="full-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('full-card')).toBeInTheDocument();
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card description')).toBeInTheDocument();
      expect(screen.getByText('Main content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });

    it('should support partial composition', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Simple Card</CardTitle>
          </CardHeader>
          <CardContent>Content only</CardContent>
        </Card>
      );

      expect(screen.getByText('Simple Card')).toBeInTheDocument();
      expect(screen.getByText('Content only')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty card', () => {
      render(<Card data-testid="empty" />);
      expect(screen.getByTestId('empty')).toBeInTheDocument();
    });

    it('should handle multiple children in content', () => {
      render(
        <CardContent>
          <p>First</p>
          <p>Second</p>
          <p>Third</p>
        </CardContent>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('should support additional HTML attributes', () => {
      render(<Card id="custom-id" data-custom="value" data-testid="card">Card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('id', 'custom-id');
      expect(card).toHaveAttribute('data-custom', 'value');
    });
  });
});
