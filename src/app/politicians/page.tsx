'use client'

import React, { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, Filter, RotateCcw } from 'lucide-react'
import { usePoliticians } from '@/hooks/usePoliticians'
import SearchFilter from '@/components/SearchFilter'
import { SortDropdown, SortDropdownLabel } from '@/components/common/SortDropdown'
import { Pagination } from '@/components/Pagination'
import { PoliticianCard } from '@/components/features/PoliticianCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { SortValue, SortOption } from '@/types/sort'

/**
 * Loading skeleton for politician cards
 */
function PoliticianCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Skeleton className="w-full h-48" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="pt-3 border-t">
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  )
}

/**
 * Empty state component
 */
function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center max-w-md">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {hasFilters ? '검색 결과가 없습니다' : '정치인이 없습니다'}
        </h3>
        <p className="text-gray-600 mb-6">
          {hasFilters
            ? '다른 검색 조건을 시도해보세요.'
            : '아직 등록된 정치인이 없습니다.'}
        </p>
        {hasFilters && (
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            필터 초기화
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Politicians List Page Component
 * Main page for displaying and filtering politicians
 */
export default function PoliticiansPage() {
  const router = useRouter()
  const {
    politicians,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    itemsPerPage,
    filters,
    hasActiveFilters,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters
  } = usePoliticians()

  /**
   * Navigate to politician detail page
   */
  const handlePoliticianClick = (id: number) => {
    router.push(`/politicians/${id}`)
  }

  /**
   * Get current sort value for dropdown
   */
  const getCurrentSortValue = (): SortValue => {
    const { sortBy = 'name', sortOrder = 'asc' } = filters

    // Map to SortValue format
    if (sortBy === 'name') return sortOrder === 'desc' ? 'name-desc' : 'name'
    if (sortBy === 'rating') return sortOrder === 'desc' ? 'rating-desc' : 'rating'
    if (sortBy === 'popularity') return sortOrder === 'desc' ? 'popularity-desc' : 'popularity'
    if (sortBy === 'recent') return 'recent'
    if (sortBy === 'electionCount') return sortOrder === 'desc' ? 'electionCount-desc' : 'electionCount'

    return 'name'
  }

  /**
   * Custom sort options for the page
   */
  const sortOptions: SortOption[] = [
    { value: 'name', label: '이름순', description: '가나다 순' },
    { value: 'name-desc', label: '이름 역순', description: '가나다 역순' },
    { value: 'rating-desc', label: '평점 높은순', description: '평균 평점 높은 순' },
    { value: 'rating', label: '평점 낮은순', description: '평균 평점 낮은 순' },
    { value: 'popularity-desc', label: '인기순', description: '평가 많은 순' },
    { value: 'popularity', label: '평가 적은순', description: '평가 적은 순' },
    { value: 'recent', label: '최신순', description: '최근 등록순' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">정치인 찾기</h1>
          <p className="text-gray-600">
            대한민국 정치인들의 정보를 확인하고 평가해보세요
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <SearchFilter
              onFilterChange={handleFilterChange}
              initialFilters={filters}
              className="sticky top-4"
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Result Count */}
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">
                    {loading ? (
                      <Skeleton className="h-5 w-24 inline-block" />
                    ) : (
                      <>
                        <span className="font-semibold">{totalCount.toLocaleString()}</span>명의 정치인
                        {hasActiveFilters && ' (필터 적용됨)'}
                      </>
                    )}
                  </span>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-4">
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      초기화
                    </Button>
                  )}
                  <div className="min-w-[200px]">
                    <SortDropdownLabel htmlFor="sort-dropdown">정렬</SortDropdownLabel>
                    <SortDropdown
                      value={getCurrentSortValue()}
                      onChange={handleSortChange}
                      options={sortOptions}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">오류가 발생했습니다: {error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="mt-2"
                >
                  새로고침
                </Button>
              </div>
            )}

            {/* Politicians Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {loading ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, index) => (
                  <PoliticianCardSkeleton key={index} />
                ))
              ) : politicians.length > 0 ? (
                // Politician cards
                politicians.map((politician) => (
                  <PoliticianCard
                    key={politician.id}
                    politician={politician}
                    onClick={() => handlePoliticianClick(politician.id)}
                  />
                ))
              ) : (
                // Empty state
                <EmptyState hasFilters={hasActiveFilters} onReset={resetFilters} />
              )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalCount}
                  itemsPerPage={itemsPerPage}
                  showInfo={true}
                  className="justify-center"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}