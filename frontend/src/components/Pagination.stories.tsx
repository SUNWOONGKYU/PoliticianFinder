/**
 * Pagination Component Examples and Usage
 * This file demonstrates various pagination configurations
 */

import React, { useState } from 'react'
import { Pagination, PaginationCompact, PaginationSimple } from './Pagination'

/**
 * Example 1: Full-featured pagination with item info
 */
export function PaginationExample() {
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold">Full Pagination</h3>
      <Pagination
        currentPage={currentPage}
        totalPages={10}
        onPageChange={setCurrentPage}
        totalItems={150}
        itemsPerPage={15}
      />
    </div>
  )
}

/**
 * Example 2: Pagination without first/last buttons
 */
export function PaginationWithoutFirstLastExample() {
  const [currentPage, setCurrentPage] = useState(5)

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold">Without First/Last Buttons</h3>
      <Pagination
        currentPage={currentPage}
        totalPages={20}
        onPageChange={setCurrentPage}
        showFirstLast={false}
      />
    </div>
  )
}

/**
 * Example 3: Pagination without info display
 */
export function PaginationWithoutInfoExample() {
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold">Without Info Display</h3>
      <Pagination
        currentPage={currentPage}
        totalPages={8}
        onPageChange={setCurrentPage}
        showInfo={false}
      />
    </div>
  )
}

/**
 * Example 4: Compact pagination
 */
export function PaginationCompactExample() {
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold">Compact Pagination</h3>
      <PaginationCompact
        currentPage={currentPage}
        totalPages={15}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}

/**
 * Example 5: Simple pagination
 */
export function PaginationSimpleExample() {
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold">Simple Pagination</h3>
      <PaginationSimple
        currentPage={currentPage}
        totalPages={12}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}

/**
 * Example 6: Large dataset pagination
 */
export function PaginationLargeDatasetExample() {
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold">Large Dataset (100 pages)</h3>
      <Pagination
        currentPage={currentPage}
        totalPages={100}
        onPageChange={setCurrentPage}
        totalItems={1000}
        itemsPerPage={10}
        maxVisible={7}
      />
    </div>
  )
}

/**
 * Example 7: Edge case - Single page (should not render)
 */
export function PaginationSinglePageExample() {
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold">Single Page (Hidden)</h3>
      <div className="text-sm text-muted-foreground mb-2">
        Pagination should not render when there's only one page
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={1}
        onPageChange={setCurrentPage}
        totalItems={5}
        itemsPerPage={10}
      />
      <div className="text-xs text-muted-foreground italic">
        {currentPage === 1 && '(Component is hidden as expected)'}
      </div>
    </div>
  )
}

/**
 * Example 8: Custom max visible pages
 */
export function PaginationCustomMaxVisibleExample() {
  const [currentPage, setCurrentPage] = useState(10)

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold">Custom Max Visible (3 pages)</h3>
      <Pagination
        currentPage={currentPage}
        totalPages={20}
        onPageChange={setCurrentPage}
        maxVisible={3}
      />
    </div>
  )
}

/**
 * All examples combined for demonstration
 */
export function PaginationShowcase() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pagination Component Showcase</h1>
        <p className="text-muted-foreground">
          Various pagination configurations and use cases
        </p>
      </div>

      <PaginationExample />
      <PaginationWithoutFirstLastExample />
      <PaginationWithoutInfoExample />
      <PaginationCompactExample />
      <PaginationSimpleExample />
      <PaginationLargeDatasetExample />
      <PaginationSinglePageExample />
      <PaginationCustomMaxVisibleExample />
    </div>
  )
}

export default PaginationShowcase
