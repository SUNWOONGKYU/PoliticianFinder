// Task: P5T1
/**
 * Input Component Unit Tests
 * 작업일: 2025-11-10
 * 설명: Input 컴포넌트 단위 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText(/enter text/i);
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('should render with custom className', () => {
      render(<Input className="custom-input" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('custom-input');
      expect(input).toHaveClass('rounded-md');
    });

    it('should render disabled input', () => {
      render(<Input disabled placeholder="Disabled" />);
      const input = screen.getByPlaceholderText(/disabled/i);
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('Input Types', () => {
    it('should render input element', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('should render email input', () => {
      render(<Input type="email" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<Input type="password" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input', () => {
      render(<Input type="number" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render file input', () => {
      render(<Input type="file" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'file');
      expect(input).toHaveClass('file:border-0');
    });
  });

  describe('User Interactions', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Type here" />);

      const input = screen.getByPlaceholderText(/type here/i) as HTMLInputElement;
      await user.type(input, 'Hello World');

      expect(input.value).toBe('Hello World');
    });

    it('should call onChange handler', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} placeholder="Input" />);

      const input = screen.getByPlaceholderText(/input/i);
      await user.type(input, 'test');

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(4); // One for each character
    });

    it('should handle focus and blur events', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      render(<Input onFocus={handleFocus} onBlur={handleBlur} placeholder="Input" />);

      const input = screen.getByPlaceholderText(/input/i);

      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);

      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should not allow typing when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<Input disabled onChange={handleChange} placeholder="Disabled" />);

      const input = screen.getByPlaceholderText(/disabled/i);
      await user.type(input, 'test');

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should support required attribute', () => {
      render(<Input required data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeRequired();
    });

    it('should support minLength and maxLength', () => {
      render(<Input minLength={3} maxLength={10} data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('minlength', '3');
      expect(input).toHaveAttribute('maxlength', '10');
    });

    it('should support pattern attribute', () => {
      render(<Input pattern="[0-9]*" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('pattern', '[0-9]*');
    });

    it('should support email validation', () => {
      render(<Input type="email" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'email');
    });
  });

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      render(<Input aria-label="Username input" />);
      const input = screen.getByLabelText(/username input/i);
      expect(input).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(<Input aria-describedby="error-message" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-describedby', 'error-message');
    });

    it('should support ref forwarding', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Keyboard" />);

      const input = screen.getByPlaceholderText(/keyboard/i);
      await user.tab();

      expect(input).toHaveFocus();
    });
  });

  describe('Value Control', () => {
    it('should work as controlled component', async () => {
      const user = userEvent.setup();
      const Component = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Controlled"
          />
        );
      };

      render(<Component />);
      const input = screen.getByPlaceholderText(/controlled/i) as HTMLInputElement;

      await user.type(input, 'test');
      expect(input.value).toBe('test');
    });

    it('should work as uncontrolled component with defaultValue', () => {
      render(<Input defaultValue="default text" data-testid="input" />);
      const input = screen.getByTestId('input') as HTMLInputElement;
      expect(input.value).toBe('default text');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<Input value="" data-testid="input" readOnly />);
      const input = screen.getByTestId('input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle readonly attribute', () => {
      render(<Input readOnly value="readonly" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('readonly');
    });

    it('should spread additional props', () => {
      render(
        <Input
          data-testid="input"
          data-custom="value"
          autoComplete="off"
          autoFocus
        />
      );
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('data-custom', 'value');
      expect(input).toHaveAttribute('autocomplete', 'off');
    });

    it('should handle special characters', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Special" />);

      const input = screen.getByPlaceholderText(/special/i) as HTMLInputElement;
      await user.type(input, '!@#$%^&*()');

      expect(input.value).toBe('!@#$%^&*()');
    });
  });
});
