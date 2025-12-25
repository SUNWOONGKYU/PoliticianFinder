import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// 반응형 패딩 (모바일 최적화)
const paddingStyles = {
  none: '',
  sm: 'p-3 sm:p-4',           // 모바일: 12px, 데스크탑: 16px
  md: 'p-4 sm:p-6',           // 모바일: 16px, 데스크탑: 24px
  lg: 'p-5 sm:p-6 lg:p-8',    // 모바일: 20px, 태블릿: 24px, 데스크탑: 32px
};

const variantStyles = {
  default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  outline: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
  elevated: 'bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow',
  interactive: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all cursor-pointer',
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'none', ...props }, ref) => (
    <div
      ref={ref}
      className={[
        'rounded-xl',
        variantStyles[variant],
        paddingStyles[padding],
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={['flex flex-col space-y-1.5 p-6 pb-4', className].filter(Boolean).join(' ')}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={['text-heading-md text-gray-900 dark:text-white', className].filter(Boolean).join(' ')}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={['text-body-sm text-gray-600 dark:text-gray-400', className].filter(Boolean).join(' ')}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={['p-6 pt-0', className].filter(Boolean).join(' ')}
    {...props}
  />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={['flex items-center gap-3 p-6 pt-4 border-t border-gray-100 dark:border-gray-700', className].filter(Boolean).join(' ')}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

// 통계 카드 (대시보드용)
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, icon, trend, description, className, ...props }, ref) => (
    <Card ref={ref} variant="default" className={className} {...props}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-label-lg text-gray-600 dark:text-gray-400">{title}</p>
          {icon && (
            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              {icon}
            </div>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-heading-xl text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <span className={`text-label-md flex items-center gap-0.5 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                {trend.isPositive ? (
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                )}
              </svg>
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-body-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
    </Card>
  )
);
StatCard.displayName = 'StatCard';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, StatCard };
