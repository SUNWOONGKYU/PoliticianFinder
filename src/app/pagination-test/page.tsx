'use client'

import React, { useState } from 'react'
import { Pagination, PaginationCompact, PaginationSimple } from '@/components/Pagination'

/**
 * Test page for Pagination components
 * Demonstrates all pagination variations with real data simulation
 */
export default function PaginationTestPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Simulated data
  const totalItems = 150
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Simulated data for display
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const mockData = Array.from(
    { length: Math.min(itemsPerPage, totalItems - (currentPage - 1) * itemsPerPage) },
    (_, i) => ({
      id: startItem + i,
      name: `Item ${startItem + i}`,
      description: `This is item number ${startItem + i} in the list`
    })
  )

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pagination Component Test
          </h1>
          <p className="text-lg text-gray-600">
            Testing all pagination variations with mock data
          </p>
        </div>

        {/* Settings Panel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Settings</h2>
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Items per page
              </label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1) // Reset to first page
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              <p>Total Items: <span className="font-semibold">{totalItems}</span></p>
              <p>Total Pages: <span className="font-semibold">{totalPages}</span></p>
              <p>Current Page: <span className="font-semibold">{currentPage}</span></p>
            </div>
          </div>
        </div>

        {/* Mock Data Display */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Data (Items {startItem}-{endItem} of {totalItems})
          </h2>
          <div className="space-y-3">
            {mockData.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <span className="text-xs text-gray-500">ID: {item.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Full Pagination */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Full Pagination</h2>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            showFirstLast={true}
            showInfo={true}
          />
        </div>

        {/* Pagination without First/Last */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Without First/Last Buttons</h2>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            showFirstLast={false}
            showInfo={true}
          />
        </div>

        {/* Pagination without Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Without Info Display</h2>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showFirstLast={true}
            showInfo={false}
          />
        </div>

        {/* Compact Pagination */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Compact Pagination</h2>
          <PaginationCompact
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Simple Pagination */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Simple Pagination</h2>
          <PaginationSimple
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showPageInfo={true}
          />
        </div>

        {/* Custom Max Visible Pages */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Custom Max Visible (3 pages)</h2>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            maxVisible={3}
          />
        </div>

        {/* Responsive Test */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Responsive Behavior</h2>
          <p className="text-sm text-gray-600 mb-4">
            The pagination adapts to different screen sizes. First/Last buttons are hidden on mobile.
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        </div>

        {/* Edge Cases */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Edge Cases</h2>

          {/* Single page */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Single Page (Should be hidden)</h3>
            <div className="p-4 border border-gray-200 rounded-md">
              <Pagination
                currentPage={1}
                totalPages={1}
                onPageChange={() => {}}
                totalItems={5}
                itemsPerPage={10}
              />
              <p className="text-sm text-gray-500 italic">
                No pagination shown when totalPages is 1 or less
              </p>
            </div>
          </div>

          {/* No pages */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">No Pages (Should be hidden)</h3>
            <div className="p-4 border border-gray-200 rounded-md">
              <Pagination
                currentPage={1}
                totalPages={0}
                onPageChange={() => {}}
              />
              <p className="text-sm text-gray-500 italic">
                No pagination shown when there are no pages
              </p>
            </div>
          </div>

          {/* Many pages */}
          <div>
            <h3 className="text-lg font-medium mb-2">Many Pages (100 pages)</h3>
            <Pagination
              currentPage={50}
              totalPages={100}
              onPageChange={() => {}}
              totalItems={1000}
              itemsPerPage={10}
            />
          </div>
        </div>

        {/* Accessibility Features */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Accessibility Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>ARIA labels for screen readers</li>
            <li>Keyboard navigation support (Tab, Enter, Space)</li>
            <li>Proper focus management</li>
            <li>Disabled state for unavailable actions</li>
            <li>Semantic HTML with proper roles</li>
            <li>High contrast mode support</li>
          </ul>
        </div>
      </div>
    </div>
  )
}