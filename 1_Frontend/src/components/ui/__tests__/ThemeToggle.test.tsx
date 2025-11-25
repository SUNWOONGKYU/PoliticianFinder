/**
 * Task ID: P5M9
 * 작업명: M9 - ThemeToggle 컴포넌트 테스트
 * 작업일: 2025-11-25
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';
import { ThemeProvider } from '@/contexts/ThemeContext';

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// matchMedia mock
const matchMediaMock = jest.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock,
});

const renderWithTheme = (ui: React.ReactElement, defaultTheme: 'light' | 'dark' | 'system' = 'light') => {
  return render(
    <ThemeProvider defaultTheme={defaultTheme}>
      {ui}
    </ThemeProvider>
  );
};

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.classList.remove('dark');
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render toggle button', async () => {
      renderWithTheme(<ThemeToggle />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render with default size (md)', async () => {
      renderWithTheme(<ThemeToggle />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-10', 'h-10');
    });

    it('should render small size', async () => {
      renderWithTheme(<ThemeToggle size="sm" />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-8', 'h-8');
    });

    it('should render large size', async () => {
      renderWithTheme(<ThemeToggle size="lg" />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-12', 'h-12');
    });

    it('should apply custom className', async () => {
      renderWithTheme(<ThemeToggle className="custom-class" />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Simple Toggle (no menu)', () => {
    it('should toggle theme on click', async () => {
      renderWithTheme(<ThemeToggle />, 'light');

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');

      // Should show sun icon for light mode
      expect(button).toHaveAttribute('aria-label', '다크 모드로 전환');

      fireEvent.click(button);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // After toggle, should show moon icon for dark mode
      expect(button).toHaveAttribute('aria-label', '라이트 모드로 전환');
    });
  });

  describe('Menu Toggle', () => {
    it('should render menu button when showMenu is true', async () => {
      renderWithTheme(<ThemeToggle showMenu />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
    });

    it('should open menu on click', async () => {
      renderWithTheme(<ThemeToggle showMenu />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Menu should be visible
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByText('라이트')).toBeInTheDocument();
      expect(screen.getByText('다크')).toBeInTheDocument();
      expect(screen.getByText('시스템')).toBeInTheDocument();
    });

    it('should change theme when menu item is clicked', async () => {
      renderWithTheme(<ThemeToggle showMenu />, 'light');

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Open menu
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Click dark option
      fireEvent.click(screen.getByText('다크'));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Menu should be closed
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      // Theme should be changed
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'politicianfinder-theme',
        'dark'
      );
    });

    it('should close menu when clicking outside', async () => {
      renderWithTheme(
        <div>
          <ThemeToggle showMenu />
          <div data-testid="outside">Outside</div>
        </div>
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Open menu
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(screen.getByTestId('outside'));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for toggle button', async () => {
      renderWithTheme(<ThemeToggle />, 'light');

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should have proper aria attributes for menu', async () => {
      renderWithTheme(<ThemeToggle showMenu />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have keyboard accessible menu items', async () => {
      renderWithTheme(<ThemeToggle showMenu />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Open menu
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);
    });
  });

  describe('Styling', () => {
    it('should have focus ring styles', async () => {
      renderWithTheme(<ThemeToggle />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
    });

    it('should have rounded-full class', async () => {
      renderWithTheme(<ThemeToggle />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-full');
    });

    it('should have transition class', async () => {
      renderWithTheme(<ThemeToggle />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all');
    });
  });
});
