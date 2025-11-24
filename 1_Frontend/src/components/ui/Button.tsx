/**
 * 통합 버튼 컴포넌트
 * 프로젝트 전체에서 일관된 버튼 스타일 제공
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 버튼 스타일 variant
   * - primary: 주요 액션 (주황색)
   * - secondary: 보조 액션 (보라색)
   * - outline: 테두리 버튼
   * - ghost: 투명 버튼
   * - danger: 위험한 액션 (빨간색)
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

  /**
   * 버튼 크기
   * - sm: 작은 버튼 (32px)
   * - md: 중간 버튼 (40px)
   * - lg: 큰 버튼 (44px+)
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * 전체 너비 버튼
   */
  fullWidth?: boolean;

  /**
   * 로딩 상태
   */
  loading?: boolean;

  /**
   * 아이콘 (왼쪽)
   */
  icon?: React.ReactNode;

  /**
   * 아이콘 (오른쪽)
   */
  iconRight?: React.ReactNode;

  /**
   * 자식 요소
   */
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      iconRight,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';

    // Variant styles
    const variantStyles = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md disabled:hover:bg-primary-600 disabled:hover:shadow-sm',
      secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500 shadow-sm hover:shadow-md disabled:hover:bg-secondary-600 disabled:hover:shadow-sm',
      outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 disabled:hover:bg-transparent',
      ghost: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md disabled:hover:bg-red-600 disabled:hover:shadow-sm',
    };

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm min-h-[32px]',
      md: 'px-4 py-2 text-base min-h-[40px]',
      lg: 'px-6 py-3 text-lg min-h-touch',  // 44px (WCAG)
    };

    // Loading spinner
    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    );

    // Combine classes
    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `.trim();

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {!loading && icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
        {!loading && iconRight && <span className="flex-shrink-0">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
