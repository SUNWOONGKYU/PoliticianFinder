'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getPageNumbers } from '@/lib/pagination'

/**
 * Props for the Pagination component
 */
export interface PaginationProps {
  /** Current active page number (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Total number of items (optional, for display) */
  totalItems?: number
  /** Number of items per page (optional, for display) */
  itemsPerPage?: number
  /** Maximum number of page buttons to show (default: 5) */
  maxVisible?: number
  /** Show first/last page buttons (default: true) */
  showFirstLast?: boolean
  /** Show item count info (default: true) */
  showInfo?: boolean
  /** Additional CSS class for the container */
  className?: string
}

/**
 * Pagination component for navigating through paginated data
 * Provides accessible navigation with keyboard support and ARIA labels
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  maxVisible = 5,
  showFirstLast = true,
  showInfo = true,
  className
}: PaginationProps) {
  // Calculate page numbers to display
  const pageNumbers = getPageNumbers(currentPage, totalPages, maxVisible)

  // Calculate item range for display
  const getItemRange = () => {
    if (!totalItems || !itemsPerPage) return null

    const start = (currentPage - 1) * itemsPerPage + 1
    const end = Math.min(currentPage * itemsPerPage, totalItems)

    return { start, end }
  }

  const itemRange = getItemRange()

  // Navigation handlers
  const goToFirstPage = () => onPageChange(1)
  const goToLastPage = () => onPageChange(totalPages)
  const goToPrevPage = () => onPageChange(Math.max(1, currentPage - 1))
  const goToNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1))
  const goToPage = (page: number) => onPageChange(page)

  // Check if buttons should be disabled
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages
  const hasOnlyOnePage = totalPages <= 1

  // Keyboard navigation handler
  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }

  // Don't render if there's only one page or no pages
  if (hasOnlyOnePage) return null

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={cn('flex flex-col gap-4', className)}
    >
      {/* Page info display */}
      {showInfo && itemRange && (
        <div className="text-sm text-muted-foreground text-center sm:text-left">
          <span className="font-medium">
            {itemRange.start}-{itemRange.end}
          </span>
          <span className="mx-1">/</span>
          <span>총 {totalItems?.toLocaleString()}개</span>
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {/* First page button */}
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={goToFirstPage}
            disabled={isFirstPage}
            aria-label="Go to first page"
            aria-disabled={isFirstPage}
            className="hidden sm:inline-flex"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Previous page button */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={goToPrevPage}
          disabled={isFirstPage}
          aria-label="Go to previous page"
          aria-disabled={isFirstPage}
          onKeyDown={(e) => handleKeyDown(e, goToPrevPage)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page number buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum) => {
            const isCurrentPage = pageNum === currentPage

            return (
              <Button
                key={pageNum}
                variant={isCurrentPage ? 'default' : 'outline'}
                size="icon-sm"
                onClick={() => goToPage(pageNum)}
                disabled={isCurrentPage}
                aria-label={`Go to page ${pageNum}`}
                aria-current={isCurrentPage ? 'page' : undefined}
                onKeyDown={(e) => handleKeyDown(e, () => goToPage(pageNum))}
                className={cn(
                  'min-w-8 h-8',
                  isCurrentPage && 'pointer-events-none font-semibold'
                )}
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        {/* Next page button */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={goToNextPage}
          disabled={isLastPage}
          aria-label="Go to next page"
          aria-disabled={isLastPage}
          onKeyDown={(e) => handleKeyDown(e, goToNextPage)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page button */}
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={goToLastPage}
            disabled={isLastPage}
            aria-label="Go to last page"
            aria-disabled={isLastPage}
            className="hidden sm:inline-flex"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Mobile page info */}
      <div className="text-xs text-center text-muted-foreground sm:hidden">
        Page {currentPage} of {totalPages}
      </div>
    </nav>
  )
}

/**
 * Compact version of pagination (for mobile or limited space)
 */
export function PaginationCompact({
  currentPage,
  totalPages,
  onPageChange,
  className
}: Pick<PaginationProps, 'currentPage' | 'totalPages' | 'onPageChange' | 'className'>) {
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  if (totalPages <= 1) return null

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={cn('flex items-center justify-between', className)}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirstPage}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLastPage}
        aria-label="Next page"
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </nav>
  )
}

/**
 * Simple pagination with only prev/next buttons
 */
export function PaginationSimple({
  currentPage,
  totalPages,
  onPageChange,
  showPageInfo = true,
  className
}: Pick<PaginationProps, 'currentPage' | 'totalPages' | 'onPageChange' | 'className'> & {
  showPageInfo?: boolean
}) {
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  if (totalPages <= 1) return null

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={cn('flex items-center justify-center gap-2', className)}
    >
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirstPage}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {showPageInfo && (
        <span className="text-sm text-muted-foreground min-w-20 text-center">
          {currentPage} / {totalPages}
        </span>
      )}

      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLastPage}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}

export default Pagination
