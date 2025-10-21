'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, X, ChevronDown, ChevronUp, Filter, RotateCcw, Check } from 'lucide-react'
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

interface SearchFilterEnhancedProps {
  onFilterChange: (filters: SearchFilterParams) => void
  initialFilters?: SearchFilterParams
  loading?: boolean
  className?: string
}

/**
 * Enhanced SearchFilter Component with improved UX
 * - Visual feedback for active filters
 * - Filter count badges
 * - Improved mobile experience
 * - Loading states
 */
export default function SearchFilterEnhanced({
  onFilterChange,
  initialFilters = {},
  loading = false,
  className = '',
}: SearchFilterEnhancedProps) {
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
   * Calculate active filter count
   */
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchName.length >= 2) count++
    if (searchParty.length >= 2) count++
    if (searchRegion.length >= 2) count++
    count += selectedParties.length
    count += selectedRegions.length
    count += selectedPositions.length
    if (minElectionCount !== undefined) count++
    return count
  }, [
    searchName,
    searchParty,
    searchRegion,
    selectedParties,
    selectedRegions,
    selectedPositions,
    minElectionCount,
  ])

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
   * Remove specific filter
   */
  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case 'searchName':
        setSearchName('')
        break
      case 'searchParty':
        setSearchParty('')
        break
      case 'searchRegion':
        setSearchRegion('')
        break
      case 'party':
        if (value) {
          setSelectedParties(prev => prev.filter(p => p !== value))
        }
        break
      case 'region':
        if (value) {
          setSelectedRegions(prev => prev.filter(r => r !== value))
        }
        break
      case 'position':
        if (value) {
          setSelectedPositions(prev => prev.filter(p => p !== value))
        }
        break
      case 'electionCount':
        setMinElectionCount(undefined)
        break
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
   * Effect for immediate filter changes
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
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? '필터 접기' : '필터 펼치기'}
          disabled={loading}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Desktop header with active filter count */}
      <div className="hidden md:block p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">검색 및 필터</h2>
            {activeFilterCount > 0 && (
              <span className="px-2.5 py-1 text-sm font-semibold bg-blue-600 text-white rounded-full">
                {activeFilterCount}개 필터 적용중
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={loading}
            >
              <RotateCcw className="w-4 h-4" />
              모두 초기화
            </Button>
          )}
        </div>
      </div>

      {/* Filter content */}
      <div className={`p-4 md:p-6 space-y-6 ${isExpanded ? 'block' : 'hidden md:block'}`}>
        {/* Active Filters Pills */}
        {activeFilterCount > 0 && (
          <div className="pb-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {searchName.length >= 2 && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  <span>이름: {searchName}</span>
                  <button
                    onClick={() => removeFilter('searchName')}
                    className="hover:text-blue-900 ml-1"
                    aria-label="이름 검색 제거"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {searchParty.length >= 2 && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  <span>정당: {searchParty}</span>
                  <button
                    onClick={() => removeFilter('searchParty')}
                    className="hover:text-blue-900 ml-1"
                    aria-label="정당 검색 제거"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {searchRegion.length >= 2 && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  <span>지역: {searchRegion}</span>
                  <button
                    onClick={() => removeFilter('searchRegion')}
                    className="hover:text-blue-900 ml-1"
                    aria-label="지역 검색 제거"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {selectedParties.map(party => (
                <div key={party} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  <span>{party}</span>
                  <button
                    onClick={() => removeFilter('party', party)}
                    className="hover:text-green-900 ml-1"
                    aria-label={`${party} 필터 제거`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {selectedRegions.map(region => (
                <div key={region} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  <span>{REGIONS.find(r => r.value === region)?.label || region}</span>
                  <button
                    onClick={() => removeFilter('region', region)}
                    className="hover:text-purple-900 ml-1"
                    aria-label={`${region} 필터 제거`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {selectedPositions.map(position => (
                <div key={position} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  <span>{position}</span>
                  <button
                    onClick={() => removeFilter('position', position)}
                    className="hover:text-orange-900 ml-1"
                    aria-label={`${position} 필터 제거`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {minElectionCount !== undefined && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                  <span>{minElectionCount}선 이상</span>
                  <button
                    onClick={() => removeFilter('electionCount')}
                    className="hover:text-yellow-900 ml-1"
                    aria-label="당선 횟수 필터 제거"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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
                  placeholder="정치인 이름 (2자 이상)"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pr-8"
                  disabled={loading}
                />
                {searchName && (
                  <button
                    onClick={() => setSearchName('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="검색어 지우기"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {searchName.length === 1 && (
                <p className="text-xs text-amber-600">최소 2글자 이상 입력하세요</p>
              )}
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
                  placeholder="정당명 (2자 이상)"
                  value={searchParty}
                  onChange={(e) => setSearchParty(e.target.value)}
                  className="pr-8"
                  disabled={loading}
                />
                {searchParty && (
                  <button
                    onClick={() => setSearchParty('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="검색어 지우기"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {searchParty.length === 1 && (
                <p className="text-xs text-amber-600">최소 2글자 이상 입력하세요</p>
              )}
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
                  placeholder="지역명 (2자 이상)"
                  value={searchRegion}
                  onChange={(e) => setSearchRegion(e.target.value)}
                  className="pr-8"
                  disabled={loading}
                />
                {searchRegion && (
                  <button
                    onClick={() => setSearchRegion('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="검색어 지우기"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {searchRegion.length === 1 && (
                <p className="text-xs text-amber-600">최소 2글자 이상 입력하세요</p>
              )}
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
            <Label className="text-sm font-medium text-gray-700">
              정당 {selectedParties.length > 0 && `(${selectedParties.length})`}
            </Label>
            <div className="flex flex-wrap gap-2">
              {POLITICAL_PARTIES.map((party) => (
                <button
                  key={party.value}
                  onClick={() =>
                    toggleSelection(party.value, selectedParties, setSelectedParties)
                  }
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                    selectedParties.includes(party.value)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={loading}
                >
                  <span className="flex items-center gap-1">
                    {selectedParties.includes(party.value) && <Check className="w-3 h-3" />}
                    {party.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Region filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              지역 {selectedRegions.length > 0 && `(${selectedRegions.length})`}
            </Label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((region) => (
                <button
                  key={region.value}
                  onClick={() =>
                    toggleSelection(region.value, selectedRegions, setSelectedRegions)
                  }
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                    selectedRegions.includes(region.value)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={loading}
                >
                  <span className="flex items-center gap-1">
                    {selectedRegions.includes(region.value) && <Check className="w-3 h-3" />}
                    {region.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Position filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              직책 {selectedPositions.length > 0 && `(${selectedPositions.length})`}
            </Label>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((position) => (
                <button
                  key={position.value}
                  onClick={() =>
                    toggleSelection(position.value, selectedPositions, setSelectedPositions)
                  }
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                    selectedPositions.includes(position.value)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={loading}
                >
                  <span className="flex items-center gap-1">
                    {selectedPositions.includes(position.value) && <Check className="w-3 h-3" />}
                    {position.label}
                  </span>
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
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                    minElectionCount === parseInt(count.value)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={loading}
                >
                  <span className="flex items-center gap-1">
                    {minElectionCount === parseInt(count.value) && <Check className="w-3 h-3" />}
                    {count.label}
                  </span>
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
                className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:opacity-50"
                disabled={loading}
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
                className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:opacity-50"
                disabled={loading}
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
            disabled={loading || activeFilterCount === 0}
          >
            <RotateCcw className="w-4 h-4" />
            초기화
          </Button>
        </div>
      </div>
    </div>
  )
}

// Export named component for convenience
export { SearchFilterEnhanced }