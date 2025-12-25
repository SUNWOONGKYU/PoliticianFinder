/**
 * 통합 버튼 컴포넌트
 * 프로젝트 전체에서 일관된 버튼 스타일 제공
 */

import React from 'react';
import { Spinner } from './Spinner';

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
    // Base styles (모바일 최적화: touch-action, active 상태)
    const baseStyles = 'font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98]';

    // Variant styles (다크모드 지원)
    const variantStyles = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md disabled:hover:bg-primary-600 disabled:hover:shadow-sm dark:bg-primary-500 dark:hover:bg-primary-600',
      secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500 shadow-sm hover:shadow-md disabled:hover:bg-secondary-600 disabled:hover:shadow-sm dark:bg-secondary-500 dark:hover:bg-secondary-600',
      outline: 'border-2 border-primary-600 text-primary-700 hover:bg-primary-50 focus:ring-primary-500 disabled:hover:bg-transparent dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/30',
      ghost: 'text-primary-700 hover:bg-primary-50 focus:ring-primary-500 dark:text-primary-400 dark:hover:bg-primary-900/30',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md disabled:hover:bg-red-600 disabled:hover:shadow-sm dark:bg-red-500 dark:hover:bg-red-600',
    };

    // Size styles (모바일 최적화: 터치 타겟 확보)
    const sizeStyles = {
      sm: 'px-3 py-2 text-sm min-h-[40px] sm:min-h-[36px]',         // 모바일 40px, 데스크탑 36px
      md: 'px-4 py-2.5 text-base min-h-[44px]',                      // 44px (WCAG)
      lg: 'px-6 py-3 text-lg min-h-[48px]',                          // 48px (큰 터치 타겟)
    };


    // Combine classes
    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `.trim();

    // Spinner variant based on button variant
    const spinnerVariant = variant === 'outline' || variant === 'ghost' ? 'primary' : 'white';

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner size="sm" variant={spinnerVariant} />}
        {!loading && icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
        {!loading && iconRight && <span className="flex-shrink-0">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
