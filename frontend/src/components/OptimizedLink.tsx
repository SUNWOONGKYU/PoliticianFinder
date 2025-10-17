/**
 * Optimized Link Component
 * P4F2: Lighthouse 90+ - Performance Optimization
 *
 * Enhanced Link component with prefetch optimization
 */

'use client'

import Link, { LinkProps } from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, AnchorHTMLAttributes } from 'react'

interface OptimizedLinkProps extends LinkProps {
  children: ReactNode
  className?: string
  activeClassName?: string
  'aria-label'?: string
  onClick?: AnchorHTMLAttributes<HTMLAnchorElement>['onClick']
}

/**
 * Optimized Link component with active state and accessibility
 */
export function OptimizedLink({
  children,
  className = '',
  activeClassName = '',
  href,
  prefetch = true,
  'aria-label': ariaLabel,
  onClick,
  ...props
}: OptimizedLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={`${className} ${isActive ? activeClassName : ''}`.trim()}
      aria-label={ariaLabel}
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
      {...props}
    >
      {children}
    </Link>
  )
}

/**
 * External Link component with security attributes
 */
export function ExternalLink({
  children,
  href,
  className = '',
  'aria-label': ariaLabel,
  ...props
}: {
  children: ReactNode
  href: string
  className?: string
  'aria-label'?: string
}) {
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel || `${children} (새 창에서 열림)`}
      {...props}
    >
      {children}
      <span className="sr-only"> (새 창에서 열림)</span>
    </a>
  )
}
