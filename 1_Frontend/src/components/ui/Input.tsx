import React from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    label,
    error,
    success,
    helperText,
    leftIcon,
    rightIcon,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(7)}`;

    // 모바일 최적화: 44px 최소 높이, 16px 폰트 (iOS 자동 확대 방지), 넉넉한 패딩
    const baseStyles = 'flex min-h-[44px] w-full rounded-lg border px-4 py-3 text-base transition-all duration-200 touch-manipulation';
    const focusStyles = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
    const disabledStyles = 'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100';

    const stateStyles = error
      ? 'border-red-500 focus-visible:ring-red-500 bg-red-50'
      : success
        ? 'border-green-500 focus-visible:ring-green-500 bg-green-50'
        : 'border-gray-300 focus-visible:ring-primary-500 bg-white dark:bg-gray-800 dark:border-gray-600';

    const iconPadding = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-label-lg text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={[
              baseStyles,
              focusStyles,
              disabledStyles,
              stateStyles,
              iconPadding,
              'placeholder:text-gray-400',
              className,
            ].filter(Boolean).join(' ')}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-label-md text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-label-md text-gray-500">
            {helperText}
          </p>
        )}
        {success && !error && (
          <p className="mt-1.5 text-label-md text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            확인되었습니다
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
