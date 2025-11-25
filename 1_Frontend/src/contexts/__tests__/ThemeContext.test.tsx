/**
 * Task ID: P5M9
 * 작업명: M9 - 다크모드 ThemeContext 테스트
 * 작업일: 2025-11-25
 */

import React from 'react';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

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

// matchMedia mock - defaults to light mode
const matchMediaMock = jest.fn().mockImplementation((query: string) => ({
  matches: false,  // Always return light mode preference
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

// Test component that uses the theme
const ThemeConsumer = () => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('light')} data-testid="set-light">
        Set Light
      </button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => setTheme('system')} data-testid="set-system">
        Set System
      </button>
      <button onClick={toggleTheme} data-testid="toggle">
        Toggle
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    cleanup();
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('ThemeProvider', () => {
    it('should render children', () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Child</div>
        </ThemeProvider>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should default to system theme', async () => {
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('system');
    });

    it('should use defaultTheme prop', async () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeConsumer />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });

    it('should load stored theme from localStorage', async () => {
      localStorageMock.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });
  });

  describe('setTheme', () => {
    it('should change theme to light', async () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeConsumer />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      fireEvent.click(screen.getByTestId('set-light'));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'politicianfinder-theme',
        'light'
      );
    });

    it('should change theme to dark', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeConsumer />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      fireEvent.click(screen.getByTestId('set-dark'));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'politicianfinder-theme',
        'dark'
      );
    });

    it('should change theme to system', async () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeConsumer />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      fireEvent.click(screen.getByTestId('set-system'));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('system');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle theme when clicked', async () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeConsumer />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');

      fireEvent.click(screen.getByTestId('toggle'));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // After toggle from dark, should be light
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });
  });

  describe('resolvedTheme', () => {
    it('should resolve dark theme correctly', async () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeConsumer />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    });
  });
});

describe('useTheme hook', () => {
  it('should throw error when used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const TestComponent = () => {
      useTheme();
      return null;
    };

    expect(() => render(<TestComponent />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    );

    consoleSpy.mockRestore();
  });
});
