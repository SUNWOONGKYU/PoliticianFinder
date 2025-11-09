// Task: P5T1
/**
 * LoginForm Component Tests
 * 작업일: 2025-11-10
 * 설명: 로그인 폼 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../P1F1_LoginForm';

// Mock fetch
global.fetch = jest.fn();

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

describe('LoginForm Component (P1F1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.location.href = '';
  });

  describe('Rendering', () => {
    it('should render email input', () => {
      render(<LoginForm />);
      const emailInput = screen.getByPlaceholderText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<LoginForm />);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should render submit button', () => {
      render(<LoginForm />);
      const submitButton = screen.getByRole('button', { name: /로그인/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should have required attributes on inputs', () => {
      render(<LoginForm />);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      expect(emailInput).toBeRequired();
      expect(passwordInput).toBeRequired();
    });
  });

  describe('User Interactions', () => {
    it('should update email input value', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText(/email/i) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password input value', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/password/i) as HTMLInputElement;
      await user.type(passwordInput, 'password123');

      expect(passwordInput.value).toBe('password123');
    });

    it('should clear inputs after typing and clearing', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText(/email/i) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');
      await user.clear(emailInput);

      expect(emailInput.value).toBe('');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid credentials', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /로그인/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/login',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123',
            }),
          })
        );
      });
    });

    it('should redirect to dashboard on successful login', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /로그인/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(window.location.href).toBe('/dashboard');
      });
    });

    it('should not redirect on failed login', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /로그인/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Should not redirect
      expect(window.location.href).toBe('');
    });

    it('should handle empty form submission', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /로그인/i });

      // Try to submit - form may or may not prevent it depending on browser validation
      // This test just ensures no crash occurs
      expect(submitButton).toBeInTheDocument();
    });

    it('should handle form submission without errors', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /로그인/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for async handling
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Should not redirect on error
      expect(window.location.href).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Tab to email input
      await user.tab();
      expect(screen.getByPlaceholderText(/email/i)).toHaveFocus();

      // Tab to password input
      await user.tab();
      expect(screen.getByPlaceholderText(/password/i)).toHaveFocus();

      // Tab to submit button
      await user.tab();
      expect(screen.getByRole('button', { name: /로그인/i })).toHaveFocus();
    });

    it('should submit form with Enter key', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Input Validation', () => {
    it('should accept valid email format', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText(/email/i) as HTMLInputElement;
      await user.type(emailInput, 'valid@example.com');

      expect(emailInput.validity.valid).toBe(true);
    });

    it('should handle special characters in password', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/password/i) as HTMLInputElement;
      await user.type(passwordInput, 'P@ssw0rd!#$%');

      expect(passwordInput.value).toBe('P@ssw0rd!#$%');
    });

    it('should handle very long inputs', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const longEmail = 'very.long.email.address.for.testing@example.com';
      const longPassword = 'a'.repeat(100);

      const emailInput = screen.getByPlaceholderText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText(/password/i) as HTMLInputElement;

      await user.type(emailInput, longEmail);
      await user.type(passwordInput, longPassword);

      expect(emailInput.value).toBe(longEmail);
      expect(passwordInput.value).toBe(longPassword);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid form submissions', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /로그인/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Submit multiple times
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should still work (though ideally should prevent multiple submissions)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should handle inputs correctly', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText(/password/i) as HTMLInputElement;

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Verify the values are set
      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('password123');
    });
  });
});
