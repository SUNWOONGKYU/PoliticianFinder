'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Search, X, ChevronDown, ChevronUp, Filter, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  SearchFilterParams,
  POLITICAL_PARTIES,
  REGIONS,
  POSITIONS,
  SORT_OPTIONS,
  ELECTION_COUNTS,
  type SortOption,
} from '@/types/filter'

interface SearchFilterProps {
  onFilterChange: (filters: SearchFilterParams) => void
  initialFilters?: SearchFilterParams
  className?: string
}

/**
 * SearchFilter Component
 *
 * Provides comprehensive search and filtering functionality for politician lists
 * with debounced search, responsive design, and collapsible mobile view
 */
export default function SearchFilter({
  onFilterChange,
  initialFilters = {},
  className = '',
}: SearchFilterProps) {
  // Expanded state for mobile
  const [isExpanded, setIsExpanded] = useState(false)

  // Search states
  const [searchName, setSearchName] = useState(initialFilters.searchName || '')
  const [searchParty, setSearchParty] = useState(initialFilters.searchParty || '')
  const [searchRegion, setSearchRegion] = useState(initialFilters.searchRegion || '')

  // Filter states
  const [selectedParties, setSelectedParties] = useState<string[]>(
    initialFilters.parties || []
  )
  const [selectedRegions, setSelectedRegions] = useState<string[]>(
    initialFilters.regions || []
  )
  const [selectedPositions, setSelectedPositions] = useState<string[]>(
    initialFilters.positions || []
  )
  const [minElectionCount, setMinElectionCount] = useState<number | undefined>(
    initialFilters.minElectionCount
  )

  // Sort states
  const [sortBy, setSortBy] = useState<SortOption>(initialFilters.sortBy || 'name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    initialFilters.sortOrder || 'asc'
  )

  // Debounce timer
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  /**
   * Build filter object from current state
   */
  const buildFilters = useCallback((): SearchFilterParams => {
    const filters: SearchFilterParams = {
      sortBy,
      sortOrder,
    }

    // Add search fields if they meet minimum length requirement
    if (searchName.length >= 2) {
      filters.searchName = searchName
    }
    if (searchParty.length >= 2) {
      filters.searchParty = searchParty
    }
    if (searchRegion.length >= 2) {
      filters.searchRegion = searchRegion
    }

    // Add filter arrays if not empty
    if (selectedParties.length > 0) {
      filters.parties = selectedParties
    }
    if (selectedRegions.length > 0) {
      filters.regions = selectedRegions
    }
    if (selectedPositions.length > 0) {
      filters.positions = selectedPositions
    }
    if (minElectionCount !== undefined) {
      filters.minElectionCount = minElectionCount
    }

    return filters
  }, [
    searchName,
    searchParty,
    searchRegion,
    selectedParties,
    selectedRegions,
    selectedPositions,
    minElectionCount,
    sortBy,
    sortOrder,
  ])

  /**
   * Handle filter change with debouncing for search inputs
   */
  const handleFilterChange = useCallback(
    (immediate = false) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      if (immediate) {
        onFilterChange(buildFilters())
      } else {
        // Debounce search inputs by 500ms
        const timer = setTimeout(() => {
          onFilterChange(buildFilters())
        }, 500)
        setDebounceTimer(timer)
      }
    },
    [debounceTimer, buildFilters, onFilterChange]
  )

  /**
   * Reset all filters to initial state
   */
  const handleReset = () => {
    setSearchName('')
    setSearchParty('')
    setSearchRegion('')
    setSelectedParties([])
    setSelectedRegions([])
    setSelectedPositions([])
    setMinElectionCount(undefined)
    setSortBy('name')
    setSortOrder('asc')

    // Clear any pending debounce
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Immediately apply reset
    onFilterChange({
      sortBy: 'name',
      sortOrder: 'asc',
    })
  }

  /**
   * Toggle selection in multi-select filters
   */
  const toggleSelection = (
    value: string,
    selected: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selected.includes(value)) {
      setter(selected.filter((item) => item !== value))
    } else {
      setter([...selected, value])
    }
  }

  /**
   * Effect for debounced search
   */
  useEffect(() => {
    handleFilterChange()
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [searchName, searchParty, searchRegion])

  /**
   * Effect for immediate filter changes (dropdowns, buttons)
   */
  useEffect(() => {
    handleFilterChange(true)
  }, [
    selectedParties,
    selectedRegions,
    selectedPositions,
    minElectionCount,
    sortBy,
    sortOrder,
  ])

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      {/* Mobile toggle button */}
      <div className="md:hidden p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">검색 및 필터</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? '필터 접기' : '필터 펼치기'}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Filter content */}
      <div className={`p-4 md:p-6 space-y-6 ${isExpanded ? 'block' : 'hidden md:block'}`}>
        {/* Search Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Search className="w-4 h-4" />
            검색
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Name search */}
            <div className="space-y-2">
              <Label htmlFor="search-name" className="text-sm font-medium text-gray-700">
                이름
              </Label>
              <div className="relative">
                <Input
                  id="search-name"
                  type="text"
                  placeholder="정치인 이름 검색"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pr-8"
                />
                {searchName && (
                  <button
                    onClick={() => setSearchName('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="검색어 지우기"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Party search */}
            <div className="space-y-2">
              <Label htmlFor="search-party" className="text-sm font-medium text-gray-700">
                소속 정당
              </Label>
              <div className="relative">
                <Input
                  id="search-party"
                  type="text"
                  placeholder="정당명 검색"
                  value={searchParty}
                  onChange={(e) => setSearchParty(e.target.value)}
                  className="pr-8"
                />
                {searchParty && (
                  <button
                    onClick={() => setSearchParty('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="검색어 지우기"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Region search */}
            <div className="space-y-2">
              <Label htmlFor="search-region" className="text-sm font-medium text-gray-700">
                지역구
              </Label>
              <div className="relative">
                <Input
                  id="search-region"
                  type="text"
                  placeholder="지역명 검색"
                  value={searchRegion}
                  onChange={(e) => setSearchRegion(e.target.value)}
                  className="pr-8"
                />
                {searchRegion && (
                  <button
                    onClick={() => setSearchRegion('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="검색어 지우기"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            필터
          </h3>

          {/* Party filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">정당</Label>
            <div className="flex flex-wrap gap-2">
              {POLITICAL_PARTIES.map((party) => (
                <button
                  key={party.value}
                  onClick={() =>
                    toggleSelection(party.value, selectedParties, setSelectedParties)
                  }
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedParties.includes(party.value)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {party.label}
                </button>
              ))}
            </div>
          </div>

          {/* Region filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">지역</Label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((region) => (
                <button
                  key={region.value}
                  onClick={() =>
                    toggleSelection(region.value, selectedRegions, setSelectedRegions)
                  }
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedRegions.includes(region.value)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {region.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">직책</Label>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((position) => (
                <button
                  key={position.value}
                  onClick={() =>
                    toggleSelection(position.value, selectedPositions, setSelectedPositions)
                  }
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedPositions.includes(position.value)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {position.label}
                </button>
              ))}
            </div>
          </div>

          {/* Election count filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">당선 횟수</Label>
            <div className="flex flex-wrap gap-2">
              {ELECTION_COUNTS.map((count) => (
                <button
                  key={count.value}
                  onClick={() =>
                    setMinElectionCount(
                      minElectionCount === parseInt(count.value)
                        ? undefined
                        : parseInt(count.value)
                    )
                  }
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    minElectionCount === parseInt(count.value)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {count.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sort Section */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">정렬</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sort by */}
            <div className="space-y-2">
              <Label htmlFor="sort-by" className="text-sm font-medium text-gray-700">
                정렬 기준
              </Label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort order */}
            <div className="space-y-2">
              <Label htmlFor="sort-order" className="text-sm font-medium text-gray-700">
                정렬 순서
              </Label>
              <select
                id="sort-order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="asc">오름차순</option>
                <option value="desc">내림차순</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full md:w-auto"
          >
            <RotateCcw className="w-4 h-4" />
            초기화
          </Button>
        </div>
      </div>
    </div>
  )
}

// Named export for convenience
export { SearchFilter }
